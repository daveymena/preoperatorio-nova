#!/usr/bin/env node

/**
 * Script de verificación para EasyPanel
 * Verifica que todos los componentes estén funcionando correctamente
 */

const fs = require('fs');
const path = require('path');
const { all } = require('./lib/db');

const logsDir = process.env.NODE_ENV === 'production' ? '/app/logs' : './logs';

// Colores para la consola
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

async function checkLogs() {
  log('\n📋 Verificando archivos de logs...', 'cyan');
  
  const logFiles = ['startup.log', 'scheduler.log', 'worker.log', 'nextjs.log'];
  
  for (const file of logFiles) {
    const filePath = path.join(logsDir, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const size = (stats.size / 1024).toFixed(2);
      const mtime = new Date(stats.mtime).toLocaleString('es-CO', { timeZone: 'America/Bogota' });
      log(`  ✅ ${file} (${size} KB, actualizado: ${mtime})`, 'green');
    } else {
      log(`  ⚠️ ${file} no encontrado`, 'yellow');
    }
  }
}

async function checkDatabase() {
  log('\n🗄️ Verificando base de datos...', 'cyan');
  
  try {
    const users = await all(`SELECT COUNT(*) as count FROM users`);
    const activeUsers = await all(`SELECT COUNT(*) as count FROM users WHERE active = 1`);
    
    log(`  ✅ Usuarios totales: ${users[0].count}`, 'green');
    log(`  ✅ Usuarios activos: ${activeUsers[0].count}`, 'green');
    
    // Mostrar últimas ejecuciones
    const lastRuns = await all(`
      SELECT nombre, last_run, km_actual 
      FROM users 
      WHERE last_run IS NOT NULL 
      ORDER BY last_run DESC 
      LIMIT 5
    `);
    
    if (lastRuns.length > 0) {
      log('\n  📊 Últimas ejecuciones:', 'blue');
      for (const run of lastRuns) {
        const date = new Date(run.last_run).toLocaleString('es-CO', { timeZone: 'America/Bogota' });
        log(`    • ${run.nombre}: ${date} (KM: ${run.km_actual})`, 'blue');
      }
    }
  } catch (error) {
    log(`  ❌ Error accediendo a la base de datos: ${error.message}`, 'red');
  }
}

async function checkScheduler() {
  log('\n⏰ Verificando scheduler...', 'cyan');
  
  try {
    const schedulerLog = path.join(logsDir, 'scheduler.log');
    if (fs.existsSync(schedulerLog)) {
      const content = fs.readFileSync(schedulerLog, 'utf8');
      const lines = content.split('\n').filter(l => l.trim());
      
      // Buscar la última ejecución
      const lastExecution = lines.filter(l => l.includes('Iniciando ejecución')).pop();
      const lastHeartbeat = lines.filter(l => l.includes('Heartbeat')).pop();
      
      if (lastExecution) {
        log(`  ✅ Última ejecución: ${lastExecution.split('] ')[1]}`, 'green');
      }
      
      if (lastHeartbeat) {
        log(`  ✅ Último heartbeat: ${lastHeartbeat.split('] ')[1]}`, 'green');
      }
      
      // Buscar errores
      const errors = lines.filter(l => l.includes('❌'));
      if (errors.length > 0) {
        log(`  ⚠️ Errores detectados: ${errors.length}`, 'yellow');
        errors.slice(-3).forEach(e => {
          log(`    • ${e.split('] ')[1]}`, 'yellow');
        });
      }
    } else {
      log(`  ⚠️ scheduler.log no encontrado`, 'yellow');
    }
  } catch (error) {
    log(`  ❌ Error verificando scheduler: ${error.message}`, 'red');
  }
}

async function checkWorker() {
  log('\n🤖 Verificando worker...', 'cyan');
  
  try {
    const workerLog = path.join(logsDir, 'worker.log');
    if (fs.existsSync(workerLog)) {
      const content = fs.readFileSync(workerLog, 'utf8');
      const lines = content.split('\n').filter(l => l.trim());
      
      // Contar ejecuciones exitosas
      const successful = lines.filter(l => l.includes('✅ Completado')).length;
      const failed = lines.filter(l => l.includes('❌ Error')).length;
      
      log(`  ✅ Ejecuciones exitosas: ${successful}`, 'green');
      if (failed > 0) {
        log(`  ⚠️ Ejecuciones fallidas: ${failed}`, 'yellow');
      }
      
      // Mostrar últimas ejecuciones
      const lastSuccessful = lines.filter(l => l.includes('✅ Completado')).pop();
      if (lastSuccessful) {
        log(`  ✅ Última exitosa: ${lastSuccessful.split('] ')[1]}`, 'green');
      }
    } else {
      log(`  ⚠️ worker.log no encontrado`, 'yellow');
    }
  } catch (error) {
    log(`  ❌ Error verificando worker: ${error.message}`, 'red');
  }
}

async function checkNextJS() {
  log('\n🌐 Verificando Next.js...', 'cyan');
  
  try {
    const response = await fetch('http://localhost:3000', { timeout: 5000 });
    if (response.ok) {
      log(`  ✅ Servidor web activo (puerto 3000)`, 'green');
    } else {
      log(`  ⚠️ Servidor web respondió con código ${response.status}`, 'yellow');
    }
  } catch (error) {
    log(`  ❌ Servidor web no accesible: ${error.message}`, 'red');
  }
}

async function main() {
  log('\n═══════════════════════════════════════════════════════════', 'cyan');
  log('🔍 VERIFICACIÓN DEL SISTEMA - EASYPANEL', 'cyan');
  log('═══════════════════════════════════════════════════════════\n', 'cyan');
  
  const timestamp = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
  log(`Verificación realizada: ${timestamp}\n`, 'blue');
  
  // Verificar que el directorio de logs existe
  if (!fs.existsSync(logsDir)) {
    log(`⚠️ Directorio de logs no existe: ${logsDir}`, 'yellow');
    log(`Creando directorio...`, 'yellow');
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  // Ejecutar verificaciones
  await checkLogs();
  await checkDatabase();
  await checkScheduler();
  await checkWorker();
  await checkNextJS();
  
  log('\n═══════════════════════════════════════════════════════════', 'cyan');
  log('✅ Verificación completada', 'green');
  log('═══════════════════════════════════════════════════════════\n', 'cyan');
}

main().catch(error => {
  log(`\n❌ Error fatal: ${error.message}`, 'red');
  process.exit(1);
});
