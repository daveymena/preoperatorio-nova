/**
 * API de Pagos - Métodos de pago disponibles
 * Soporta: Transferencia, MercadoPago, PayPal
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const paymentMethods = {
      transfer: {
        name: 'Transferencia Bancaria',
        description: 'Transferencia directa a cuenta bancaria',
        icon: 'bank',
        enabled: !!process.env.TRANSFER_NUMBER,
        details: {
          accountNumber: process.env.TRANSFER_NUMBER,
          accountName: process.env.TRANSFER_NAME,
          bank: 'Banco Colombiano'
        }
      },
      mercadopago: {
        name: 'MercadoPago',
        description: 'Pago con tarjeta de crédito/débito',
        icon: 'credit-card',
        enabled: !!process.env.MERCADO_PAGO_PUBLIC_KEY,
        publicKey: process.env.MERCADO_PAGO_PUBLIC_KEY
      },
      paypal: {
        name: 'PayPal',
        description: 'Pago seguro con PayPal',
        icon: 'paypal',
        enabled: !!process.env.PAYPAL_CLIENT_ID,
        clientId: process.env.PAYPAL_CLIENT_ID
      }
    };

    // Filtrar solo métodos habilitados
    const enabledMethods = Object.entries(paymentMethods)
      .filter(([_, method]) => method.enabled)
      .reduce((acc, [key, method]) => {
        acc[key] = method;
        return acc;
      }, {});

    return res.status(200).json({
      success: true,
      methods: enabledMethods,
      count: Object.keys(enabledMethods).length
    });
  } catch (error) {
    console.error('Error en pagos:', error);
    return res.status(500).json({ error: error.message });
  }
}
