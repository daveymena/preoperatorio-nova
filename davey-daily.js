const cron = require('node-cron');

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { get, run } = require('./lib/db');
const { processUserImproved } = require('./lib/process-user-improved');
const fs = require('fs');

const logsDir = process.env.NODE_ENV === 'production' ? '/app/logs' : './logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

let executedToday = false;
let lastExecutionDate = null;
let lastExecutionError = null;

function logToFile(message) {
  const timestamp = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
  fs.appendFileSync(`${logsDir}/davey-daily.log`, `[${timestamp}] ${message}\n`);
}

async function checkIfExecutedToday() {
  const today = new Date().toISOString().split('T')[0];
  if (lastExecutionDate === today) return true;
  try {
    const result = await get(`SELECT last_run FROM users WHERE email = 'daveymena16@gmail.com' LIMIT 1`);
    if (result && result.last_run) {
      const lastRunDate = new Date(result.last_run).toISOString().split('T')[0];
      if (lastRunDate === today) {
        lastExecutionDate = today;
        return true;
      }
    }
  } catch (e) {
    logToFile(`Error verificando última ejecución: ${e.message}`);
  }
  return false;
}

async function ejecutarDavey() {
  const yaEjecutado = await checkIfExecutedToday();
  if (yaEjecutado) {
    logToFile('Davey ya fue procesado hoy. Saltando...');
    return;
  }

  logToFile('Iniciando preoperatorio de Davey...');

  try {
    const user = await get(`SELECT * FROM users WHERE email = 'daveymena16@gmail.com' LIMIT 1`);
    if (!user) {
      logToFile('Usuario daveymena16@gmail.com no encontrado');
      return;
    }

    if (user.active !== 1) {
      logToFile(`Usuario ${user.nombre} está inactivo. Reactivando...`);
      const now = new Date();
      const fiveDaysLater = new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000));
      await run(
        `UPDATE users SET subscription_status = 'active', active = 1, subscription_until = ? WHERE id = ?`,
        [fiveDaysLater.toISOString(), user.id]
      );
    }

    await processUserImproved(user);

    const today = new Date().toISOString().split('T')[0];
    lastExecutionDate = today;
    executedToday = true;
    lastExecutionError = null;
    logToFile('Preoperatorio de Davey completado exitosamente');
  } catch (error) {
    lastExecutionError = error.message;
    logToFile(`Error: ${error.message}`);
  }
}

const horasIntento = [5, 6, 7, 8, 9, 10, 11, 12];

horasIntento.forEach(hora => {
  cron.schedule(`0 ${hora} * * *`, () => {
    logToFile(`[${hora}:00] Verificando si es necesario ejecutar...`);
    ejecutarDavey().catch(e => logToFile(`Error no capturado: ${e.message}`));
  }, { timezone: 'America/Bogota' });
});

cron.schedule('0 0 * * *', () => {
  executedToday = false;
  lastExecutionDate = null;
  logToFile('Nuevo día iniciado. Flag reseteado.');
}, { timezone: 'America/Bogota' });

cron.schedule('0 * * * *', () => {
  const status = executedToday ? 'Ejecutado hoy' : 'Pendiente';
  const errorInfo = lastExecutionError ? ` | Error: ${lastExecutionError}` : '';
  logToFile(`[Heartbeat] Davey Daily activo | ${status}${errorInfo}`);
});

const startupTime = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
console.log(`
╔═══════════════════════════════════════════════════════╗
║  DAVEY DAILY - Preoperatorio Automático              ║
╠═══════════════════════════════════════════════════════╣
║  Usuario: daveymena16@gmail.com                      ║
║  Ventana: 5:00 AM - 12:00 PM (Colombia)              ║
║  Iniciado: ${startupTime}               ║
╚═══════════════════════════════════════════════════════╝
`);
logToFile('Davey Daily iniciado - Ventana 5:00 AM - 12:00 PM');
