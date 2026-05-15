const { Pool } = require('pg');

const DATABASE_URL = 'postgres://postgres:6715320Dvd@79.143.187.160:5432/tecnovariedades-db?sslmode=disable';

async function activateRober() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: false
  });

  try {
    console.log('🔌 Conectando a PostgreSQL de producción...\n');
    
    // Buscar a Rober
    const searchResult = await pool.query(`
      SELECT * FROM users 
      WHERE nombre ILIKE '%rober%' 
      OR email ILIKE '%rober%'
    `);
    
    if (searchResult.rows.length === 0) {
      console.log('❌ No se encontró ningún usuario con el nombre Rober.');
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
    
    const rober = searchResult.rows[0];
    console.log(`✅ Usuario encontrado: ${rober.nombre}`);
    console.log(`   Email: ${rober.email}`);
    console.log(`   Cédula: ${rober.cedula}`);
    console.log(`   Placa: ${rober.placa}`);
    console.log(`   Estado actual: ${rober.active === 1 ? 'ACTIVO' : 'INACTIVO'}\n`);
    
    // Fecha muy lejana en el futuro (100 años) = indefinido
    const now = new Date();
    const indefinido = new Date(now.getTime() + (100 * 365 * 24 * 60 * 60 * 1000));
    
    // Actualizar usuario
    await pool.query(
      `UPDATE users SET 
        subscription_status = $1, 
        active = $2, 
        subscription_until = $3 
      WHERE id = $4`,
      ['active', 1, indefinido.toISOString(), rober.id]
    );
    
    console.log('✅ Usuario actualizado exitosamente!\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 DETALLES DE LA ACTIVACIÓN');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Usuario: ${rober.nombre}`);
    console.log(`Email: ${rober.email}`);
    console.log(`Estado: ✅ ACTIVO`);
    console.log(`Suscripción: 💎 INDEFINIDA (Sin expiración)`);
    console.log(`Activado: ${now.toLocaleDateString('es-CO')} ${now.toLocaleTimeString('es-CO')}`);
    console.log(`Expira: ♾️  NUNCA (Acceso permanente)`);
    console.log('═══════════════════════════════════════════════════\n');
    
    console.log('🎉 Rober ahora tiene acceso INDEFINIDO al sistema!');
    console.log('🤖 El preoperacional se ejecutará automáticamente cada día entre 6 AM - 12 PM');
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
  
  process.exit(0);
}

activateRober();
