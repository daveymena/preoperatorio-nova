const cron = require('node-cron');
const { startWorker } = require('./worker');
const { get, run } = require('./lib/db');
const fs = require('fs');

// Variable para rastrear si ya se ejecutó hoy
let executedToday = false;
let lastExecutionDate = null;
let lastExecutionError = null;

// Crear directorio de logs si no existe
const logsDir = process.env.NODE_ENV === 'production' ? '/app/logs' : './logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Función para registrar en archivo
function logToFile(message) {
  const timestamp = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
  const logMessage = `[${timestamp}] ${message}\n`;
  try {
    fs.appendFileSync(`${logsDir}/scheduler.log`, logMessage);
  } catch (e) {
    console.error('Error escribiendo log:', e.message);
  }
}

// Función para verificar si ya se ejecutó hoy
async function checkIfExecutedToday() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  if (lastExecutionDate === today) {
    return true;
  }
  
  // Verificar en la base de datos si algún usuario fue procesado hoy
  try {
    const result = await get(`SELECT last_run FROM users WHERE last_run IS NOT NULL ORDER BY last_run DESC LIMIT 1`);
    if (result && result.last_run) {
      const lastRunDate = new Date(result.last_run).toISOString().split('T')[0];
      if (lastRunDate === today) {
        lastExecutionDate = today;
        return true;
      }
    }
  } catch (e) {
    logToFile(`⚠️ Error verificando última ejecución: ${e.message}`);
  }
  
  return false;
}

// Función para ejecutar el worker con verificación
async function executeWorkerIfNeeded() {
  const alreadyExecuted = await checkIfExecutedToday();
  
  if (alreadyExecuted) {
    logToFile('✅ El preoperacional ya fue ejecutado hoy. Saltando...');
    console.log('✅ El preoperacional ya fue ejecutado hoy. Saltando...');
    return;
  }
  
  logToFile('🚀 Iniciando ejecución del preoperacional...');
  console.log('🚀 Iniciando ejecución del preoperacional...');
  
  try {
    await startWorker();
    const today = new Date().toISOString().split('T')[0];
    lastExecutionDate = today;
    executedToday = true;
    lastExecutionError = null;
    logToFile('✅ Ejecución completada exitosamente.');
    console.log('✅ Ejecución completada exitosamente.');
  } catch (error) {
    lastExecutionError = error.message;
    logToFile(`❌ Error durante la ejecución: ${error.message}`);
    console.error('❌ Error durante la ejecución:', error.message);
  }
}

// Programar intentos cada hora de 6:00 AM a 12:00 PM (6, 7, 8, 9, 10, 11, 12)
// Si ya se ejecutó exitosamente, no se volverá a ejecutar ese día
const hoursToTry = [6, 7, 8, 9, 10, 11, 12];

hoursToTry.forEach(hour => {
  cron.schedule(`0 ${hour} * * *`, () => {
    const now = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
    const msg = `⏰ [${hour}:00] Verificando si es necesario ejecutar el preoperacional...`;
    logToFile(msg);
    console.log(msg);
    executeWorkerIfNeeded().catch(e => {
      logToFile(`❌ Error no capturado: ${e.message}`);
      console.error('❌ Error no capturado:', e.message);
    });
  }, {
    timezone: 'America/Bogota'
  });
});

// Resetear el flag a medianoche para permitir ejecución al día siguiente
cron.schedule('0 0 * * *', () => {
  executedToday = false;
  lastExecutionDate = null;
  const msg = '🌙 Nuevo día iniciado. Flag de ejecución reseteado.';
  logToFile(msg);
  console.log(msg);
}, {
  timezone: 'America/Bogota'
});

// Heartbeat cada hora para verificar que el proceso sigue vivo
cron.schedule('0 * * * *', () => {
  const now = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
  const status = executedToday ? '✅ Ejecutado hoy' : '⏳ Pendiente';
  const errorInfo = lastExecutionError ? ` | Error: ${lastExecutionError}` : '';
  const msg = `📡 [Heartbeat] Scheduler activo | ${now} | ${status}${errorInfo}`;
  logToFile(msg);
  console.log(msg);
});

// Logs iniciales
const startupTime = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
const initMsg = `
═══════════════════════════════════════════════════════════
📅 SCHEDULER DE PREOPERACIONALES ACTIVO
═══════════════════════════════════════════════════════════
⏰ Ventana de ejecución: 6:00 AM - 12:00 PM (Colombia)
🔄 Reintentos cada hora si no se ha ejecutado
🚀 Proceso iniciado el: ${startupTime}
═══════════════════════════════════════════════════════════
`;

logToFile(initMsg);
console.log(initMsg);
