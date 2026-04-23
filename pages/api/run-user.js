const { get } = require('../../lib/db');
const { processUser } = require('../../worker');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'Missing user ID' });
  }

  try {
    const user = await get(`SELECT * FROM users WHERE id = ?`, [id]);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ejecutar en segundo plano para no bloquear la respuesta HTTP
    // pero aquí lo esperaremos para dar feedback inmediato en el dashboard
    await processUser(user);

    res.status(200).json({ message: 'Proceso finalizado para ' + user.nombre });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error procesando usuario: ' + error.message });
  }
}
