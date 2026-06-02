const { get } = require('./lib/db');
const { processUserImproved } = require('./lib/process-user-improved');

async function runDavey() {
  try {
    console.log('🔍 Buscando usuario...');
    const user = await get(`SELECT * FROM users WHERE id = ?`, [2]);
    
    if (!user) {
      console.error('❌ Usuario no encontrado');
      process.exit(1);
    }

    console.log(`✅ Usuario encontrado: ${user.nombre}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🚗 Placa: ${user.placa}`);
    console.log('\n🚀 Iniciando proceso de preoperacional con versión MEJORADA...\n');

    await processUserImproved(user);

    console.log('\n✅ Proceso completado exitosamente');
  } catch (error) {
    console.error('❌ Error procesando usuario:', error.message);
    console.error(error);
  }
  process.exit(0);
}

runDavey();
