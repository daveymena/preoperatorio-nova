#!/usr/bin/env node

/**
 * Script de inicio para Easypanel/Docker
 * 1. Reactiva todos los usuarios por 5 días
 * 2. Inicia el scheduler automático
 */

const { spawn } = require('child_process');
const { all, run } = require('./lib/db');

async function reactivateAllUsers() {
  console.log('🔄 Reactivando todos los usuarios por 5 días...\n');
  
  try {
    const users = await all(`SELECT * FROM users`);
    
    if (users.length === 0) {
      console.log('⚠️ No hay usuarios registrados aún.');
      return;
    }
    
    const now = new Date();
    const fiveDaysLater = new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000));
    
    for (const user of users) {
      await run(
        `UPDATE users SET 
          subscription_status = 'active', 
          active = 1, 
          subscription_until = ? 
        WHERE id = ?`,
        [fiveDaysLater.toISOString(), user.id]
      );
      
      console.log(`✅ ${user.nombre} - Reactivado hasta ${fiveDaysLater.toLocaleDateString('es-CO')}`);
    }
    
    console.log(`\n🎉 ${users.length} usuarios reactivados exitosamente.`);
    console.log(`📅 Expiración: ${fiveDaysLater.toLocaleDateString('es-CO')} ${fiveDaysLater.toLocaleTimeString('es-CO')}\n`);
    
  } catch (error) {
    console.error('❌ Error reactivando usuarios:', error.message);
  }
}

async function startScheduler() {
  console.log('🚀 Iniciando scheduler...\n');
  
  // Iniciar el scheduler como proceso hijo
  const scheduler = spawn('node', ['scheduler.js'], {
    stdio: 'inherit',
    cwd: __dirname
  });
  
  scheduler.on('error', (error) => {
    console.error('❌ Error iniciando scheduler:', error);
    process.exit(1);
  });
  
  scheduler.on('exit', (code) => {
    console.log(`⚠️ Scheduler terminó con código ${code}`);
    process.exit(code);
  });
  
  // Manejar señales de terminación
  process.on('SIGTERM', () => {
    console.log('📡 Recibida señal SIGTERM, cerrando...');
    scheduler.kill('SIGTERM');
  });
  
  process.on('SIGINT', () => {
    console.log('📡 Recibida señal SIGINT, cerrando...');
    scheduler.kill('SIGINT');
  });
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('🚀 NOVA 360 AUTOMATION - INICIO DEL SISTEMA');
  console.log('═══════════════════════════════════════════════════\n');
  
  // Paso 1: Reactivar usuarios
  await reactivateAllUsers();
  
  // Paso 2: Iniciar scheduler
  await startScheduler();
}

main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
