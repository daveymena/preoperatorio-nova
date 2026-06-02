/**
 * Script para listar usuarios en PostgreSQL (Base de datos de producción)
 */

const { Client } = require('pg');

// Configuración de conexión para PostgreSQL de producción
const connectionString = 'postgres://davey:6715320@tecnology_preope-db:5432/preoperacional?sslmode=disable';

async function listPostgresUsers() {
  const client = new Client({
    connectionString: connectionString
  });

  try {
    console.log('🔄 Conectando a PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado a PostgreSQL\n');

    // Listar todos los usuarios
    const result = await client.query('SELECT id, nombre, cedula, placa, email, active, subscription_status, subscription_until FROM users ORDER BY id');
    
    console.log('📊 USUARIOS EN POSTGRESQL (EasyPanel):');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    if (result.rows.length === 0) {
      console.log('⚠️ No hay usuarios registrados en PostgreSQL');
    } else {
      console.log(`Total de usuarios: ${result.rows.length}\n`);
      result.rows.forEach((user, index) => {
        console.log(`${index + 1}. ${user.nombre}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Cédula: ${user.cedula}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Placa: ${user.placa}`);
        console.log(`   Activo: ${user.active === 1 ? '✅ Sí' : '❌ No'}`);
        console.log(`   Estado: ${user.subscription_status || 'N/A'}`);
        console.log(`   Vence: ${user.subscription_until ? new Date(user.subscription_until).toLocaleDateString('es-CO') : 'N/A'}`);
        console.log('');
      });
    }

    console.log('═══════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error.message);
    console.error('');
    console.error('💡 POSIBLES CAUSAS:');
    console.error('   1. El host "tecnology_preope-db" no es accesible desde aquí (solo funciona en EasyPanel)');
    console.error('   2. La base de datos no existe o no tiene la tabla users');
    console.error('   3. Las credenciales son incorrectas');
    console.error('');
    console.error('🔧 SOLUCIÓN:');
    console.error('   Este script debe ejecutarse DENTRO de EasyPanel, no localmente.');
    console.error('   Para verificar localmente, usa el script list-users.js con SQLite.');
  } finally {
    await client.end();
  }
}

listPostgresUsers();
