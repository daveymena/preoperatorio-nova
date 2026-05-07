const { all } = require('../../lib/db');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const users = await all(`SELECT * FROM users ORDER BY id`);
    
    const usersInfo = users.map(user => ({
      id: user.id,
      nombre: user.nombre,
      cedula: user.cedula,
      placa: user.placa,
      email: user.email,
      active: user.active,
      subscription_status: user.subscription_status,
      subscription_until: user.subscription_until,
      last_run: user.last_run,
      created_at: user.created_at,
      km_actual: user.km_actual,
      supervisor: user.supervisor
    }));

    const activos = users.filter(u => u.active === 1).length;
    const inactivos = users.filter(u => u.active === 0).length;

    res.status(200).json({
      success: true,
      total: users.length,
      activos,
      inactivos,
      users: usersInfo
    });
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al listar usuarios: ' + error.message 
    });
  }
}
