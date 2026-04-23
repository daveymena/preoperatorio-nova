// API route: GET /api/users — devuelve todos los usuarios (solo server-side)
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  // Importar db solo en server-side (evita el error de 'fs' en el cliente)
  const { all } = require('../../lib/db');
  
  try {
    const users = await all(`SELECT * FROM users ORDER BY created_at DESC`);
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
}
