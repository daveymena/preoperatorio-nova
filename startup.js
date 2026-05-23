#!/usr/bin/env node

/**
 * Script de inicio para Easypanel/Docker
 * 1. Reactiva todos los usuarios por 5 días
 * 2. Inicia el scheduler automático
 */

const { spawn } = require('child_process');
const { all, run } = require('./lib/db');
const fs = require('fs');

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
    fs.appendFileSync(`${logsDir}/startup.log`, logMessage);
  } catch (e) {
    console.error('Error escribiendo log:', e.message);
  }
}

async function reactivateAllUsers() {
  const msg = '🔄 Reactivando todos los usuarios por 5 días...\n';
  console.log(msg);
  logToFile(msg);
  
  try {
    const users = await all(`SELECT * FROM users`);
    
    if (users.length === 0) {
      const warnMsg = '⚠️ No hay usuarios registrados aún.';
      console.log(warnMsg);
      logToFile(warnMsg);
      return;
    }
    
    const now = new Date();
    const fiveDaysLater = new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000));
    
    for (const user of users) {
      try {
        await run(
          `UPDATE users SET 
            subscription_status = 'active', 
            active = 1, 
            subscription_until = ? 
          WHERE id = ?`,
          [fiveDaysLater.toISOString(), user.id]
        );
        
        const userMsg = `✅ ${user.nombre} - Reactivado hasta ${fiveDaysLater.toLocaleDateString('es-CO')}`;
        console.log(userMsg);
        logToFile(userMsg);
      } catch (e) {
        const errorMsg = `❌ Error reactivando ${user.nombre}: ${e.message}`;
        console.error(errorMsg);
        logToFile(errorMsg);
      }
    }
    
    const successMsg = `\n🎉 ${users.length} usuarios reactivados exitosamente.\n📅 Expiración: ${fiveDaysLater.toLocaleDateString('es-CO')} ${fiveDaysLater.toLocaleTimeString('es-CO')}\n`;
    console.log(successMsg);
    logToFile(successMsg);
    
  } catch (error) {
    const errorMsg = `❌ Error reactivando usuarios: ${error.message}`;
    console.error(errorMsg);
    logToFile(errorMsg);
  }
}

async function startScheduler() {
  const msg = '🚀 Iniciando scheduler...\n';
  console.log(msg);
  logToFile(msg);
  
  // Iniciar el scheduler como proceso hijo
  const scheduler = spawn('node', ['scheduler.js'], {
    stdio: 'inherit',
    cwd: __dirname,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      TZ: 'America/Bogota'
    }
  });
  
  scheduler.on('error', (error) => {
    const errorMsg = `❌ Error iniciando scheduler: ${error.message}`;
    console.error(errorMsg);
    logToFile(errorMsg);
    process.exit(1);
  });
  
  scheduler.on('exit', (code) => {
    const exitMsg = `⚠️ Scheduler terminó con código ${code}`;
    console.log(exitMsg);
    logToFile(exitMsg);
    process.exit(code);
  });
  
  // Manejar señales de terminación
  process.on('SIGTERM', () => {
    const msg = '📡 Recibida señal SIGTERM, cerrando...';
    console.log(msg);
    logToFile(msg);
    scheduler.kill('SIGTERM');
  });
  
  process.on('SIGINT', () => {
    const msg = '📡 Recibida señal SIGINT, cerrando...';
    console.log(msg);
    logToFile(msg);
    scheduler.kill('SIGINT');
  });
}

async function main() {
  const header = `
═══════════════════════════════════════════════════════════
🚀 NOVA 360 AUTOMATION - INICIO DEL SISTEMA
═══════════════════════════════════════════════════════════
`;
  console.log(header);
  logToFile(header);
  
  // Paso 1: Reactivar usuarios
  await reactivateAllUsers();
  
  // Paso 2: Iniciar scheduler
  await startScheduler();
}

main().catch(error => {
  const errorMsg = `❌ Error fatal: ${error.message}`;
  console.error(errorMsg);
  logToFile(errorMsg);
  process.exit(1);
});
