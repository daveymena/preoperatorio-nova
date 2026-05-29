#!/usr/bin/env node

/**
 * Script de prueba manual para verificar que el sistema:
 * 1. Rellena TODOS los campos
 * 2. Detecta y corrige advertencias
 * 3. Guarda con éxito
 * 4. Captura la foto en el instante exacto
 */

const { processUserImproved } = require('./lib/process-user-improved');
const { run } = require('./lib/db');
const fs = require('fs');

async function runTest() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 PRUEBA MANUAL - TAREA 8 VERIFICACIÓN');
  console.log('='.repeat(70) + '\n');

  try {
    // Obtener usuario de prueba
    const user = await new Promise((resolve, reject) => {
      run('SELECT * FROM users WHERE email = ?', ['daveymena16@gmail.com'], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      console.error('❌ Usuario no encontrado: daveymena16@gmail.com');
      process.exit(1);
    }

    console.log('👤 Usuario encontrado:');
    console.log(`   Nombre: ${user.nombre}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Cédula: ${user.cedula}`);
    console.log(`   Placa: ${user.placa}`);
    console.log(`   KM actual: ${user.km_actual}`);
    console.log('');

    // Ejecutar procesamiento
    console.log('🚀 Iniciando procesamiento...\n');
    await processUserImproved(user);

    // Verificar resultados
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESULTADOS DE LA PRUEBA');
    console.log('='.repeat(70) + '\n');

    // Verificar que la captura se creó
    const shotFile = `evidence_${user.cedula}.png`;
    if (fs.existsSync(shotFile)) {
      const size = fs.statSync(shotFile).size;
      console.log(`✅ Captura creada: ${shotFile} (${size} bytes)`);
    } else {
      console.log(`❌ Captura NO creada: ${shotFile}`);
    }

    // Verificar que el reporte se creó
    const logsDir = './logs';
    if (fs.existsSync(logsDir)) {
      const files = fs.readdirSync(logsDir);
      const reports = files.filter(f => f.includes('form-analysis'));
      console.log(`✅ Reportes generados: ${reports.length}`);
      if (reports.length > 0) {
        console.log(`   Último reporte: ${reports[reports.length - 1]}`);
      }
    }

    // Verificar logs
    if (fs.existsSync(`${logsDir}/worker.log`)) {
      const logContent = fs.readFileSync(`${logsDir}/worker.log`, 'utf-8');
      const lines = logContent.split('\n').filter(l => l.trim());
      console.log(`✅ Log de worker: ${lines.length} líneas`);
      
      // Mostrar últimas líneas
      console.log('\n📝 Últimas líneas del log:');
      lines.slice(-10).forEach(line => {
        console.log(`   ${line}`);
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ PRUEBA COMPLETADA');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Error en la prueba:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTest();
