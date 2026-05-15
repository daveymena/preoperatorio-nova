const { Pool } = require('pg');
const { processUser } = require('./worker');

const DATABASE_URL = 'postgres://postgres:6715320Dvd@79.143.187.160:5432/tecnovariedades-db?sslmode=disable';

async function runRober() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: false
  });

  try {
    console.log('🔍 Buscando a Rober...\n');
    
    const result = await pool.query(`
      SELECT * FROM users 
      WHERE nombre ILIKE '%rober%' 
      OR email ILIKE '%rober%'
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      console.error('❌ Usuario no encontrado');
      await pool.end();
      process.exit(1);
    }

    const user = result.rows[0];
    console.log(`✅ Usuario encontrado: ${user.nombre}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🚗 Placa: ${user.placa}\n`);
    console.log('🚀 Iniciando proceso de preoperacional...\n');

    await processUser(user);

    console.log('\n✅ Proceso completado exitosamente');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error procesando usuario:', error.message);
    console.error(error);
    await pool.end();
  }
  
  process.exit(0);
}

runRober();
