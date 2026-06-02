/**
 * API para listar todos los usuarios en la base de datos
 * Acceso: GET /api/list-users
 */

import { all } from '../../lib/db-esm.js';

export default async function handler(req, res) {
  try {
    console.log('📋 Listando usuarios...');

    // Obtener todos los usuarios
    const users = await all('SELECT * FROM users ORDER BY id ASC');

    if (!users || users.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No hay usuarios en la base de datos',
        users: [],
        count: 0
      });
    }

    // Formatear usuarios (ocultar contraseñas)
    const formattedUsers = users.map(user => ({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      cedula: user.cedula,
      placa: user.placa,
      supervisor: user.supervisor,
      km_actual: user.km_actual,
      telefono: user.telefono,
      ciudad: user.ciudad,
      empresa: user.empresa,
      active: user.active,
      last_run: user.last_run,
      subscription_status: user.subscription_status,
      subscription_until: user.subscription_until,
      created_at: user.created_at
    }));

    return res.status(200).json({
      success: true,
      message: `${users.length} usuario(s) encontrado(s)`,
      users: formattedUsers,
      count: users.length
    });
  } catch (error) {
    console.error('❌ Error listando usuarios:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
