#!/usr/bin/env node

/**
 * Script de prueba para G4F Analyzer
 * Verifica que G4F funciona correctamente
 */

const G4FAnalyzer = require('./lib/g4f-analyzer');
const VisualAnalyzerG4F = require('./lib/visual-analyzer-g4f');
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

async function testG4FInfo() {
  log('\n═══════════════════════════════════════════════════════════', 'cyan');
  log('📋 INFORMACIÓN DE G4F', 'cyan');
  log('═══════════════════════════════════════════════════════════\n', 'cyan');

  try {
    const info = await G4FAnalyzer.getG4FInfo();

    log(`Nombre: ${info.name}`, 'blue');
    log(`Descripción: ${info.description}`, 'blue');
    log(`Costo: ${info.cost}`, 'green');

    log('\n📊 Modelos Disponibles:', 'blue');
    info.models.forEach(model => log(`  • ${model}`, 'blue'));

    log('\n🔌 Proveedores:', 'blue');
    info.providers.forEach(provider => log(`  • ${provider}`, 'blue'));

    log('\n✨ Ventajas:', 'green');
    info.advantages.forEach(adv => log(`  ${adv}`, 'green'));

  } catch (error) {
    log(`\n❌ Error obteniendo información: ${error.message}\n`, 'red');
  }
}

async function testG4FAnalyzer() {
  log('\n═══════════════════════════════════════════════════════════', 'cyan');
  log('🧪 PRUEBA: G4F Analyzer', 'cyan');
  log('═══════════════════════════════════════════════════════════\n', 'cyan');

  try {
    const analyzer = new G4FAnalyzer();

    log('📸 Creando captura de prueba...', 'blue');

    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial; padding: 20px; }
          .form-group { margin: 15px 0; }
          .error { border: 2px solid red; }
          label { font-weight: bold; }
          input, select, textarea { padding: 8px; width: 300px; }
        </style>
      </head>
      <body>
        <h1>Formulario Preoperacional</h1>
        <form>
          <div class="form-group">
            <label>Supervisor *</label>
            <input type="text" class="error" placeholder="Nombre del supervisor">
            <span style="color: red;">Campo requerido</span>
          </div>
          
          <div class="form-group">
            <label>Kilometraje *</label>
            <input type="number" value="100">
          </div>
          
          <div class="form-group">
            <label>¿Luces funcionando? *</label>
            <input type="radio" name="luces" value="Sí"> Sí
            <input type="radio" name="luces" value="No"> No
          </div>
          
          <div class="form-group">
            <label>Estado del vehículo *</label>
            <select>
              <option value="">Seleccionar...</option>
              <option value="bueno">Bueno</option>
              <option value="regular">Regular</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Observaciones</label>
            <textarea placeholder="Observaciones"></textarea>
          </div>
          
          <button type="submit">Guardar</button>
        </form>
      </body>
      </html>
    `);

    const screenshotPath = '/tmp/test-g4f-screenshot.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    log(`✅ Captura guardada: ${screenshotPath}`, 'green');

    log('\n🔍 Analizando captura con G4F...', 'blue');
    const analysis = await analyzer.analyzeScreenshot(screenshotPath);

    if (analysis) {
      log(`\n✅ Análisis completado:`, 'green');
      log(`  • Completo: ${analysis.isComplete}`, 'green');
      log(`  • Campos vacíos: ${analysis.emptyFields.length}`, 'green');
      log(`  • Campos con error: ${analysis.errorFields.length}`, 'green');
      log(`  • Confianza: ${analysis.confidence}%`, 'green');
      log(`  • Resumen: ${analysis.summary}`, 'green');

      if (analysis.emptyFields.length > 0) {
        log('\n📋 Campos vacíos detectados:', 'yellow');
        analysis.emptyFields.forEach(f => log(`  • ${f}`, 'yellow'));
      }

      if (analysis.errorFields.length > 0) {
        log('\n⚠️ Campos con error:', 'yellow');
        analysis.errorFields.forEach(f => log(`  • ${f}`, 'yellow'));
      }

      if (analysis.suggestions.length > 0) {
        log('\n💡 Sugerencias:', 'blue');
        analysis.suggestions.forEach(s => log(`  • ${s}`, 'blue'));
      }
    } else {
      log(`\n⚠️ No se pudo analizar la captura`, 'yellow');
      log(`   Verifica que G4F está instalado: pip install g4f`, 'yellow');
    }

    // Generar reporte
    const report = analyzer.generateReport();
    log(`\n📄 Reporte:`, 'blue');
    log(`  • Análisis realizados: ${report.analysisCount}`, 'blue');
    log(`  • Confianza promedio: ${report.summary.averageConfidence}%`, 'blue');

    await browser.close();

    // Limpiar
    if (fs.existsSync(screenshotPath)) {
      fs.unlinkSync(screenshotPath);
    }

    log('\n✅ Prueba completada\n', 'green');

  } catch (error) {
    log(`\n❌ Error en prueba: ${error.message}\n`, 'red');
  }
}

async function testVisualAnalyzerG4F() {
  log('\n═══════════════════════════════════════════════════════════', 'cyan');
  log('🧪 PRUEBA: Visual Analyzer G4F', 'cyan');
  log('═══════════════════════════════════════════════════════════\n', 'cyan');

  try {
    const visualAnalyzer = new VisualAnalyzerG4F();

    log('📸 Creando captura de prueba...', 'blue');

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
          <div style="border: 2px solid red; padding: 10px; margin: 10px 0;">
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

    const screenshotPath = '/tmp/test-visual-g4f.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    log(`✅ Captura guardada: ${screenshotPath}`, 'green');

    log('\n🔍 Analizando con Visual Analyzer G4F...', 'blue');
    const complete = await visualAnalyzer.isFormComplete(screenshotPath);

    if (complete) {
      log(`\n✅ Análisis completado:`, 'green');
      log(`  • Completo: ${complete.complete}`, 'green');
      log(`  • Campos vacíos: ${complete.emptyFields.length}`, 'green');
      log(`  • Confianza: ${complete.confidence}%`, 'green');
    } else {
      log(`\n⚠️ No se pudo analizar`, 'yellow');
    }

    await browser.close();

    // Limpiar
    if (fs.existsSync(screenshotPath)) {
      fs.unlinkSync(screenshotPath);
    }

    log('\n✅ Prueba completada\n', 'green');

  } catch (error) {
    log(`\n❌ Error en prueba: ${error.message}\n`, 'red');
  }
}

async function main() {
  log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log('║          🧪 PRUEBAS DE G4F (gpt4free)                   ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════╝\n', 'cyan');

  await testG4FInfo();
  await testG4FAnalyzer();
  await testVisualAnalyzerG4F();

  log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log('║          ✅ PRUEBAS COMPLETADAS                          ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════╝\n', 'cyan');
}

main().catch(error => {
  log(`\n❌ Error fatal: ${error.message}\n`, 'red');
  process.exit(1);
});
