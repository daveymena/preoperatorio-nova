const { run } = require('./lib/db');
const fs = require('fs');

async function importUsers() {
  try {
    const filename = process.argv[2];
    
    if (!filename) {
      console.log('❌ Uso: node import-users.js <archivo.json>');
      console.log('Ejemplo: node import-users.js users-backup-1234567890.json');
      process.exit(1);
    }
    
    if (!fs.existsSync(filename)) {
      console.log(`❌ Archivo no encontrado: ${filename}`);
      process.exit(1);
    }
    
    console.log('📥 Importando usuarios...\n');
    
    const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
    const users = data.users || data;
    
    if (!Array.isArray(users) || users.length === 0) {
      console.log('⚠️ No hay usuarios en el archivo.');
      process.exit(0);
    }
    
    console.log(`📊 Usuarios a importar: ${users.length}\n`);
    
    let imported = 0;
    let skipped = 0;
    
    for (const user of users) {
      try {
        await run(
          `INSERT INTO users (
            cedula, nombre, placa, email, password, supervisor,
            km_actual, vacaciones_inicio, vacaciones_fin, active,
            last_run, trial_start, subscription_status, subscription_until, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            user.cedula,
            user.nombre,
            user.placa,
            user.email,
            user.password,
            user.supervisor,
            user.km_actual || 0,
            user.vacaciones_inicio,
            user.vacaciones_fin,
            user.active !== undefined ? user.active : 1,
            user.last_run,
            user.trial_start,
            user.subscription_status || 'trial',
            user.subscription_until,
            user.created_at
          ]
        );
        console.log(`✅ ${user.nombre} (${user.email})`);
        imported++;
      } catch (error) {
        if (error.message.includes('UNIQUE') || error.message.includes('duplicate')) {
          console.log(`⏭️  ${user.nombre} - Ya existe (saltado)`);
          skipped++;
        } else {
          console.log(`❌ ${user.nombre} - Error: ${error.message}`);
        }
      }
    }
    
    console.log(`\n📊 RESUMEN:`);
    console.log(`   Importados: ${imported}`);
    console.log(`   Saltados: ${skipped}`);
    console.log(`   Total: ${users.length}`);
    
  } catch (error) {
    console.error('❌ Error importando:', error);
  }
  
  process.exit(0);
}

importUsers();
