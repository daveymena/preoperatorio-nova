/**
 * Script para ejecutar preoperacional para TODOS los usuarios activos
 * Detecta automáticamente si usa SQLite o PostgreSQL
 */

const { all } = require('./lib/db');
const { processUserImproved } = require('./lib/process-user-improved');

async function testAllUsers() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 PRUEBA DE EJECUCIÓN - TODOS LOS USUARIOS ACTIVOS');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Obtener todos los usuarios activos
    console.log('🔍 Buscando usuarios activos...\n');
    const users = await all(`SELECT * FROM users WHERE active = 1 ORDER BY id`);

    if (users.length === 0) {
      console.log('⚠️ No hay usuarios activos en la base de datos\n');
      console.log('═══════════════════════════════════════════════════════════');
      return;
    }

    console.log(`✅ Encontrados ${users.length} usuario(s) activo(s):\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.nombre}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Placa: ${user.placa}`);
      console.log(`   Cédula: ${user.cedula}`);
      console.log(`   Estado: ${user.subscription_status || 'N/A'}`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚀 INICIANDO EJECUCIÓN DEL PREOPERACIONAL...\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Procesar cada usuario
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`\n[${ i + 1}/${users.length}] Procesando: ${user.nombre}`);
      console.log('─────────────────────────────────────────────────────────────\n');

      try {
        await processUserImproved(user);
        successCount++;
        console.log(`\n✅ [${i + 1}/${users.length}] ${user.nombre} - COMPLETADO\n`);
      } catch (error) {
        errorCount++;
        console.error(`\n❌ [${i + 1}/${users.length}] ${user.nombre} - ERROR: ${error.message}\n`);
      }

      // Esperar 5 segundos entre usuarios para evitar sobrecarga
      if (i < users.length - 1) {
        console.log('⏱️ Esperando 5 segundos antes del siguiente usuario...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // Resumen final
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 RESUMEN DE EJECUCIÓN');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`Total de usuarios procesados: ${users.length}`);
    console.log(`✅ Exitosos: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📈 Tasa de éxito: ${((successCount / users.length) * 100).toFixed(1)}%`);
    console.log('\n═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ ERROR FATAL:', error.message);
    console.error(error.stack);
    console.log('\n═══════════════════════════════════════════════════════════');
    process.exit(1);
  }

  process.exit(0);
}

// Manejar interrupciones
process.on('SIGINT', () => {
  console.log('\n\n⚠️ Proceso interrumpido por el usuario');
  process.exit(0);
});

testAllUsers();
