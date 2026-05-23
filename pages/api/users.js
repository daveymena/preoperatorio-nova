// API route: GET /api/users — devuelve todos los usuarios (solo server-side)
import { all } from '../../lib/db-esm.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const users = await all(`SELECT * FROM users ORDER BY created_at DESC`);
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching users' });
  }
}
