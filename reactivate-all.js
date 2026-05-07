const { all, run } = require('./lib/db');

async function reactivateAll() {
  try {
    console.log('🔄 Reactivando todos los usuarios por 5 días más...\n');
    
    const users = await all(`SELECT * FROM users`);
    
    if (users.length === 0) {
      console.log('⚠️ No hay usuarios registrados.');
      process.exit(0);
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
    
    console.log(`\n🎉 ${users.length} usuarios reactivados exitosamente por 5 días.`);
    console.log(`📅 Fecha de expiración: ${fiveDaysLater.toLocaleDateString('es-CO')} ${fiveDaysLater.toLocaleTimeString('es-CO')}`);
    
  } catch (error) {
    console.error('❌ Error reactivando usuarios:', error);
  }
  
  process.exit(0);
}

reactivateAll();
