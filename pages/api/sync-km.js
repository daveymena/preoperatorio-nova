const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { get, run } = require('../../lib/db');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cedula, km_actual, last_run } = req.body;

    if (!cedula) {
      return res.status(400).json({ error: 'cedula es requerido' });
    }

    const user = await get('SELECT * FROM users WHERE cedula = ?', [cedula]);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const updates = [];
    const params = [];

    if (km_actual !== undefined) {
      updates.push('km_actual = ?');
      params.push(km_actual);
    }
    if (last_run) {
      updates.push('last_run = ?');
      params.push(last_run);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    params.push(cedula);
    await run('UPDATE users SET ' + updates.join(', ') + ' WHERE cedula = ?', params);

    console.log('[SYNN] Actualizado ' + user.nombre + ': ' + updates.join(', '));

    res.json({ success: true, message: user.nombre + ' actualizado en produccion' });
  } catch (error) {
    console.error('[SYNN] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
}
