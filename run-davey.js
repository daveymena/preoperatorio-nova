const { get, run } = require('./lib/db');
const { processUserImproved } = require('./lib/process-user-improved');

async function runDavey() {
  try {
    console.log('🔍 Buscando usuario...');
    const user = await get(
      `SELECT * FROM users WHERE email = ? OR cedula = ? LIMIT 1`,
      ['daveymena16@gmail.com', '1077449318']
    );
    
    if (!user) {
      console.error('❌ Usuario no encontrado');
      process.exit(1);
    }

    console.log(`✅ Usuario encontrado: ${user.nombre}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🚗 Placa: ${user.placa}`);

    if (user.active !== 1) {
      console.log('⚠️ Usuario inactivo. Activando antes de ejecutar...');
      await run(
        `UPDATE users SET subscription_status = 'active', active = 1, subscription_until = ? WHERE id = ?`,
        [new Date('2099-12-31').toISOString(), user.id]
      );
      user.active = 1;
      user.subscription_status = 'active';
    }

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
