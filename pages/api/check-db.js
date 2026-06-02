/**
 * API para verificar conexión a base de datos
 * Retorna información sobre la BD conectada
 */

import { all, get } from '../../lib/db-esm.js';

export default async function handler(req, res) {
  try {
    const dbInfo = {
      type: process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite',
      url: process.env.DATABASE_URL ? 'Configurada ✅' : 'No configurada',
      connected: false,
      tables: [],
      userCount: 0,
      error: null
    };

    // Probar conexión
    try {
      // Contar usuarios
      const result = await get('SELECT COUNT(*) as count FROM users');
      dbInfo.userCount = result?.count || 0;
      dbInfo.connected = true;

      // Listar tablas (solo en PostgreSQL)
      if (process.env.DATABASE_URL) {
        try {
          const tables = await all(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
          `);
          dbInfo.tables = tables.map(t => t.table_name);
        } catch (e) {
          // Si falla, al menos sabemos que está conectado
          dbInfo.tables = ['users', 'payments'];
        }
      } else {
        dbInfo.tables = ['users', 'payments'];
      }

      // Obtener información del primer usuario
      const firstUser = await get('SELECT id, nombre, email, cedula, active FROM users ORDER BY id ASC LIMIT 1');
      if (firstUser) {
        dbInfo.sampleUser = {
          id: firstUser.id,
          nombre: firstUser.nombre,
          email: firstUser.email,
          cedula: firstUser.cedula,
          active: firstUser.active
        };
      }

    } catch (error) {
      dbInfo.connected = false;
      dbInfo.error = error.message;
    }

    return res.status(200).json({
      success: dbInfo.connected,
      database: dbInfo,
      message: dbInfo.connected 
        ? `✅ Conectado a ${dbInfo.type} - ${dbInfo.userCount} usuario(s)` 
        : `❌ Error de conexión: ${dbInfo.error}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error verificando BD:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}
