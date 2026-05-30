/**
 * Health Check Endpoint
 * Usado por EasyPanel para verificar que la aplicación está activa
 */

import { get } from '../../lib/db-esm.js';

export default async function handler(req, res) {
  try {
    // Verificar conexión a base de datos
    const user = await get('SELECT COUNT(*) as count FROM users');
    
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      users: user?.count || 0,
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(503).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
