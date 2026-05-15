const { all, run } = require('./lib/db');

async function activateJoscar() {
  try {
    console.log('🔍 Buscando a Joscar...\n');
    
    // Buscar a Joscar
    const users = await all(`SELECT * FROM users WHERE nombre LIKE '%joscar%' OR nombre LIKE '%Joscar%' OR nombre LIKE '%JOSCAR%'`);
    
    if (users.length === 0) {
      console.log('❌ No se encontró ningún usuario con el nombre Joscar.');
      console.log('💡 Listando todos los usuarios para que elijas:\n');
      
      const allUsers = await all(`SELECT id, nombre, email, cedula FROM users`);
      allUsers.forEach((u, i) => {
        console.log(`${i + 1}. ${u.nombre} (${u.email}) - Cédula: ${u.cedula}`);
      });
      
      process.exit(1);
    }
    
    const joscar = users[0];
    console.log(`✅ Usuario encontrado: ${joscar.nombre}`);
    console.log(`   Email: ${joscar.email}`);
    console.log(`   Cédula: ${joscar.cedula}`);
    console.log(`   Placa: ${joscar.placa}\n`);
    
    // Calcular fecha de expiración (30 días desde ahora)
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    // Actualizar usuario
    await run(
      `UPDATE users SET 
        subscription_status = 'active', 
        active = 1, 
        subscription_until = ? 
      WHERE id = ?`,
      [thirtyDaysLater.toISOString(), joscar.id]
    );
    
    console.log('✅ Usuario actualizado exitosamente!\n');
    console.log('📊 Detalles de la activación:');
    console.log(`   Estado: ACTIVO`);
    console.log(`   Suscripción: PAGADA (30 días)`);
    console.log(`   Fecha de activación: ${now.toLocaleDateString('es-CO')} ${now.toLocaleTimeString('es-CO')}`);
    console.log(`   Fecha de expiración: ${thirtyDaysLater.toLocaleDateString('es-CO')} ${thirtyDaysLater.toLocaleTimeString('es-CO')}`);
    console.log(`   Días restantes: 30 días\n`);
    
    console.log('🎉 Joscar ahora tiene acceso completo al sistema por 30 días!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

activateJoscar();
