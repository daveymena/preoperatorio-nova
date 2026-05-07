const {all} = require('./lib/db');

async function listAllUsers() {
  try {
    const users = await all(`SELECT * FROM users ORDER BY id`);
    console.log(`\n📊 Total de usuarios en la base de datos: ${users.length}\n`);
    
    if (users.length === 0) {
      console.log('⚠️ No hay usuarios registrados.');
      process.exit(0);
    }
    
    console.log('═══════════════════════════════════════════════════════════════');
    users.forEach((user, index) => {
      const status = user.active === 1 ? '✅ ACTIVO' : '❌ INACTIVO';
      const subStatus = user.subscription_status || 'N/A';
      
      console.log(`\n${index + 1}. ${user.nombre}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Cédula: ${user.cedula}`);
      console.log(`   Placa: ${user.placa}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Estado: ${status}`);
      console.log(`   Suscripción: ${subStatus}`);
      console.log(`   Supervisor: ${user.supervisor || 'N/A'}`);
      console.log(`   KM Actual: ${user.km_actual || 0}`);
      console.log(`   Última ejecución: ${user.last_run || 'Nunca'}`);
      console.log(`   Fecha registro: ${user.created_at || 'N/A'}`);
      console.log(`   Suscripción hasta: ${user.subscription_until || 'N/A'}`);
      console.log('───────────────────────────────────────────────────────────────');
    });
    
    const activos = users.filter(u => u.active === 1).length;
    const inactivos = users.filter(u => u.active === 0).length;
    
    console.log(`\n📈 RESUMEN:`);
    console.log(`   Total: ${users.length}`);
    console.log(`   Activos: ${activos}`);
    console.log(`   Inactivos: ${inactivos}`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
  process.exit(0);
}

listAllUsers();
