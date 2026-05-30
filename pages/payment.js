/**
 * Página de Pagos - Métodos de pago disponibles
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PaymentPage() {
  const router = useRouter();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [amount] = useState(29900); // 3 días = $29,900 COP

  useEffect(() => {
    // Obtener ID del usuario de la URL o sesión
    const id = router.query.userId || localStorage.getItem('userId');
    setUserId(id);

    // Cargar métodos de pago
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payments');
      const data = await response.json();
      setMethods(Object.entries(data.methods || {}));
      setLoading(false);
    } catch (error) {
      console.error('Error cargando métodos:', error);
      setLoading(false);
    }
  };

  const handlePayment = async (method) => {
    if (!userId) {
      alert('Usuario no identificado');
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch('/api/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(userId),
          method: method,
          amount: amount,
          description: 'Suscripción 3 días'
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Pago procesado exitosamente!\nTransacción: ${data.transactionId}\nActivo por: ${data.daysActive} días`);
        router.push('/dashboard');
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error procesando pago:', error);
      alert('Error procesando pago');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Cargando métodos de pago...</h2>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>💳 Métodos de Pago</h1>
      <p>Selecciona un método para activar tu suscripción por 3 días</p>

      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <strong>Monto a pagar:</strong> ${amount.toLocaleString('es-CO')} COP
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        {methods.map(([key, method]) => (
          <div
            key={key}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <h3>{method.name}</h3>
            <p style={{ color: '#666', marginBottom: '15px' }}>{method.description}</p>

            {key === 'transfer' && method.details && (
              <div style={{ marginBottom: '15px', textAlign: 'left', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '5px' }}>
                <p><strong>Cuenta:</strong> {method.details.accountNumber}</p>
                <p><strong>Titular:</strong> {method.details.accountName}</p>
                <p><strong>Banco:</strong> {method.details.bank}</p>
              </div>
            )}

            <button
              onClick={() => handlePayment(key)}
              disabled={processing}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: processing ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                opacity: processing ? 0.6 : 1
              }}
            >
              {processing ? 'Procesando...' : `Pagar con ${method.name}`}
            </button>
          </div>
        ))}
      </div>

      {methods.length === 0 && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          <p>No hay métodos de pago disponibles en este momento</p>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e8f4f8', borderRadius: '5px' }}>
        <h4>ℹ️ Información importante</h4>
        <ul>
          <li>Tu suscripción se activará automáticamente por 3 días</li>
          <li>Recibirás un email de confirmación</li>
          <li>Puedes cancelar en cualquier momento desde tu dashboard</li>
        </ul>
      </div>
    </div>
  );
}
