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
        sup.value = u.supervisor || 'Eduardo Villareal';
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

      // Fecha actual
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      document.querySelectorAll('input[type="date"]').forEach(d => {
        if (!d.value) {
          d.value = dateStr;
          d.dispatchEvent(new Event('input', { bubbles: true }));
          d.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });

      // Hora actual
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;

      document.querySelectorAll('input[type="time"]').forEach(t => {
        if (!t.value) {
          t.value = timeStr;
          t.dispatchEvent(new Event('input', { bubbles: true }));
          t.dispatchEvent(new Event('change', { bubbles: true }));
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
          t.value = 'Sin novedad';
          t.dispatchEvent(new Event('input', { bubbles: true }));
          t.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });

      // Inputs de texto genéricos
      document.querySelectorAll('input[type="text"]').forEach(inp => {
        if (!inp.value && !inp.readOnly && !inp.disabled) {
          const name = (inp.name || '').toLowerCase();
          const id = (inp.id || '').toLowerCase();
          
          // Rellenar según el tipo de campo
          if (name.includes('nombre') || name.includes('conductor') || id.includes('nombre')) {
            inp.value = u.nombre || 'N/A';
          } else if (name.includes('placa') || name.includes('vehiculo') || id.includes('placa')) {
            inp.value = u.placa || 'N/A';
          } else if (name.includes('cedula') || name.includes('documento') || id.includes('cedula')) {
            inp.value = u.cedula || 'N/A';
          } else if (name.includes('email') || name.includes('correo') || id.includes('email')) {
            inp.value = u.email || 'N/A';
          } else if (name.includes('telefono') || name.includes('celular') || id.includes('telefono')) {
            inp.value = u.telefono || '3000000000';
          } else if (name.includes('supervisor') || id.includes('supervisor')) {
            inp.value = u.supervisor || 'Eduardo Villareal';
          } else if (name.includes('empresa') || id.includes('empresa')) {
            inp.value = 'Conectar TV';
          } else if (name.includes('cargo') || id.includes('cargo')) {
            inp.value = 'Conductor';
          } else if (name.includes('ciudad') || id.includes('ciudad')) {
            inp.value = 'Bogotá';
          } else if (name.includes('departamento') || id.includes('departamento')) {
            inp.value = 'Cundinamarca';
          } else if (name.includes('direccion') || id.includes('direccion')) {
            inp.value = 'Calle Principal 123';
          } else {
            inp.value = 'N/A';
          }
          
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new Event('change', { bubbles: true }));
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

    // VERIFICAR QUE LOS CAMPOS SE LLENARON (usando page.type como fallback para frameworks JS)
    try {
      await page.evaluate(() => {
        document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="radio"]):not([type="checkbox"])').forEach(inp => {
          if (!inp.value && !inp.readOnly && !inp.disabled) {
            inp.value = inp.value || ' ';
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            inp.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      });
    } catch (e) {
      logToFile(`  ⚠️ Error en verificación post-llenado: ${e.message}`);
    }

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
        // PRIMERO: Cerrar cualquier modal/banner/sweetalert visible
        await page.evaluate(() => {
          // Cerrar SweetAlert presionando confirm
          const swalConfirm = document.querySelector('.swal2-confirm, .swal2-ok, button.swal2-confirm');
          if (swalConfirm && swalConfirm.offsetParent !== null) {
            swalConfirm.click();
            return;
          }
          // Cerrar modales de Bootstrap
          const modalCloseBtn = document.querySelector('.modal .close, .modal [data-dismiss="modal"], .modal-footer .btn-primary');
          if (modalCloseBtn && modalCloseBtn.offsetParent !== null) {
            modalCloseBtn.click();
            return;
          }
          // Cerrar cualquier botón "OK" en diálogos/contenedores visibles
          const visibleOkButtons = Array.from(document.querySelectorAll('button:not([disabled])'));
          for (const btn of visibleOkButtons) {
            const txt = (btn.innerText || btn.value || '').toLowerCase().trim();
            if (txt === 'ok' || txt === 'aceptar' || txt === 'si' || txt === 'sí') {
              if (btn.offsetParent !== null) {
                btn.click();
                return;
              }
            }
          }
        });
        await sleep(1000);
        // Analizar el formulario OTRA VEZ tras cerrar el modal (para obtener datos frescos sin errores falsos)
        const freshFormData = await formAnalyzer.analyzeForm();
        if (freshFormData.errors.length > 0) {
          // Si aún hay errores después de cerrar el modal, reemplazar formData
          formData.errors = freshFormData.errors.filter(e => !e.includes('Error en página'));
          formData.inputs = freshFormData.inputs;
          formData.radios = freshFormData.radios;
          formData.selects = freshFormData.selects;
          formData.textareas = freshFormData.textareas;
        } else {
          formData.errors = [];
        }
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

        // Verificar si la advertencia desapareció (MISMOS selectores que la detección inicial)
        const warningsAfter = await page.evaluate(() => {
          const warnings = [];
          const warningElements = document.querySelectorAll(
            '.alert, .warning, .alert-warning, .alert-danger, .alert-error, ' +
            '[role="alert"], .swal2-popup, .toast, .notification, ' +
            '[class*="warning"], [class*="error"], [class*="alert"], ' +
            '.invalid-feedback, .form-error, .error-message, ' +
            '[class*="invalid"], [class*="fail"]'
          );
          
          warningElements.forEach(el => {
            const text = el.textContent?.trim();
            const isVisible = el.offsetParent !== null;
            
            if (text && text.length > 0 && isVisible && 
                !text.toLowerCase().includes('guardado') &&
                !text.toLowerCase().includes('exitoso') &&
                !text.toLowerCase().includes('completado') &&
                !text.toLowerCase().includes('éxito')) {
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

    // VERIFICACIÓN FINAL ANTES DE ENVIAR
    const msgVerificacion = `\n  🔍 VERIFICACIÓN FINAL - Asegurando que TODOS los campos estén llenos...`;
    console.log(msgVerificacion);
    logToFile(msgVerificacion);

    // Análisis final del formulario
    const finalFormData = await formAnalyzer.analyzeForm();
    
    if (finalFormData.errors.length > 0) {
      const msgErroresFinal = `  ⚠️ ERRORES DETECTADOS EN VERIFICACIÓN FINAL:`;
      console.log(msgErroresFinal);
      logToFile(msgErroresFinal);
      
      finalFormData.errors.forEach(e => {
        const msgError = `    • ${e}`;
        console.log(msgError);
        logToFile(msgError);
      });

      // RELLENAR TODOS LOS CAMPOS FALTANTES
      const msgRellenando = `  🔧 Rellenando campos faltantes...`;
      console.log(msgRellenando);
      logToFile(msgRellenando);

      const filledCount = await formAnalyzer.fillMissingFields(finalFormData);
      
      const msgRellenados = `  ✅ ${filledCount} campo(s) rellenado(s)`;
      console.log(msgRellenados);
      logToFile(msgRellenados);

      // Esperar a que se procesen los cambios
      await sleep(2000);

      // Verificar nuevamente
      const recheck = await formAnalyzer.analyzeForm();
      if (recheck.errors.length > 0) {
        const msgAunErrores = `  ⚠️ AÚN HAY ERRORES DESPUÉS DE RELLENAR:`;
        console.log(msgAunErrores);
        logToFile(msgAunErrores);
        
        recheck.errors.forEach(e => {
          const msgError = `    • ${e}`;
          console.log(msgError);
          logToFile(msgError);
        });
      } else {
        const msgTodoOK = `  ✅ TODOS LOS CAMPOS ESTÁN LLENOS - LISTO PARA ENVIAR`;
        console.log(msgTodoOK);
        logToFile(msgTodoOK);
      }
    } else {
      const msgTodoOK = `  ✅ VERIFICACIÓN OK - Todos los campos están llenos`;
      console.log(msgTodoOK);
      logToFile(msgTodoOK);
    }

    // Captura antes de enviar
    await page.screenshot({ path: `before-submit-${user.cedula}.png`, fullPage: true });
    const msgCapturaPre = `  📸 Captura pre-envío guardada`;
    console.log(msgCapturaPre);
    logToFile(msgCapturaPre);

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

      // ESPERAR NAVEGACIÓN POST-SUBMIT con manejo doble (AJAX y navegación)
      let successFound = false;

      try {
        // Esperar navegación si el formulario hace POST tradicional
        const navTimeout = 5000;
        let navigated = false;
        try {
          await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: navTimeout });
          navigated = true;
          const msgNav = `  [${user.nombre}] 🌐 Navegación detectada post-submit`;
          console.log(msgNav);
          logToFile(msgNav);
        } catch (navErr) {
          // Sin navegación - posiblemente AJAX o sin cambios
        }

        // Esperar un momento para que se estabilice
        await sleep(1000);

        // Tomar captura del estado actual
        await page.screenshot({ path: shot, fullPage: true });

        // Verificar mensaje de éxito EXPLÍCITO en la página actual
        const checkSuccess = await page.evaluate(() => {
          const text = document.body.innerText || '';

          // Texto de éxito explícito
          const hasExplicitSuccess = text.toLowerCase().includes('guardado exitosamente') ||
            text.toLowerCase().includes('guardado con éxito') ||
            text.toLowerCase().includes('guardado correctamente') ||
            text.toLowerCase().includes('se ha guardado') ||
            text.toLowerCase().includes('datos guardados') ||
            text.toLowerCase().includes('formulario guardado') ||
            text.toLowerCase().includes('registro guardado') ||
            text.toLowerCase().includes('operación exitosa') ||
            text.toLowerCase().includes('proceso completado') ||
            text.toLowerCase().includes('completado exitosamente');

          // SweetAlert de éxito
          const hasSuccessSwal = !!document.querySelector('.swal2-success, .swal2-success-ring');

          // Alertas de éxito
          const hasSuccessAlert = !!document.querySelector('.alert-success, .toast-success');

          // Verificar que NO hay errores visibles
          const hasErrors = !!document.querySelector('.alert-danger, .alert-error, .error, .invalid-feedback, .is-invalid');

          return { isSuccess: (hasExplicitSuccess || hasSuccessSwal || hasSuccessAlert) && !hasErrors };
        }).catch(() => ({ isSuccess: false }));

        if (checkSuccess.isSuccess) {
          successFound = true;
          const msgOK = `  [${user.nombre}] ✅ Confirmación de guardado exitoso verificada`;
          console.log(msgOK);
          logToFile(msgOK);
        } else if (navigated) {
          // Hubo navegación pero no hay mensaje de éxito - puede ser error
          const msgNavFail = `  [${user.nombre}] ⚠️ Hubo navegación pero NO se detectó mensaje de éxito`;
          console.log(msgNavFail);
          logToFile(msgNavFail);
          successFound = false;
        } else {
          // Sin navegación y sin éxito - monitorear con polling para AJAX
          const msgPolling = `  [${user.nombre}] 🔄 Sin navegación, monitoreando cambios AJAX...`;
          console.log(msgPolling);
          logToFile(msgPolling);

          const pollingResult = await page.evaluate(async () => {
            return new Promise((resolve) => {
              let checkCount = 0;
              const maxChecks = 250; // 25 segundos

              const check = () => {
                checkCount++;
                const text = document.body.innerText || '';
                const hasSuccess = text.toLowerCase().includes('guardado exitosamente') ||
                  text.toLowerCase().includes('guardado con éxito') ||
                  text.toLowerCase().includes('guardado correctamente') ||
                  text.toLowerCase().includes('se ha guardado') ||
                  text.toLowerCase().includes('datos guardados') ||
                  text.toLowerCase().includes('formulario guardado') ||
                  text.toLowerCase().includes('registro guardado') ||
                  text.toLowerCase().includes('operación exitosa') ||
                  text.toLowerCase().includes('proceso completado') ||
                  !!document.querySelector('.swal2-success, .swal2-success-ring, .alert-success, .toast-success');
                if (hasSuccess) resolve(true);
                else if (checkCount >= maxChecks) resolve(false);
                else setTimeout(check, 100);
              };
              check();
            });
          }).catch(() => false);

          if (pollingResult) {
            successFound = true;
            await sleep(500);
            await page.screenshot({ path: shot, fullPage: true });
            const msgPollOK = `  [${user.nombre}] ✅ Éxito detectado por polling AJAX`;
            console.log(msgPollOK);
            logToFile(msgPollOK);
          }
        }
      } catch (e) {
        const msgError = `  [${user.nombre}] ⚠️ Error post-submit: ${e.message}`;
        console.log(msgError);
        logToFile(msgError);

        // Intentar tomar captura de respaldo
        try {
          await sleep(3000);
          await page.screenshot({ path: shot, fullPage: true });

          const checkBackup = await page.evaluate(() => {
            const text = document.body.innerText || '';
            return text.toLowerCase().includes('guardado exitosamente') ||
              text.toLowerCase().includes('guardado con éxito') ||
              text.toLowerCase().includes('guardado correctamente') ||
              text.toLowerCase().includes('se ha guardado') ||
              text.toLowerCase().includes('datos guardados') ||
              text.toLowerCase().includes('formulario guardado') ||
              text.toLowerCase().includes('registro guardado') ||
              text.toLowerCase().includes('operación exitosa') ||
              text.toLowerCase().includes('proceso completado') ||
              !!document.querySelector('.swal2-success, .swal2-success-ring, .alert-success, .toast-success');
          }).catch(() => false);

          if (checkBackup) {
            const msgBackupOK = `  ✅ Captura de respaldo contiene éxito`;
            console.log(msgBackupOK);
            logToFile(msgBackupOK);
            successFound = true;
          } else {
            const msgBackupFail = `  ❌ Captura de respaldo sin éxito detectado`;
            console.log(msgBackupFail);
            logToFile(msgBackupFail);
            successFound = false;
          }
        } catch (e2) {
          const msgFatal = `  ❌ Error fatal post-submit: ${e2.message}`;
          console.log(msgFatal);
          logToFile(msgFatal);
        }
      }

      // Verificación adicional: si no hay éxito, revisar validación HTML5
      if (!successFound) {
        const validationIssues = await page.evaluate(() => {
          const issues = [];
          document.querySelectorAll('input:invalid, select:invalid, textarea:invalid').forEach(el => {
            issues.push(`${el.name || el.id || '?'}: ${el.validationMessage || 'inválido'}`);
          });
          // También buscar mensajes de error visibles
          document.querySelectorAll('.alert-danger, .alert-error, .error, .invalid-feedback, .is-invalid, [class*="error"]').forEach(el => {
            if (el.textContent?.trim()) issues.push(`error: ${el.textContent.trim()}`);
          });
          return issues;
        }).catch(() => []);

        if (validationIssues.length > 0) {
          const msgValIssues = `  ⚠️ Problemas de validación post-submit:`;
          console.log(msgValIssues);
          logToFile(msgValIssues);
          validationIssues.forEach(i => {
            const msg = `    • ${i}`;
            console.log(msg);
            logToFile(msg);
          });
        }
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

    // VALIDACIÓN CRÍTICA FINAL: Verificar que realmente se guardó
    const finalValidation = await page.evaluate(() => {
      const text = document.body.innerText || '';
      const swalText = document.querySelector('.swal2-popup')?.innerText || '';
      
      // Texto de éxito explícito (en toda la página y en SweetAlert)
      const fullText = (text + ' ' + swalText).toLowerCase();
      const hasExplicitSuccess = fullText.includes('guardado exitosamente') ||
        fullText.includes('guardado con éxito') ||
        fullText.includes('guardado correctamente') ||
        fullText.includes('se ha guardado') ||
        fullText.includes('datos guardados') ||
        fullText.includes('formulario guardado') ||
        fullText.includes('registro guardado') ||
        fullText.includes('operación exitosa') ||
        fullText.includes('proceso completado') ||
        fullText.includes('completado exitosamente');
      
      // SweetAlert de éxito (NO swal2-popup genérico)
      const hasSuccessSwal = !!document.querySelector('.swal2-success, .swal2-success-ring');
      
      // Alertas de éxito
      const hasSuccessAlert = !!document.querySelector('.alert-success, .toast-success');
      
      const isValid = hasExplicitSuccess || hasSuccessSwal || hasSuccessAlert;
      
      return {
        hasExplicitSuccess,
        hasSuccessSwal,
        hasSuccessAlert,
        isValid
      };
    }).catch(() => ({ isValid: false }));

    const msgValidationResult = `  🔍 Validación final: ${JSON.stringify(finalValidation)}`;
    console.log(msgValidationResult);
    logToFile(msgValidationResult);

    if (!finalValidation.isValid && success) {
      const msgWarning = `  ⚠️ ADVERTENCIA CRÍTICA: Se detectó éxito pero validación final falló. Marcando como error.`;
      console.warn(msgWarning);
      logToFile(msgWarning);
      success = false;
    } else if (finalValidation.isValid && !success) {
      const msgRecovery = `  ✅ RECUPERACIÓN: Validación final confirma éxito. Marcando como exitoso.`;
      console.log(msgRecovery);
      logToFile(msgRecovery);
      success = true;
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
