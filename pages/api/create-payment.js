// POST /api/create-payment
// Genera un link de pago de MercadoPago para la suscripción mensual

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { userId, userName, userEmail } = req.body;
  if (!userId) return res.status(400).json({ message: 'Missing userId' });

  try {
    const { MercadoPagoConfig, Preference } = require('mercadopago');

    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
    });

    const preference = new Preference(client);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const result = await preference.create({
      body: {
        items: [
          {
            id: `nova360-mensualidad-${userId}`,
            title: 'Nova 360 Automation — Mensualidad',
            description: 'Automatización diaria de preoperacional moto. 1 mes.',
            quantity: 1,
            unit_price: 10000,
            currency_id: 'COP',
          },
        ],
        payer: {
          name: userName || 'Usuario Nova 360',
          email: userEmail || '',
        },
        back_urls: {
          success: `${baseUrl}/pago-exitoso?user=${userId}`,
          failure: `${baseUrl}/pago-fallido`,
          pending: `${baseUrl}/pago-pendiente`,
        },
        auto_return: 'approved',
        notification_url: `${baseUrl}/api/mp-webhook`,
        external_reference: String(userId),
        statement_descriptor: 'NOVA360 AUTOMATIZACION',
      },
    });

    res.status(200).json({
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
      preference_id: result.id,
    });
  } catch (error) {
    console.error('Error MercadoPago:', error);
    res.status(500).json({ message: 'Error al crear el pago: ' + error.message });
  }
}
