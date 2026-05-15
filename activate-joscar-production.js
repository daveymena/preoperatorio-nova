const { Pool } = require('pg');

const DATABASE_URL = 'postgres://postgres:6715320Dvd@79.143.187.160:5432/tecnovariedades-db?sslmode=disable';

async function activateJoscar() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: false
  });

  try {
    console.log('🔌 Conectando a PostgreSQL de producción...\n');
    
    // Buscar a Joscar
    const searchResult = await pool.query(`
      SELECT * FROM users 
      WHERE nombre ILIKE '%joscar%' 
      OR email ILIKE '%joscar%'
    `);
    
    if (searchResult.rows.length === 0) {
      console.log('❌ No se encontró ningún usuario con el nombre Joscar.');
      console.log('💡 Listando todos los usuarios:\n');
      
      const allUsers = await pool.query(`SELECT id, nombre, email, cedula, placa, active FROM users ORDER BY id`);
      
      if (allUsers.rows.length === 0) {
        console.log('⚠️ No hay usuarios registrados en la base de datos.');
      } else {
        allUsers.rows.forEach((u, i) => {
          const status = u.active === 1 ? '✅' : '❌';
          console.log(`${i + 1}. ${status} ${u.nombre} (${u.email})`);
          console.log(`   Cédula: ${u.cedula} | Placa: ${u.placa}`);
          console.log('   ───────────────────────────────────────');
        });
      }
      
      await pool.end();
      process.exit(1);
    }
    
    const joscar = searchResult.rows[0];
    console.log(`✅ Usuario encontrado: ${joscar.nombre}`);
    console.log(`   Email: ${joscar.email}`);
    console.log(`   Cédula: ${joscar.cedula}`);
    console.log(`   Placa: ${joscar.placa}`);
    console.log(`   Estado actual: ${joscar.active === 1 ? 'ACTIVO' : 'INACTIVO'}\n`);
    
    // Calcular fecha de expiración (30 días desde ahora)
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    // Actualizar usuario
    await pool.query(
      `UPDATE users SET 
        subscription_status = $1, 
        active = $2, 
        subscription_until = $3 
      WHERE id = $4`,
      ['active', 1, thirtyDaysLater.toISOString(), joscar.id]
    );
    
    console.log('✅ Usuario actualizado exitosamente!\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 DETALLES DE LA ACTIVACIÓN');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Usuario: ${joscar.nombre}`);
    console.log(`Email: ${joscar.email}`);
    console.log(`Estado: ✅ ACTIVO`);
    console.log(`Suscripción: 💎 PAGADA (30 días)`);
    console.log(`Activado: ${now.toLocaleDateString('es-CO')} ${now.toLocaleTimeString('es-CO')}`);
    console.log(`Expira: ${thirtyDaysLater.toLocaleDateString('es-CO')} ${thirtyDaysLater.toLocaleTimeString('es-CO')}`);
    console.log(`Días restantes: 30 días`);
    console.log('═══════════════════════════════════════════════════\n');
    
    console.log('🎉 Joscar ahora tiene acceso completo al sistema por 30 días!');
    console.log('🤖 El preoperacional se ejecutará automáticamente cada día entre 6 AM - 12 PM');
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
  
  process.exit(0);
}

activateJoscar();
