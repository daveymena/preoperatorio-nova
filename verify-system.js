#!/usr/bin/env node

/**
 * Script de verificación completa del sistema
 * Verifica que todo esté configurado correctamente antes de desplegar
 */

const fs = require('fs');
const path = require('path');
const { all } = require('./lib/db');

console.log('═══════════════════════════════════════════════════');
console.log('🔍 VERIFICACIÓN DEL SISTEMA NOVA 360');
console.log('═══════════════════════════════════════════════════\n');

let errors = 0;
let warnings = 0;

// 1. Verificar archivos críticos
console.log('1️⃣ Verificando archivos críticos...');
const criticalFiles = [
  'scheduler.js',
  'worker.js',
  'startup.js',
  'reactivate-all.js',
  'start.sh',
  'Dockerfile',
  'package.json',
  'lib/db.js',
  'lib/emails.js'
];

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - NO ENCONTRADO`);
    errors++;
  }
});

// 2. Verificar permisos de scripts
console.log('\n2️⃣ Verificando permisos de scripts...');
const scriptsToCheck = ['start.sh', 'startup.js'];
scriptsToCheck.forEach(script => {
  const scriptPath = path.join(__dirname, script);
  try {
    fs.accessSync(scriptPath, fs.constants.X_OK);
    console.log(`   ✅ ${script} - Ejecutable`);
  } catch (e) {
    console.log(`   ⚠️ ${script} - No ejecutable (se arreglará en Docker)`);
    warnings++;
  }
});

// 3. Verificar base de datos
console.log('\n3️⃣ Verificando base de datos...');
(async () => {
  try {
    const users = await all('SELECT * FROM users');
    console.log(`   ✅ Base de datos conectada`);
    console.log(`   📊 Usuarios registrados: ${users.length}`);
    
    if (users.length === 0) {
      console.log(`   ⚠️ No hay usuarios registrados aún`);
      warnings++;
    } else {
      const activeUsers = users.filter(u => u.active === 1);
      console.log(`   👥 Usuarios activos: ${activeUsers.length}`);
      
      users.forEach(u => {
        const status = u.active === 1 ? '✅' : '❌';
        console.log(`      ${status} ${u.nombre} (${u.email})`);
      });
    }
  } catch (e) {
    console.log(`   ❌ Error conectando a la base de datos: ${e.message}`);
    errors++;
  }
  
  // 4. Verificar configuración del scheduler
  console.log('\n4️⃣ Verificando configuración del scheduler...');
  const schedulerContent = fs.readFileSync(path.join(__dirname, 'scheduler.js'), 'utf8');
  
  if (schedulerContent.includes('hoursToTry')) {
    console.log(`   ✅ Ventana de ejecución configurada`);
    const match = schedulerContent.match(/hoursToTry\s*=\s*\[([\d,\s]+)\]/);
    if (match) {
      const hours = match[1].split(',').map(h => h.trim());
      console.log(`   ⏰ Horas: ${hours.join(', ')}`);
    }
  } else {
    console.log(`   ❌ Ventana de ejecución NO configurada`);
    errors++;
  }
  
  if (schedulerContent.includes('checkIfExecutedToday')) {
    console.log(`   ✅ Verificación de ejecución diaria implementada`);
  } else {
    console.log(`   ❌ Verificación de ejecución diaria NO implementada`);
    errors++;
  }
  
  // 5. Verificar package.json
  console.log('\n5️⃣ Verificando package.json...');
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  
  const requiredScripts = ['dev', 'build', 'start', 'worker', 'reactivate'];
  requiredScripts.forEach(script => {
    if (packageJson.scripts[script]) {
      console.log(`   ✅ Script "${script}" configurado`);
    } else {
      console.log(`   ❌ Script "${script}" NO configurado`);
      errors++;
    }
  });
  
  // 6. Verificar dependencias
  console.log('\n6️⃣ Verificando dependencias críticas...');
  const requiredDeps = ['puppeteer', 'node-cron', 'next', 'react', 'sqlite3'];
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      console.log(`   ✅ ${dep}`);
    } else {
      console.log(`   ❌ ${dep} - NO INSTALADO`);
      errors++;
    }
  });
  
  // 7. Verificar variables de entorno (opcional)
  console.log('\n7️⃣ Verificando variables de entorno...');
  const optionalEnvVars = [
    'DATABASE_URL',
    'MERCADO_PAGO_ACCESS_TOKEN',
    'NEXT_PUBLIC_BASE_URL',
    'PUPPETEER_EXECUTABLE_PATH'
  ];
  
  optionalEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar} - Configurada`);
    } else {
      console.log(`   ⚠️ ${envVar} - No configurada (opcional)`);
    }
  });
  
  // Resumen final
  console.log('\n═══════════════════════════════════════════════════');
  console.log('📊 RESUMEN DE VERIFICACIÓN');
  console.log('═══════════════════════════════════════════════════');
  
  if (errors === 0 && warnings === 0) {
    console.log('✅ Sistema completamente verificado');
    console.log('🚀 Listo para desplegar en Easypanel');
  } else if (errors === 0) {
    console.log(`⚠️ Sistema verificado con ${warnings} advertencia(s)`);
    console.log('✅ Listo para desplegar (advertencias no críticas)');
  } else {
    console.log(`❌ Se encontraron ${errors} error(es) y ${warnings} advertencia(s)`);
    console.log('⚠️ Corrige los errores antes de desplegar');
  }
  
  console.log('\n📚 Documentación:');
  console.log('   - README.md - Guía general');
  console.log('   - DESPLIEGUE.md - Guía de despliegue en Easypanel');
  console.log('   - CAMBIOS.md - Resumen de cambios implementados');
  
  console.log('\n🛠️ Comandos útiles:');
  console.log('   npm run reactivate - Reactivar usuarios por 5 días');
  console.log('   node test-scheduler.js - Probar lógica del scheduler');
  console.log('   node list-users.js - Listar usuarios registrados');
  
  process.exit(errors > 0 ? 1 : 0);
})();
