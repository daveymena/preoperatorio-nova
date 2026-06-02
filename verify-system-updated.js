/**
 * Script de verificación del sistema actualizado
 * Verifica que todos los componentes usen la versión correcta de process-user-improved
 */

const fs = require('fs');

console.log('═══════════════════════════════════════════════════════════');
console.log('🔍 VERIFICACIÓN DEL SISTEMA ACTUALIZADO');
console.log('═══════════════════════════════════════════════════════════\n');

const checks = [];

// 1. Verificar que worker.js usa processUserImproved
const workerContent = fs.readFileSync('./worker.js', 'utf8');
const workerUsesImproved = workerContent.includes("const { processUserImproved } = require('./lib/process-user-improved')");
const workerHasOldImplementation = workerContent.includes('async function processUser(user) {') && 
                                    workerContent.includes('const browser = await puppeteer.launch');

checks.push({
  name: 'worker.js importa processUserImproved',
  status: workerUsesImproved,
  details: workerUsesImproved ? '✅ Correcto' : '❌ No encontrado'
});

checks.push({
  name: 'worker.js NO tiene implementación antigua',
  status: !workerHasOldImplementation,
  details: !workerHasOldImplementation ? '✅ Correcto' : '❌ Aún tiene código viejo'
});

// 2. Verificar que scheduler.js usa processUserImproved
const schedulerContent = fs.readFileSync('./scheduler.js', 'utf8');
const schedulerUsesImproved = schedulerContent.includes("const { processUserImproved } = require('./lib/process-user-improved')");
const schedulerCallsImproved = schedulerContent.includes('await processUserImproved(user)');
const schedulerNoOldWorker = !schedulerContent.includes("const { startWorker } = require('./worker')");

checks.push({
  name: 'scheduler.js importa processUserImproved',
  status: schedulerUsesImproved,
  details: schedulerUsesImproved ? '✅ Correcto' : '❌ No encontrado'
});

checks.push({
  name: 'scheduler.js llama processUserImproved',
  status: schedulerCallsImproved,
  details: schedulerCallsImproved ? '✅ Correcto' : '❌ No encontrado'
});

checks.push({
  name: 'scheduler.js NO importa worker antiguo',
  status: schedulerNoOldWorker,
  details: schedulerNoOldWorker ? '✅ Correcto' : '❌ Aún importa worker.js'
});

// 3. Verificar que run-manual.js usa el wrapper ESM
const runManualContent = fs.readFileSync('./pages/api/run-manual.js', 'utf8');
const runManualUsesESM = runManualContent.includes("import { processUserImproved } from '../../lib/process-user-improved-esm.js'");

checks.push({
  name: 'run-manual.js usa wrapper ESM',
  status: runManualUsesESM,
  details: runManualUsesESM ? '✅ Correcto' : '❌ No encontrado'
});

// 4. Verificar que process-user-improved.js tiene detección de advertencias
const processContent = fs.readFileSync('./lib/process-user-improved.js', 'utf8');
const hasWarningDetection = processContent.includes('DETECCIÓN MEJORADA DE ADVERTENCIAS') &&
                             processContent.includes('DETIENE');
const hasVerification = processContent.includes('VERIFICACIÓN FINAL');
const hasFillMissing = processContent.includes('fillMissingFields');

checks.push({
  name: 'process-user-improved.js tiene detección de advertencias',
  status: hasWarningDetection,
  details: hasWarningDetection ? '✅ Correcto' : '❌ No encontrado'
});

checks.push({
  name: 'process-user-improved.js tiene verificación final',
  status: hasVerification,
  details: hasVerification ? '✅ Correcto' : '❌ No encontrado'
});

checks.push({
  name: 'process-user-improved.js rellena campos faltantes',
  status: hasFillMissing,
  details: hasFillMissing ? '✅ Correcto' : '❌ No encontrado'
});

// 5. Verificar estructura de archivos
const filesExist = [
  { path: './lib/process-user-improved.js', name: 'process-user-improved.js' },
  { path: './lib/process-user-improved-esm.js', name: 'process-user-improved-esm.js (wrapper)' },
  { path: './lib/form-analyzer.js', name: 'form-analyzer.js' },
  { path: './worker.js', name: 'worker.js' },
  { path: './scheduler.js', name: 'scheduler.js' },
  { path: './pages/api/run-manual.js', name: 'run-manual.js' }
];

filesExist.forEach(file => {
  const exists = fs.existsSync(file.path);
  checks.push({
    name: `Archivo ${file.name} existe`,
    status: exists,
    details: exists ? '✅ Existe' : '❌ No encontrado'
  });
});

// Mostrar resultados
console.log('📋 RESULTADOS DE VERIFICACIÓN:\n');
let allPassed = true;

checks.forEach((check, index) => {
  console.log(`${index + 1}. ${check.name}`);
  console.log(`   ${check.details}\n`);
  if (!check.status) allPassed = false;
});

console.log('═══════════════════════════════════════════════════════════');
if (allPassed) {
  console.log('✅ TODAS LAS VERIFICACIONES PASARON');
  console.log('');
  console.log('📝 SISTEMA ACTUALIZADO CORRECTAMENTE:');
  console.log('   • worker.js usa processUserImproved');
  console.log('   • scheduler.js usa processUserImproved');
  console.log('   • run-manual.js usa wrapper ESM');
  console.log('   • process-user-improved.js tiene detección completa');
  console.log('');
  console.log('🚀 PRÓXIMOS PASOS:');
  console.log('   1. Commit y push a GitHub');
  console.log('   2. Deploy en EasyPanel');
  console.log('   3. Probar ejecución manual desde dashboard');
  console.log('   4. Verificar scheduler automático');
} else {
  console.log('❌ ALGUNAS VERIFICACIONES FALLARON');
  console.log('   Revisa los detalles arriba');
}
console.log('═══════════════════════════════════════════════════════════');
