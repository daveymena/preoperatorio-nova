/**
 * Script para conectarse a la base de datos de producción
 * y verificar cuántos usuarios hay registrados
 */

const { Pool } = require('pg');

const DATABASE_URL = 'postgres://postgres:6715320Dvd@tecnovariedades_posgrespre:5432/tecnovariedades-db?sslmode=disable';

async function checkProductionDB() {
  console.log('═══════════════════════════════════════════════════');
  console.log('🔍 VERIFICANDO BASE DE DATOS DE PRODUCCIÓN');
  console.log('═══════════════════════════════════════════════════\n');
  
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: false
  });

  try {
    console.log('🔌 Conectando a PostgreSQL...');
    
    // Verificar conexión
    const testQuery = await pool.query('SELECT NOW()');
    console.log('✅ Conexión exitosa\n');
    console.log(`⏰ Hora del servidor: ${testQuery.rows[0].now}\n`);
    
    // Verificar si existe la tabla users
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('⚠️ La tabla "users" no existe aún.');
      console.log('💡 Esto es normal si es la primera vez que se inicia la aplicación.');
      console.log('💡 La tabla se creará automáticamente cuando inicies el servidor.\n');
      await pool.end();
      process.exit(0);
    }
    
    console.log('✅ Tabla "users" encontrada\n');
    
    // Contar usuarios
    const countQuery = await pool.query('SELECT COUNT(*) as total FROM users');
    const total = parseInt(countQuery.rows[0].total);
    
    console.log('───────────────────────────────────────────────────');
    console.log(`📊 TOTAL DE USUARIOS: ${total}`);
    console.log('───────────────────────────────────────────────────\n');
    
    if (total === 0) {
      console.log('⚠️ No hay usuarios registrados en la base de datos.');
      console.log('💡 Posibles razones:');
      console.log('   1. Es una base de datos nueva');
      console.log('   2. Los usuarios se perdieron en una migración');
      console.log('   3. Nadie se ha registrado aún\n');
    } else {
      // Obtener todos los usuarios
      const usersQuery = await pool.query(`
        SELECT id, nombre, cedula, placa, email, active, 
               subscription_status, last_run, created_at
        FROM users 
        ORDER BY id
      `);
      
      console.log('👥 USUARIOS REGISTRADOS:\n');
      
      usersQuery.rows.forEach((user, index) => {
        const status = user.active === 1 ? '✅ ACTIVO' : '❌ INACTIVO';
        const subStatus = user.subscription_status || 'N/A';
        
        console.log(`${index + 1}. ${user.nombre}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Cédula: ${user.cedula}`);
        console.log(`   Placa: ${user.placa}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Estado: ${status}`);
        console.log(`   Suscripción: ${subStatus}`);
        console.log(`   Última ejecución: ${user.last_run || 'Nunca'}`);
        console.log(`   Registrado: ${user.created_at}`);
        console.log('   ───────────────────────────────────────────────\n');
      });
      
      const activos = usersQuery.rows.filter(u => u.active === 1).length;
      const inactivos = usersQuery.rows.filter(u => u.active === 0 || !u.active).length;
      
      console.log('📈 RESUMEN:');
      console.log(`   Total: ${total}`);
      console.log(`   Activos: ${activos}`);
      console.log(`   Inactivos: ${inactivos}`);
    }
    
    await pool.end();
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Posibles soluciones:');
    console.error('   1. Verifica que la base de datos esté corriendo');
    console.error('   2. Verifica las credenciales de conexión');
    console.error('   3. Verifica que el host sea accesible desde aquí');
    await pool.end();
    process.exit(1);
  }
}

checkProductionDB();
