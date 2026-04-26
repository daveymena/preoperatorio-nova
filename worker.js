const puppeteer = require('puppeteer');
const fs = require('fs');
const { all, run } = require('./lib/db');
const { sendEvidenceEmail, sendTrialExpiryWarningEmail, sendExpiredEmail } = require('./lib/emails');

const CONFIG = {
  url: 'https://www.conectartv.com/SRCGC/Movilidad/preop_moto.php',
  ollama: {
    url: 'http://localhost:11434/api/generate',
    model: 'qwen3.5:cloud'
  }
};

// Generar link de pago MercadoPago para un usuario
async function generatePaymentLink(user) {
  try {
    const { MercadoPagoConfig, Preference } = require('mercadopago');
    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN });
    const preference = new Preference(client);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const result = await preference.create({
      body: {
        items: [{ id: `nova360-${user.id}`, title: 'Nova 360 Automation — Mensualidad', quantity: 1, unit_price: 10000, currency_id: 'COP' }],
        payer: { name: user.nombre, email: user.email },
        back_urls: { success: `${baseUrl}/pago-exitoso?user=${user.id}`, failure: `${baseUrl}/`, pending: `${baseUrl}/` },
        auto_return: 'approved',
        notification_url: `${baseUrl}/api/mp-webhook`,
        external_reference: String(user.id),
      },
    });
    return result.init_point;
  } catch (e) {
    console.error('Error generando link MP:', e.message);
    return null;
  }
}

// Verificar y actualizar estado de suscripciones
async function checkSubscriptions() {
  const now = new Date();
  const users = await all(`SELECT * FROM users WHERE subscription_status != 'expired' OR active = 1`);
  
  for (const user of users) {
    const trialEnd = new Date(user.subscription_until || user.trial_start);
    const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));

    if (user.subscription_status === 'trial') {
      if (daysLeft <= 0) {
        await run(`UPDATE users SET subscription_status = 'expired', active = 0 WHERE id = ?`, [user.id]);
        console.log(`⏰ Trial expirado para ${user.nombre}. Pausando automatización.`);
        const payLink = await generatePaymentLink(user);
        sendExpiredEmail(user, payLink).catch(() => {});
      } else if (daysLeft === 1) {
        console.log(`⚠️ Trial de ${user.nombre} vence mañana. Enviando aviso.`);
        const payLink = await generatePaymentLink(user);
        sendTrialExpiryWarningEmail(user, payLink).catch(() => {});
      }
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyWithOllama(screenshotPath) {
  console.log('🔍 Verificación visual con Ollama...');
  try {
    const imageBase64 = fs.readFileSync(screenshotPath, { encoding: 'base64' });
    const response = await fetch(CONFIG.ollama.url, {
      method: 'POST',
      body: JSON.stringify({
        model: CONFIG.ollama.model,
        prompt: "Analiza esta captura de pantalla de un formulario preoperacional. ¿Están todos los campos llenos? ¿Ves algún campo en rojo o vacío? Responde 'OK' si todo está bien, o indica qué falta.",
        stream: false,
        images: [imageBase64]
      })
    });
    const data = await response.json();
    console.log('🤖 Respuesta IA:', data.response);
    return data.response;
  } catch (e) { 
    console.error('❌ Error Ollama:', e.message);
    return 'ERROR'; 
  }
}

async function sendEmail(user, screenshot, success = true) {
  const transporter = nodemailer.createTransport({
    host: CONFIG.smtp.host,
    port: CONFIG.smtp.port,
    secure: CONFIG.smtp.secure,
    auth: { user: CONFIG.smtp.user, pass: CONFIG.smtp.pass }
  });

  const attachments = [];
  if (fs.existsSync(screenshot)) attachments.push({ path: screenshot });

  const subject = success 
    ? `✅ Preoperacional Exitoso - ${user.nombre}` 
    : `❌ Error en Preoperacional - ${user.nombre}`;

  const html = success
    ? `<h3>Preoperacional Completado</h3><p>Hola ${user.nombre}, tu preoperacional se ha completado hoy exitosamente.</p>`
    : `<h3>Error en Preoperacional</h3><p>Hola ${user.nombre}, hubo un error al procesar tu preoperacional. Por favor revisa la captura adjunta.</p>`;

  try {
    await transporter.sendMail({
      from: CONFIG.emailFrom,
      to: user.email,
      subject: subject,
      html: html,
      attachments
    });
    console.log(`📧 Correo enviado a ${user.email}`);
  } catch (e) {
    console.error(`❌ Error enviando correo a ${user.email}:`, e.message);
  }
}

async function processUser(user) {
  console.log(`🚀 Procesando a: ${user.nombre} (${user.placa})`);
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const shot = `evidence_${user.cedula}.png`;
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log(`  [${user.nombre}] Navegando a login...`);
    await page.goto(CONFIG.url, { waitUntil: 'networkidle0', timeout: 60000 });
    
    // Login logic
    console.log(`  [${user.nombre}] Verificando login...`);
    try {
      await page.waitForSelector('#email', { timeout: 10000 });
      await page.type('#email', user.email || user.cedula, { delay: 50 });
      await page.type('#password', user.password, { delay: 50 });
      
      console.log(`  [${user.nombre}] Click en Ingresar...`);
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {})
      ]);
      await sleep(3000);
    } catch (e) {
      console.log(`  [${user.nombre}] No se detectó formulario de login o ya está logueado.`);
    }
    
    await page.goto(CONFIG.url, { waitUntil: 'networkidle0', timeout: 60000 });
    await sleep(3000);

    // Llenado avanzado
    const km = (user.km_actual || 0) + 1;
    
    console.log(`  [${user.nombre}] Llenando formulario (KM: ${km})...`);
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
        if (v === 'bueno' || v === 'si' || v === 'sí' || v === '1') {
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
    await page.screenshot({ path: shot, fullPage: true });
    
    // Verificación IA
    const iaResult = await verifyWithOllama(shot);
    
    console.log(`  [${user.nombre}] Buscando botón de envío...`);
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
      console.log(`  [${user.nombre}] Botón clickeado. Esperando confirmación...`);
      
      // Esperar a que aparezca un mensaje de éxito en el DOM
      await page.waitForFunction(() => {
        const text = document.body.innerText || '';
        const hasSuccessText = text.toLowerCase().includes('guardado') || 
                               text.toLowerCase().includes('exitoso') || 
                               text.toLowerCase().includes('completado');
        const hasSwal = !!document.querySelector('.swal2-popup, .swal2-success, .swal2-title');
        const hasAlert = !!document.querySelector('.alert-success, .toast-success');
        return hasSuccessText || hasSwal || hasAlert;
      }, { timeout: 15000 }).catch(() => {
        console.log(`  [${user.nombre}] Timeout esperando confirmación visual, procediendo con captura de respaldo.`);
      });

      await sleep(2000);
      await page.screenshot({ path: shot, fullPage: true });
      console.log(`  [${user.nombre}] Captura final tomada.`);
    } else {
      console.warn(`  [${user.nombre}] No se encontró el botón de envío.`);
    }
    
    await sendEvidenceEmail(user, shot, true);
    
    // Actualizar DB
    await run(`UPDATE users SET km_actual = ?, last_run = ? WHERE id = ?`, [km, new Date().toISOString(), user.id]);
    
    console.log(`✅ Completado para ${user.nombre}`);
  } catch (e) {
    console.error(`❌ Error en ${user.nombre}:`, e.message);
    await sendEvidenceEmail(user, shot, false);
  } finally {
    await browser.close();
  }
}

async function startWorker() {
  // Verificar y actualizar suscripciones primero
  await checkSubscriptions();
  
  const users = await all(`SELECT * FROM users WHERE active = 1`);
  console.log(`📦 Procesando ${users.length} usuarios activos...`);
  
  for (let i = 0; i < users.length; i += 3) {
    const batch = users.slice(i, i + 3);
    await Promise.all(batch.map(u => processUser(u)));
  }
}

if (require.main === module) {
  startWorker().then(() => {
    console.log('🏁 Fin del proceso.');
    process.exit(0);
  });
}

module.exports = { startWorker, processUser };

