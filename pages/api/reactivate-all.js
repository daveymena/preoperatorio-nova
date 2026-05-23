import { all, run } from '../../lib/db-esm.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const users = await all(`SELECT * FROM users`);
    
    if (users.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No hay usuarios registrados',
        reactivated: 0
      });
    }
    
    const now = new Date();
    const fiveDaysLater = new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000));
    
    let reactivated = 0;
    const results = [];
    
    for (const user of users) {
      await run(
        `UPDATE users SET 
          subscription_status = 'active', 
          active = 1, 
          subscription_until = ? 
        WHERE id = ?`,
        [fiveDaysLater.toISOString(), user.id]
      );
      
      reactivated++;
      results.push({
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        reactivado_hasta: fiveDaysLater.toISOString()
      });
    }
    
    res.status(200).json({
      success: true,
      message: `${reactivated} usuarios reactivados por 5 días`,
      reactivated,
      expiration_date: fiveDaysLater.toISOString(),
      users: results
    });
    
  } catch (error) {
    console.error('Error reactivando usuarios:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al reactivar usuarios: ' + error.message 
    });
  }
}
