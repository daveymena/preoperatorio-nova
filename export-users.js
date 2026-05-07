const { all } = require('./lib/db');
const fs = require('fs');

async function exportUsers() {
  try {
    console.log('📤 Exportando usuarios...\n');
    
    const users = await all(`SELECT * FROM users ORDER BY id`);
    
    if (users.length === 0) {
      console.log('⚠️ No hay usuarios para exportar.');
      process.exit(0);
    }
    
    const exportData = {
      exported_at: new Date().toISOString(),
      total_users: users.length,
      users: users
    };
    
    const filename = `users-backup-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
    
    console.log(`✅ ${users.length} usuarios exportados a: ${filename}\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.nombre} (${user.email})`);
    });
    
    console.log(`\n📁 Archivo guardado: ${filename}`);
    console.log('💡 Usa este archivo para importar usuarios después de migrar a PostgreSQL');
    
  } catch (error) {
    console.error('❌ Error exportando:', error);
  }
  
  process.exit(0);
}

exportUsers();
