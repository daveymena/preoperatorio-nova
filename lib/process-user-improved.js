/**
 * Procesamiento mejorado de usuarios con análisis y corrección automática
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const FormAnalyzer = require('./form-analyzer');
const { run } = require('./db');
const { sendEvidenceEmail } = require('./emails');

const CONFIG = {
  url: 'https://www.conectartv.com/SRCGC/Movilidad/preop_moto.php',
  maxRetries: 3,
  timeout: 60000
};

// Usar ruta relativa al proyecto en desarrollo, /app/logs en producción
const logsDir = process.env.NODE_ENV === 'production' ? '/app/logs' : './logs';

function logToFile(message) {
  const timestamp = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
  const logMessage = `[${timestamp}] ${message}\n`;
  try {
    fs.appendFileSync(`${logsDir}/worker.log`, logMessage);
  } catch (e) {
    console.error('Error escribiendo log:', e.message);
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processUserImproved(user) {
  const msgInicio = `🚀 Procesando a: ${user.nombre} (${user.placa})`;
  console.log(msgInicio);
  logToFile(msgInicio);

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const shot = `evidence_${user.cedula}.png`;
  const formAnalyzer = new FormAnalyzer(null, user);
  let success = false;

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Actualizar el analizador con la página
    formAnalyzer.page = page;

    const msgNavegando = `  [${user.nombre}] Navegando a login...`;
    console.log(msgNavegando);
    logToFile(msgNavegando);

    await page.goto(CONFIG.url, { waitUntil: 'networkidle0', timeout: CONFIG.timeout });

    // Login
    try {
      await page.waitForSelector('#email', { timeout: 10000 });
      await page.type('#email', user.email || user.cedula, { delay: 50 });
      await page.type('#password', user.password, { delay: 50 });

      const msgClick = `  [${user.nombre}] Click en Ingresar...`;
      console.log(msgClick);
      logToFile(msgClick);

      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {})
      ]);
      await sleep(3000);
    } catch (e) {
      const msgNoLogin = `  [${user.nombre}] No se detectó formulario de login o ya está logueado.`;
      console.log(msgNoLogin);
      logToFile(msgNoLogin);
    }

    await page.goto(CONFIG.url, { waitUntil: 'networkidle0', timeout: CONFIG.timeout });
    await sleep(3000);

    // Llenado inicial
    const km = (user.km_actual || 0) + 1;

    const msgLlenando = `  [${user.nombre}] Llenando formulario (KM: ${km})...`;
    console.log(msgLlenando);
    logToFile(msgLlenando);

    await page.evaluate((u, km) => {
      // Supervisor
      const sup = document.querySelector('input[name="supervisor"]');
      if (sup) {
        sup.value = u.supervisor || 'eduardo Villareal';
        sup.dispatchEvent(new Event('input', { bubbles: true }));
        sup.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // KM
      const kmInputs = document.querySelectorAll('input[type="number"]');
      kmInputs.forEach(i => {
        const name = (i.name || '').toLowerCase();
        const id = (i.id || '').toLowerCase();
        if (name.includes('km') || name.includes('kilometraje') || id.includes('kilometraje')) {
          i.value = km;
          i.dispatchEvent(new Event('input', { bubbles: true }));
          i.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });

      // Radios (Bueno / Sí / 1)
      document.querySelectorAll('input[type="radio"]').forEach(r => {
        const v = (r.value || '').toLowerCase();
        if (v === 'bueno' || v === 'si' || v === 'sí' || v === '1' || v === 'true' || v === 'cumple') {
          r.click();
        }
      });

      // Textareas
      document.querySelectorAll('textarea').forEach(t => {
        if (!t.value) {
          t.value = 'Nada';
          t.dispatchEvent(new Event('input', { bubbles: true }));
          t.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });

      // Vacaciones
      const start = document.querySelector('input[name="vacaciones_inicio"]');
      const end = document.querySelector('input[name="vacaciones_fin"]');
      if (start && u.vacaciones_inicio) {
        start.value = u.vacaciones_inicio;
        start.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (end && u.vacaciones_fin) {
        end.value = u.vacaciones_fin;
        end.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, user, km);

    await sleep(2000);

    // ANÁLISIS Y CORRECCIÓN ITERATIVA
    let attempt = 1;
    let formComplete = false;

    while (attempt <= CONFIG.maxRetries && !formComplete) {
      const msgAnalisis = `\n  📋 Análisis ${attempt}/${CONFIG.maxRetries}...`;
      console.log(msgAnalisis);
      logToFile(msgAnalisis);

      // Captura antes de análisis
      await page.screenshot({ path: shot, fullPage: true });

      // Análisis de formulario
      const formData = await formAnalyzer.analyzeForm();

      if (formData.errors.length === 0) {
        const msgCompleteForm = `  ✅ Formulario completo según análisis de estructura`;
        console.log(msgCompleteForm);
        logToFile(msgCompleteForm);
        formComplete = true;
        break;
      }

      const msgErrores = `  ⚠️ Errores detectados: ${formData.errors.length}`;
      console.log(msgErrores);
      logToFile(msgErrores);

      formData.errors.forEach(e => {
        const msgError = `    • ${e}`;
        console.log(msgError);
        logToFile(msgError);
      });

      // Rellenar campos faltantes
      const filled = await formAnalyzer.fillMissingFields(formData);

      if (filled === 0 && formData.errors.length > 0) {
        const msgNoFill = `  ⚠️ No se pudieron rellenar más campos. Intentando enviar de todas formas...`;
        console.log(msgNoFill);
        logToFile(msgNoFill);
        break;
      }

      await sleep(1000);
      attempt++;
    }

    // Enviar formulario
    const msgBuscando = `  [${user.nombre}] Buscando botón de envío...`;
    console.log(msgBuscando);
    logToFile(msgBuscando);

    const btnSubmit = await page.evaluateHandle(() => {
      const buttons = document.querySelectorAll('button, input[type="submit"]');
      for (const btn of buttons) {
        const txt = (btn.innerText || btn.value || '').toLowerCase();
        if (txt.includes('guardar') || txt.includes('enviar')) return btn;
      }
      return null;
    });

    const el = await btnSubmit.asElement();
    if (el) {
      await el.click();
      const msgClickeado = `  [${user.nombre}] Botón clickeado. Esperando confirmación...`;
      console.log(msgClickeado);
      logToFile(msgClickeado);

      // Esperar confirmación
      await page.waitForFunction(() => {
        const text = document.body.innerText || '';
        const hasSuccessText = text.toLowerCase().includes('guardado') ||
          text.toLowerCase().includes('exitoso') ||
          text.toLowerCase().includes('completado');
        const hasSwal = !!document.querySelector('.swal2-popup, .swal2-success, .swal2-title');
        const hasAlert = !!document.querySelector('.alert-success, .toast-success');
        return hasSuccessText || hasSwal || hasAlert;
      }, { timeout: 15000 }).catch(() => {
        const msgTimeout = `  [${user.nombre}] Timeout esperando confirmación, procediendo con captura de respaldo.`;
        console.log(msgTimeout);
        logToFile(msgTimeout);
      });

      await sleep(2000);
      await page.screenshot({ path: shot, fullPage: true });

      const msgCaptura = `  [${user.nombre}] Captura final tomada.`;
      console.log(msgCaptura);
      logToFile(msgCaptura);

      success = true;
    } else {
      const msgNoBtn = `  [${user.nombre}] No se encontró el botón de envío.`;
      console.warn(msgNoBtn);
      logToFile(msgNoBtn);
    }

    // Guardar reporte de análisis
    const report = formAnalyzer.generateReport();
    const reportFile = `${logsDir}/form-analysis-${user.cedula}-${Date.now()}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    const msgReporte = `  📄 Reporte guardado: ${reportFile}`;
    console.log(msgReporte);
    logToFile(msgReporte);

    // Enviar correo
    await sendEvidenceEmail(user, shot, success);

    // Actualizar DB
    await run(`UPDATE users SET km_actual = ?, last_run = ? WHERE id = ?`, [km, new Date().toISOString(), user.id]);

    const msgCompleto = `✅ Completado para ${user.nombre}`;
    console.log(msgCompleto);
    logToFile(msgCompleto);

  } catch (e) {
    const msgError = `❌ Error en ${user.nombre}: ${e.message}`;
    console.error(msgError);
    logToFile(msgError);
    await sendEvidenceEmail(user, shot, false);
  } finally {
    await browser.close();
  }
}

module.exports = { processUserImproved };
