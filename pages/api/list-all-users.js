/**
 * API para listar TODOS los usuarios (activos e inactivos)
 * Funciona con PostgreSQL en EasyPanel y SQLite local
 */

import { all } from '../../lib/db-esm.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    console.log('📊 Listando todos los usuarios...');
    
    // Obtener TODOS los usuarios (activos e inactivos)
    const users = await all(`
      SELECT 
        id, nombre, cedula, placa, email, active, 
        subscription_status, subscription_until, 
        supervisor, km_actual, last_run, created_at
      FROM users 
      ORDER BY id
    `);

    console.log(`✅ Encontrados ${users.length} usuarios`);

    // Contar activos e inactivos
    const activeCount = users.filter(u => u.active === 1).length;
    const inactiveCount = users.length - activeCount;

    // Detectar tipo de base de datos
    const dbType = process.env.DATABASE_URL?.startsWith('postgres') ? 'PostgreSQL' : 'SQLite';

    return res.status(200).json({
      success: true,
      database: dbType,
      total: users.length,
      active: activeCount,
      inactive: inactiveCount,
      users: users.map(u => ({
        id: u.id,
        nombre: u.nombre,
        cedula: u.cedula,
        placa: u.placa,
        email: u.email,
        active: u.active === 1,
        subscription_status: u.subscription_status || 'N/A',
        subscription_until: u.subscription_until ? new Date(u.subscription_until).toISOString() : null,
        supervisor: u.supervisor || 'N/A',
        km_actual: u.km_actual || 0,
        last_run: u.last_run ? new Date(u.last_run).toISOString() : null,
        created_at: u.created_at ? new Date(u.created_at).toISOString() : null
      }))
    });

  } catch (error) {
    console.error('❌ Error listando usuarios:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al listar usuarios',
      error: error.message
    });
  }
}
