#!/usr/bin/env node

/**
 * Script de prueba para los analizadores
 * Verifica que FormAnalyzer y VisualAnalyzer funcionen correctamente
 */

const FormAnalyzer = require('./lib/form-analyzer');
const VisualAnalyzer = require('./lib/visual-analyzer');
const puppeteer = require('puppeteer');
const fs = require('fs');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testFormAnalyzer() {
  log('\n═══════════════════════════════════════════════════════════', 'cyan');
  log('🧪 PRUEBA 1: FormAnalyzer', 'cyan');
  log('═══════════════════════════════════════════════════════════\n', 'cyan');

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Crear un formulario de prueba
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .error { border: 2px solid red; }
          .required::after { content: " *"; color: red; }
        </style>
      </head>
      <body>
        <form>
          <div>
            <label class="required">Supervisor</label>
            <input type="text" name="supervisor" required>
          </div>
          
          <div>
            <label class="required">Kilometraje</label>
            <input type="number" name="kilometraje" required>
          </div>
          
          <div>
            <label class="required">¿Luces funcionando?</label>
            <input type="radio" name="luces" value="Sí" required>
            <label for="luces_si">Sí</label>
            <input type="radio" name="luces" value="No">
            <label for="luces_no">No</label>
          </div>
          
          <div>
            <label class="required">Estado del vehículo</label>
            <select name="estado" required>
              <option value="">Seleccionar...</option>
              <option value="bueno">Bueno</option>
              <option value="regular">Regular</option>
              <option value="malo">Malo</option>
            </select>
          </div>
          
          <div>
            <label class="required">Observaciones</label>
            <textarea name="observaciones" required></textarea>
          </div>
          
          <button type="submit">Guardar</button>
        </form>
      </body>
      </html>
    `);

    const user = {
      nombre: 'Test User',
      supervisor: 'Eduardo Villareal',
      km_actual: 100
    };

    const analyzer = new FormAnalyzer(page, user);

    // Analizar formulario
    log('📋 Analizando formulario...', 'blue');
    const formData = await analyzer.analyzeForm();

    log(`\n✅ Campos detectados:`, 'green');
    log(`  • Inputs: ${formData.inputs.length}`, 'green');
    log(`  • Radio buttons: ${Object.keys(formData.radios).length}`, 'green');
    log(`  • Selects: ${formData.selects.length}`, 'green');
    log(`  • Textareas: ${formData.textareas.length}`, 'green');

    log(`\n⚠️ Errores detectados: ${formData.errors.length}`, 'yellow');
    formData.errors.forEach(e => log(`  • ${e}`, 'yellow'));

    // Rellenar campos
    log(`\n📝 Rellenando campos...`, 'blue');
    const filled = await analyzer.fillMissingFields(formData);
    log(`✅ Campos rellenados: ${filled}`, 'green');

    // Verificar si está completo
    log(`\n🔍 Verificando si está completo...`, 'blue');
    const complete = await analyzer.isFormComplete();
    log(`${complete ? '✅ Formulario completo' : '⚠️ Formulario incompleto'}`, complete ? 'green' : 'yellow');

    // Generar reporte
    const report = analyzer.generateReport();
    log(`\n📄 Reporte generado:`, 'blue');
    log(`  • Timestamp: ${report.timestamp}`, 'blue');
    log(`  • Usuario: ${report.user}`, 'blue');
    log(`  • Errores: ${report.errors.length}`, 'blue');
    log(`  • Campos rellenados: ${report.filledFields.length}`, 'blue');
    log(`  • Éxito: ${report.success}`, 'blue');

    await browser.close();
    log('\n✅ Prueba 1 completada\n', 'green');

  } catch (error) {
    log(`\n❌ Error en prueba 1: ${error.message}\n`, 'red');
  }
}

async function testVisualAnalyzer() {
  log('\n═══════════════════════════════════════════════════════════', 'cyan');
  log('🧪 PRUEBA 2: VisualAnalyzer', 'cyan');
  log('═══════════════════════════════════════════════════════════\n', 'cyan');

  try {
    const visualAnalyzer = new VisualAnalyzer();

    log('🔍 Verificando conexión a G4F...', 'blue');

    // Crear una captura de prueba
    log('\n📸 Creando captura de prueba...', 'blue');
    
    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <body>
        <h1>Formulario Preoperacional</h1>
        <form>
          <div style="border: 2px solid red; padding: 10px;">
            <label>Supervisor (ERROR)</label>
            <input type="text" style="border: 2px solid red;">
          </div>
          <div style="padding: 10px;">
            <label>Kilometraje</label>
            <input type="number" value="100">
          </div>
          <button>Guardar</button>
        </form>
      </body>
      </html>
    `);

    const screenshotPath = '/tmp/test-screenshot.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    log(`✅ Captura guardada: ${screenshotPath}`, 'green');

    // Analizar captura
    log('\n🔍 Analizando captura con G4F...', 'blue');
    const analysis = await visualAnalyzer.analyzeScreenshot(screenshotPath);

    if (analysis) {
      log(`✅ Análisis completado:`, 'green');
      log(`  • Completo: ${analysis.isComplete}`, 'green');
      log(`  • Campos vacíos: ${analysis.emptyFields.length}`, 'green');
      log(`  • Campos con error: ${analysis.errorFields.length}`, 'green');
      log(`  • Confianza: ${analysis.confidence}%`, 'green');
      log(`  • Resumen: ${analysis.summary}`, 'green');
    } else {
      log('⚠️ No se pudo analizar la captura', 'yellow');
    }

    // Generar reporte
    const report = visualAnalyzer.generateReport();
    log(`\n📄 Reporte visual:`, 'blue');
    log(`  • Análisis realizados: ${report.analysisCount}`, 'blue');
    log(`  • Confianza promedio: ${report.summary.averageConfidence}%`, 'blue');

    await browser.close();
    
    // Limpiar
    if (fs.existsSync(screenshotPath)) {
      fs.unlinkSync(screenshotPath);
    }

    log('\n✅ Prueba 2 completada\n', 'green');

  } catch (error) {
    log(`\n❌ Error en prueba 2: ${error.message}\n`, 'red');
  }
}

async function main() {
  log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log('║          🧪 PRUEBAS DE ANALIZADORES                      ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════╝\n', 'cyan');

  await testFormAnalyzer();
  await testVisualAnalyzer();

  log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log('║          ✅ PRUEBAS COMPLETADAS                          ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════╝\n', 'cyan');
}

main().catch(error => {
  log(`\n❌ Error fatal: ${error.message}\n`, 'red');
  process.exit(1);
});
