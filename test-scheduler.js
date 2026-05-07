/**
 * Script de prueba para verificar el scheduler
 * Simula el comportamiento del scheduler sin esperar horas
 */

const { get } = require('./lib/db');

async function testSchedulerLogic() {
  console.log('🧪 Probando lógica del scheduler...\n');
  
  // Simular verificación de última ejecución
  console.log('1️⃣ Verificando última ejecución en la base de datos...');
  try {
    const result = await get(`SELECT last_run FROM users WHERE last_run IS NOT NULL ORDER BY last_run DESC LIMIT 1`);
    
    if (result && result.last_run) {
      const lastRunDate = new Date(result.last_run);
      const today = new Date();
      
      console.log(`   📅 Última ejecución: ${lastRunDate.toLocaleString('es-CO')}`);
      console.log(`   📅 Fecha actual: ${today.toLocaleString('es-CO')}`);
      
      const lastRunDay = lastRunDate.toISOString().split('T')[0];
      const todayDay = today.toISOString().split('T')[0];
      
      if (lastRunDay === todayDay) {
        console.log('   ✅ Ya se ejecutó hoy - El scheduler NO ejecutaría de nuevo');
      } else {
        console.log('   ⏰ No se ha ejecutado hoy - El scheduler EJECUTARÍA');
      }
    } else {
      console.log('   ⚠️ No hay ejecuciones previas - El scheduler EJECUTARÍA');
    }
  } catch (e) {
    console.error('   ❌ Error:', e.message);
  }
  
  console.log('\n2️⃣ Ventana de ejecución configurada:');
  const hoursToTry = [6, 7, 8, 9, 10, 11, 12];
  console.log(`   ⏰ Horas: ${hoursToTry.join(', ')} (hora de Colombia)`);
  console.log(`   🔄 Total de intentos por día: ${hoursToTry.length}`);
  
  console.log('\n3️⃣ Comportamiento esperado:');
  console.log('   - A las 6:00 AM: Primer intento');
  console.log('   - Si falla: Reintenta a las 7:00 AM');
  console.log('   - Si falla: Reintenta a las 8:00 AM');
  console.log('   - ... y así hasta las 12:00 PM');
  console.log('   - Si tiene éxito: No vuelve a ejecutar ese día');
  console.log('   - A medianoche: Reset para el día siguiente');
  
  console.log('\n4️⃣ Hora actual del sistema:');
  const now = new Date();
  const colombiaTime = now.toLocaleString('es-CO', { timeZone: 'America/Bogota' });
  const hour = parseInt(colombiaTime.split(',')[1].trim().split(':')[0]);
  
  console.log(`   🕐 Hora en Colombia: ${colombiaTime}`);
  
  if (hour >= 6 && hour <= 12) {
    console.log(`   ✅ Dentro de la ventana de ejecución (${hour}:00)`);
  } else if (hour < 6) {
    console.log(`   ⏰ Antes de la ventana (faltan ${6 - hour} horas)`);
  } else {
    console.log(`   🌙 Fuera de la ventana (próximo intento mañana a las 6 AM)`);
  }
  
  console.log('\n✅ Prueba completada\n');
  process.exit(0);
}

testSchedulerLogic();
