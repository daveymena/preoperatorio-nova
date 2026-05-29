/**
 * Procesamiento mejorado de usuarios con análisis y corrección automática
 * FALLBACK: Funciona sin IA si G4F no está disponible
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const FormAnalyzer = require('./form-analyzer');
const { run } = require('./db');
const { sendEvidenceEmail } = require('./emails');

const CONFIG = {
  url: 'https://www.conectartv.com/SRCGC/Movilidad/preop_moto.php',
  maxRetries: 3,
  timeout: 60000,
  useAI: true // Intentar usar IA, pero fallback a modo simple si falla
};

// Usar ruta relativa al proyecto en desarrollo, /app/logs en producción
const logsDir = process.env.NODE_ENV === 'production' ? '/app/logs' : './logs';

// Crear directorio de logs si no existe
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

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

      // Checkboxes de aceptación (salud, condiciones, etc.)
      document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        const label = document.querySelector(`label[for="${cb.id}"]`)?.textContent || '';
        const name = (cb.name || '').toLowerCase();
        const id = (cb.id || '').toLowerCase();
        
        // Buscar checkboxes de aceptación/confirmación
        const isAcceptance = label.toLowerCase().includes('aceptar') ||
          label.toLowerCase().includes('condiciones') ||
          label.toLowerCase().includes('salud') ||
          label.toLowerCase().includes('óptimas') ||
          label.toLowerCase().includes('confirmo') ||
          label.toLowerCase().includes('acepto') ||
          name.includes('aceptar') ||
          name.includes('acepto') ||
          name.includes('confirmo') ||
          id.includes('aceptar') ||
          id.includes('acepto') ||
          id.includes('confirmo');
        
        if (isAcceptance && !cb.checked) {
          cb.click();
          cb.checked = true;
          cb.dispatchEvent(new Event('change', { bubbles: true }));
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

    // ANÁLISIS Y CORRECCIÓN ITERATIVA (SIN IA - FALLBACK SEGURO)
    // El sistema funciona sin IA, solo detecta campos vacíos y los rellena
    let attempt = 1;
    let formComplete = false;
    let pageErrors = []; // DECLARAR AQUÍ

    while (attempt <= CONFIG.maxRetries && !formComplete) {
      const msgAnalisis = `\n  📋 Análisis ${attempt}/${CONFIG.maxRetries}...`;
      console.log(msgAnalisis);
      logToFile(msgAnalisis);

      // Captura antes de análisis
      await page.screenshot({ path: shot, fullPage: true });

      // Análisis de formulario
      const formData = await formAnalyzer.analyzeForm();

      // DETECCIÓN MEJORADA DE ADVERTENCIAS - AHORA SÍ DETIENE
      const pageWarnings = await page.evaluate(() => {
        const warnings = [];
        
        // Buscar advertencias en naranja, rojo, etc.
        const warningElements = document.querySelectorAll(
          '.alert, .warning, .alert-warning, .alert-danger, .alert-error, ' +
          '[role="alert"], .swal2-popup, .toast, .notification, ' +
          '[class*="warning"], [class*="error"], [class*="alert"], ' +
          '.invalid-feedback, .form-error, .error-message, ' +
          '[class*="invalid"], [class*="fail"]'
        );
        
        warningElements.forEach(el => {
          const text = el.textContent?.trim();
          const bgColor = window.getComputedStyle(el).backgroundColor;
          const isVisible = el.offsetParent !== null;
          const computedStyle = window.getComputedStyle(el);
          
          // Detectar colores de advertencia (naranja, rojo)
          const isWarningColor = bgColor.includes('rgb(255, 193, 7)') || // Amarillo/Naranja
                                bgColor.includes('rgb(244, 67, 54)') ||  // Rojo
                                bgColor.includes('rgb(255, 152, 0)') ||  // Naranja
                                bgColor.includes('rgb(255, 87, 34)') ||  // Naranja oscuro
                                computedStyle.color.includes('rgb(255') || // Texto rojo/naranja
                                el.className.includes('warning') ||
                                el.className.includes('danger') ||
                                el.className.includes('error');
          
          if (text && text.length > 0 && isVisible && 
              !text.toLowerCase().includes('guardado') &&
              !text.toLowerCase().includes('exitoso') &&
              !text.toLowerCase().includes('completado') &&
              !text.toLowerCase().includes('éxito')) {
            warnings.push({
              text: text,
              color: bgColor,
              element: el.className,
              isWarningColor: isWarningColor
            });
          }
        });
        
        return warnings;
      });

      // SI HAY ADVERTENCIAS, DETENER Y PROCESAR
      if (pageWarnings.length > 0) {
        const msgWarnings = `  🛑 ADVERTENCIAS DETECTADAS - DETENIENDO EJECUCIÓN:`;
        console.log(msgWarnings);
        logToFile(msgWarnings);
        
        pageWarnings.forEach(w => {
          const msgWarn = `    🔴 ${w.text}`;
          console.log(msgWarn);
          logToFile(msgWarn);
        });

        // Procesar cada advertencia para identificar qué campo falta
        for (const warning of pageWarnings) {
          const warningText = warning.text.toLowerCase();
          
          // Mapeo de advertencias a campos
          let fieldToFill = null;
          let fieldValue = null;

          // Detectar qué campo falta basado en el mensaje
          if (warningText.includes('selecciona') || warningText.includes('seleccione')) {
            // "Selecciona una de estas opciones" - buscar radio buttons sin seleccionar
            const unselectedRadios = await page.evaluate(() => {
              const radios = {};
              document.querySelectorAll('input[type="radio"]').forEach(r => {
                if (!r.checked) {
                  if (!radios[r.name]) radios[r.name] = [];
                  radios[r.name].push(r);
                }
              });
              return Object.keys(radios).length > 0 ? Object.keys(radios)[0] : null;
            });

            if (unselectedRadios) {
              fieldToFill = unselectedRadios;
              const msgDetected = `    ✅ Campo detectado: ${fieldToFill} (radio button sin seleccionar)`;
              console.log(msgDetected);
              logToFile(msgDetected);

              // Seleccionar la opción positiva
              await page.evaluate((name) => {
                const radios = document.querySelectorAll(`input[type="radio"][name="${name}"]`);
                for (const r of radios) {
                  const value = (r.value || '').toLowerCase();
                  if (value === 'si' || value === 'sí' || value === 'bueno' || value === '1' || value === 'true') {
                    r.click();
                    return;
                  }
                }
                // Si no encuentra opción positiva, selecciona la primera
                if (radios.length > 0) radios[0].click();
              }, fieldToFill);

              const msgFilled = `    ✅ Campo rellenado: ${fieldToFill}`;
              console.log(msgFilled);
              logToFile(msgFilled);
            }
          } else if (warningText.includes('checkbox') || warningText.includes('marcar') || warningText.includes('aceptar')) {
            // Buscar checkboxes sin marcar
            const uncheckedCheckboxes = await page.evaluate(() => {
              const checkboxes = [];
              document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                if (!cb.checked) {
                  const label = document.querySelector(`label[for="${cb.id}"]`)?.textContent || '';
                  checkboxes.push({
                    name: cb.name || cb.id,
                    label: label,
                    element: cb
                  });
                }
              });
              return checkboxes.map(c => ({ name: c.name, label: c.label }));
            });

            if (uncheckedCheckboxes.length > 0) {
              const checkbox = uncheckedCheckboxes[0];
              fieldToFill = checkbox.name;
              
              const msgDetected = `    ✅ Campo detectado: ${fieldToFill} (checkbox sin marcar)`;
              console.log(msgDetected);
              logToFile(msgDetected);

              // Marcar el checkbox
              await page.evaluate((name) => {
                const cb = document.querySelector(`input[type="checkbox"][name="${name}"], input[type="checkbox"]#${name}`);
                if (cb && !cb.checked) {
                  cb.click();
                  cb.checked = true;
                  cb.dispatchEvent(new Event('change', { bubbles: true }));
                }
              }, fieldToFill);

              const msgFilled = `    ✅ Checkbox marcado: ${fieldToFill}`;
              console.log(msgFilled);
              logToFile(msgFilled);
            }
          } else if (warningText.includes('campo') || warningText.includes('requerido')) {
            // Campo genérico requerido - rellenar con el analizador
            const filled = await formAnalyzer.fillMissingFields(formData);
            if (filled > 0) {
              const msgFilled = `    ✅ ${filled} campo(s) rellenado(s)`;
              console.log(msgFilled);
              logToFile(msgFilled);
            }
          }
        }

        // Esperar a que se procese el cambio
        await sleep(1500);

        // Verificar si la advertencia desapareció
        const warningsAfter = await page.evaluate(() => {
          const warnings = [];
          const warningElements = document.querySelectorAll(
            '.alert, .warning, .alert-warning, .alert-danger, .alert-error, ' +
            '[role="alert"], .swal2-popup, .toast, .notification'
          );
          
          warningElements.forEach(el => {
            const text = el.textContent?.trim();
            const isVisible = el.offsetParent !== null;
            
            if (text && text.length > 0 && isVisible && 
                !text.toLowerCase().includes('guardado') &&
                !text.toLowerCase().includes('exitoso')) {
              warnings.push(text);
            }
          });
          
          return warnings;
        });

        if (warningsAfter.length === 0) {
          const msgCleared = `  ✅ Advertencias resueltas. Continuando...`;
          console.log(msgCleared);
          logToFile(msgCleared);
          pageErrors = [];
        } else {
          const msgStillWarning = `  ⚠️ Aún hay advertencias después de rellenar. Reintentando...`;
          console.log(msgStillWarning);
          logToFile(msgStillWarning);
          pageErrors = warningsAfter;
          attempt++;
          continue;
        }
      } else {
        pageErrors = [];
      }

      // Buscar y presionar botones de aceptación
      const acceptButtonPressed = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button, input[type="button"], a.btn');
        for (const btn of buttons) {
          const text = (btn.innerText || btn.value || btn.textContent || '').toLowerCase();
          if (text.includes('aceptar') || text.includes('acepto') || text.includes('confirmar') || text.includes('ok')) {
            if (!btn.disabled && btn.offsetParent !== null) {
              btn.click();
              return true;
            }
          }
        }
        return false;
      });

      if (acceptButtonPressed) {
        const msgAccept = `  ✅ Botón de aceptación presionado`;
        console.log(msgAccept);
        logToFile(msgAccept);
        await sleep(1000);
      }

      if (formData.errors.length === 0 && pageErrors.length === 0) {
        const msgCompleteForm = `  ✅ Formulario completo según análisis de estructura`;
        console.log(msgCompleteForm);
        logToFile(msgCompleteForm);
        formComplete = true;
        break;
      }

      const msgErrores = `  ⚠️ Errores detectados: ${formData.errors.length} (formulario) + ${pageErrors.length} (página)`;
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

      // Esperar confirmación y tomar foto INMEDIATAMENTE cuando aparezca
      let successFound = false;
      
      try {
        // Monitorear cambios en tiempo real con más opciones de detección
        const screenshotTaken = await page.evaluate(async () => {
          return new Promise((resolve) => {
            let checkCount = 0;
            const maxChecks = 300; // 30 segundos con 100ms de intervalo
            
            const checkForSuccess = async () => {
              checkCount++;
              
              const text = document.body.innerText || '';
              const html = document.body.innerHTML || '';
              
              // Búsqueda más amplia de mensajes de éxito
              const hasSuccessText = text.toLowerCase().includes('guardado') ||
                text.toLowerCase().includes('exitoso') ||
                text.toLowerCase().includes('completado') ||
                text.toLowerCase().includes('éxito') ||
                text.toLowerCase().includes('exito') ||
                text.toLowerCase().includes('success') ||
                text.toLowerCase().includes('ok') ||
                text.toLowerCase().includes('aceptado') ||
                text.toLowerCase().includes('registrado') ||
                text.toLowerCase().includes('enviado');
              
              // Búsqueda de modales y alertas
              const hasSwal = !!document.querySelector('.swal2-popup, .swal2-success, .swal2-title, .swal-modal, .swal2-confirm');
              const hasAlert = !!document.querySelector('.alert-success, .toast-success, .alert, [role="alert"], .success, .notification-success');
              const hasModal = !!document.querySelector('.modal.show, .modal.in, [role="dialog"], .modal-open');
              
              // Búsqueda de cambios en URL
              const urlChanged = window.location.href.includes('success') || window.location.href.includes('completado') || window.location.href.includes('exito');
              
              // Búsqueda de elementos con clase success
              const hasSuccessClass = !!document.querySelector('[class*="success"], [class*="exito"], [class*="completado"]');
              
              if (hasSuccessText || hasSwal || hasAlert || hasModal || urlChanged || hasSuccessClass) {
                resolve(true);
              } else if (checkCount >= maxChecks) {
                resolve(false);
              } else {
                setTimeout(checkForSuccess, 100);
              }
            };
            
            checkForSuccess();
          });
        });

        if (screenshotTaken) {
          successFound = true;
          const msgExito = `  [${user.nombre}] ✅ Confirmación detectada. Tomando captura INMEDIATA...`;
          console.log(msgExito);
          logToFile(msgExito);
          
          // Esperar un poco para que se estabilice
          await sleep(500);
          
          // Tomar foto INMEDIATAMENTE
          await page.screenshot({ path: shot, fullPage: true });
          
          const msgCaptura = `  [${user.nombre}] 📸 Captura tomada en el INSTANTE exacto.`;
          console.log(msgCaptura);
          logToFile(msgCaptura);
        } else {
          throw new Error('No se detectó confirmación después de 30 segundos');
        }
        
      } catch (e) {
        const msgTimeout = `  [${user.nombre}] ⏱️ Timeout esperando confirmación (${e.message}), tomando captura de respaldo...`;
        console.log(msgTimeout);
        logToFile(msgTimeout);
        
        // Tomar captura de respaldo después de esperar
        await sleep(3000);
        await page.screenshot({ path: shot, fullPage: true });
        
        const msgRespaldo = `  [${user.nombre}] 📸 Captura de respaldo tomada.`;
        console.log(msgRespaldo);
        logToFile(msgRespaldo);
      }

      success = successFound;
    } else {
      const msgNoBtn = `  [${user.nombre}] ❌ No se encontró el botón de envío.`;
      console.warn(msgNoBtn);
      logToFile(msgNoBtn);
      success = false;
    }

    // Verificar que la captura se guardó
    const shotExists = fs.existsSync(shot);
    if (shotExists) {
      const shotSize = fs.statSync(shot).size;
      const msgShotOK = `  ✅ Captura guardada: ${shot} (${shotSize} bytes)`;
      console.log(msgShotOK);
      logToFile(msgShotOK);
    } else {
      const msgShotFail = `  ❌ ADVERTENCIA: Captura NO se guardó: ${shot}`;
      console.error(msgShotFail);
      logToFile(msgShotFail);
      success = false;
    }

    // Guardar reporte de análisis
    const report = formAnalyzer.generateReport();
    const reportFile = `${logsDir}/form-analysis-${user.cedula}-${Date.now()}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    const msgReporte = `  📄 Reporte guardado: ${reportFile}`;
    console.log(msgReporte);
    logToFile(msgReporte);

    // VALIDACIÓN CRÍTICA: Verificar que realmente se guardó
    const finalValidation = await page.evaluate(() => {
      const text = document.body.innerText || '';
      const hasSuccessText = text.toLowerCase().includes('guardado') ||
        text.toLowerCase().includes('exitoso') ||
        text.toLowerCase().includes('completado') ||
        text.toLowerCase().includes('éxito') ||
        text.toLowerCase().includes('exito');
      
      const hasSwal = !!document.querySelector('.swal2-popup, .swal2-success, .swal2-title');
      const hasAlert = !!document.querySelector('.alert-success, .toast-success');
      
      return hasSuccessText || hasSwal || hasAlert;
    }).catch(() => false);

    if (!finalValidation && success) {
      const msgWarning = `  ⚠️ ADVERTENCIA: Se detectó éxito pero validación final falló. Marcando como error.`;
      console.warn(msgWarning);
      logToFile(msgWarning);
      success = false;
    }

    // Enviar correo CON ESTADO CORRECTO
    const emailStatus = success ? 'exitoso' : 'con errores';
    const msgEmail = `  📧 Enviando correo (estado: ${emailStatus})...`;
    console.log(msgEmail);
    logToFile(msgEmail);
    
    await sendEvidenceEmail(user, shot, success);

    // Actualizar DB SOLO si fue exitoso
    if (success) {
      await run(`UPDATE users SET km_actual = ?, last_run = ? WHERE id = ?`, [km, new Date().toISOString(), user.id]);
      const msgDB = `  💾 Base de datos actualizada: KM = ${km}`;
      console.log(msgDB);
      logToFile(msgDB);
    } else {
      const msgDBSkip = `  ⏭️ Base de datos NO actualizada (ejecución falló)`;
      console.log(msgDBSkip);
      logToFile(msgDBSkip);
    }

    const msgCompleto = success ? `✅ Completado exitosamente para ${user.nombre}` : `❌ Completado CON ERRORES para ${user.nombre}`;
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
