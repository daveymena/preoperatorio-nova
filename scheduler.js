const cron = require('node-cron');
const { get, run } = require('./lib/db');
const { processUserImproved } = require('./lib/process-user-improved');
const fs = require('fs');

// Variable para rastrear si ya se ejecutó hoy
let executedToday = false;
let lastExecutionDate = null;
let lastExecutionError = null;

function colombiaDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

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
  const today = colombiaDateKey();
  
  if (lastExecutionDate === today) {
    return true;
  }
  
  // Verificar en la base de datos si algún usuario fue procesado hoy
  try {
    const result = await get(`SELECT last_run FROM users WHERE last_run IS NOT NULL ORDER BY last_run DESC LIMIT 1`);
    if (result && result.last_run) {
      const lastRunDate = colombiaDateKey(new Date(result.last_run));
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

// Función para ejecutar el worker SOLO para daveymena16@gmail.com
async function executeWorkerIfNeeded() {
  const alreadyExecuted = await checkIfExecutedToday();
  
  if (alreadyExecuted) {
    logToFile('✅ El preoperacional ya fue ejecutado hoy. Saltando...');
    console.log('✅ El preoperacional ya fue ejecutado hoy. Saltando...');
    return;
  }
  
  logToFile('🚀 Iniciando ejecución del preoperacional para daveymena16@gmail.com...');
  console.log('🚀 Iniciando ejecución del preoperacional para daveymena16@gmail.com...');
  
  try {
    // Obtener solo el usuario daveymena16@gmail.com
    const user = await get(`SELECT * FROM users WHERE email = 'daveymena16@gmail.com' LIMIT 1`);
    
    if (!user) {
      const msgNoUser = '⚠️ Usuario daveymena16@gmail.com no encontrado en la base de datos.';
      logToFile(msgNoUser);
      console.warn(msgNoUser);
      return;
    }
    
    if (user.active !== 1) {
      const msgInactive = `⚠️ Usuario ${user.nombre} está inactivo. Activando...`;
      logToFile(msgInactive);
      console.log(msgInactive);
      
      // Reactivar por 5 días
      const now = new Date();
      const fiveDaysLater = new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000));
      await run(
        `UPDATE users SET subscription_status = 'active', active = 1, subscription_until = ? WHERE id = ?`,
        [fiveDaysLater.toISOString(), user.id]
      );
    }
    
    // Importar y ejecutar para solo este usuario
    await processUserImproved(user);
    
    const today = colombiaDateKey();
    lastExecutionDate = today;
    executedToday = true;
    lastExecutionError = null;
    logToFile('✅ Ejecución completada exitosamente para daveymena16@gmail.com.');
    console.log('✅ Ejecución completada exitosamente para daveymena16@gmail.com.');
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
📡 [Heartbeat] Scheduler activo | ${startupTime} | ⏳ Pendiente
📅 SCHEDULER DE PREOPERACIONALES ACTIVO
═══════════════════════════════════════════════════════════
⏰ Ventana de ejecución: 6:00 AM - 12:00 PM (Colombia)
🔄 Reintentos cada hora si no se ha ejecutado
🚀 Proceso iniciado el: ${startupTime}
═══════════════════════════════════════════════════════════
`;

logToFile(initMsg);
console.log(initMsg);
