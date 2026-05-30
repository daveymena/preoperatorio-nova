/**
 * API para procesar pagos
 * Soporta MercadoPago, PayPal y Transferencia
 */

import { get, run } from '../../lib/db-esm.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { userId, method, amount, description } = req.body;

    if (!userId || !method || !amount) {
      return res.status(400).json({ error: 'Parámetros faltantes' });
    }

    // Obtener usuario
    const user = await get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    let paymentResult = {};

    // Procesar según método de pago
    switch (method) {
      case 'transfer':
        paymentResult = await processTransfer(user, amount, description);
        break;

      case 'mercadopago':
        paymentResult = await processMercadoPago(user, amount, description);
        break;

      case 'paypal':
        paymentResult = await processPayPal(user, amount, description);
        break;

      default:
        return res.status(400).json({ error: 'Método de pago no válido' });
    }

    // Guardar transacción en BD
    if (paymentResult.success) {
      await run(
        `INSERT INTO payments (user_id, method, amount, status, transaction_id, created_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, method, amount, 'completed', paymentResult.transactionId, new Date().toISOString()]
      );

      // Activar usuario por 3 días
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 3);

      await run(
        `UPDATE users SET active = 1, subscription_until = ? WHERE id = ?`,
        [expiryDate.toISOString(), userId]
      );

      return res.status(200).json({
        success: true,
        message: 'Pago procesado exitosamente',
        transactionId: paymentResult.transactionId,
        expiryDate: expiryDate.toISOString(),
        daysActive: 3
      });
    } else {
      return res.status(400).json({
        success: false,
        error: paymentResult.error
      });
    }
  } catch (error) {
    console.error('Error procesando pago:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Procesar transferencia bancaria
 */
async function processTransfer(user, amount, description) {
  try {
    const transactionId = `TRANSFER-${Date.now()}`;

    return {
      success: true,
      transactionId: transactionId,
      method: 'transfer',
      accountNumber: process.env.TRANSFER_NUMBER,
      accountName: process.env.TRANSFER_NAME,
      amount: amount,
      description: description || 'Pago de suscripción'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Procesar pago con MercadoPago
 */
async function processMercadoPago(user, amount, description) {
  try {
    const { MercadoPagoConfig, Payment } = require('mercadopago');

    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
    });

    const payment = new Payment(client);

    const paymentData = {
      transaction_amount: amount,
      description: description || 'Pago de suscripción',
      payment_method_id: 'visa', // Será reemplazado por el token del cliente
      payer: {
        email: user.email,
        first_name: user.nombre.split(' ')[0],
        last_name: user.nombre.split(' ')[1] || ''
      }
    };

    const result = await payment.create({ body: paymentData });

    if (result.status === 'approved') {
      return {
        success: true,
        transactionId: result.id,
        method: 'mercadopago',
        status: result.status
      };
    } else {
      return {
        success: false,
        error: `Pago rechazado: ${result.status}`
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Procesar pago con PayPal
 */
async function processPayPal(user, amount, description) {
  try {
    const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

    const environment = new checkoutNodeJssdk.LiveEnvironment(
      process.env.PAYPAL_CLIENT_ID,
      process.env.PAYPAL_CLIENT_SECRET
    );

    const client = new checkoutNodeJssdk.PayPalHttpClient(environment);

    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: (amount / 4000).toFixed(2) // Convertir COP a USD aproximadamente
          },
          description: description || 'Pago de suscripción'
        }
      ],
      payer: {
        email_address: user.email,
        name: {
          given_name: user.nombre.split(' ')[0],
          surname: user.nombre.split(' ')[1] || ''
        }
      }
    });

    const response = await client.execute(request);

    if (response.result.status === 'CREATED') {
      return {
        success: true,
        transactionId: response.result.id,
        method: 'paypal',
        status: response.result.status,
        approvalUrl: response.result.links.find(link => link.rel === 'approve').href
      };
    } else {
      return {
        success: false,
        error: `Error en PayPal: ${response.result.status}`
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
