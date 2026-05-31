import Head from 'next/head';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const MONTHLY_PRICE = 10000;

export default function Dashboard() {
  const [form, setForm] = useState({ cedula: '', email: '', password: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [sub, setSub] = useState(null);
  const [subLoading, setSubLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  useEffect(() => {
    const saved = localStorage.getItem('nova_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setForm({ cedula: u.cedula || '', email: u.email || '', password: '' });
        checkSub(u.cedula, u.email);
      } catch {}
    }
  }, []);

  const checkSub = async (cedula, email) => {
    setSubLoading(true);
    try {
      const res = await fetch('/api/check-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula, email }),
      });
      const data = await res.json();
      if (data.found) {
        setSub(data.subscription);
        setUserInfo(data.user);
        localStorage.setItem('nova_user', JSON.stringify({ cedula: data.user.cedula, email: data.user.email }));
      } else {
        setSub(null);
        setUserInfo(null);
      }
    } catch {
      setSub(null);
    } finally {
      setSubLoading(false);
    }
  };

  const handleCheck = async () => {
    if (!form.cedula && !form.email) {
      setStatus({ type: 'error', message: 'Ingresa tu cédula o email' });
      return;
    }
    await checkSub(form.cedula, form.email);
    if (!subLoading) {
      setStatus({ type: 'info', message: sub ? 'Estado consultado' : 'Usuario no encontrado' });
    }
  };

  const handleMercadoPago = async () => {
    if (!userInfo) return;
    setPaymentLoading(true);
    try {
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userInfo.id,
          userName: userInfo.nombre,
          userEmail: userInfo.email,
        }),
      });
      const data = await res.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        setStatus({ type: 'error', message: 'Error al generar el pago' });
      }
    } catch {
      setStatus({ type: 'error', message: 'Error de conexión' });
    } finally {
      setPaymentLoading(false);
    }
  };

  const runPreop = async (e) => {
    e.preventDefault();
    if (!form.cedula || !form.email || !form.password) {
      setStatus({ type: 'error', message: 'Completa todos los campos' });
      return;
    }
    setLoading(true);
    setStatus({ type: 'info', message: '🚀 Ejecutando preoperacional...' });
    try {
      const res = await fetch('/api/run-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      localStorage.setItem('nova_user', JSON.stringify({ cedula: form.cedula, email: form.email }));
      setStatus({ type: res.ok ? 'success' : 'error', message: data.message });
      if (res.ok) {
        setUserInfo(data.user);
      }
    } catch {
      setStatus({ type: 'error', message: 'Error de conexión con el servidor' });
    } finally {
      setLoading(false);
    }
  };

  const subState = sub?.state;

  return (
    <div className="container" style={{ maxWidth: '700px' }}>
      <Head><title>Dashboard — Nova 360 Automation</title></Head>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>Nova 360</h2>
        <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}>
          ← Registro
        </Link>
      </div>

      <div className="glass-card animate-fade" style={{ padding: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>🎛️ Dashboard</h1>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
          Ingresa tus datos para consultar tu estado o ejecutar el preoperacional.
        </p>

        {userInfo && (
          <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '1rem', padding: '1rem 1.5rem', marginBottom: '1.5rem' }}>
            <p style={{ color: '#38bdf8', fontWeight: '700', margin: 0 }}>
              👤 {userInfo.nombre} · {userInfo.placa} · {userInfo.email}
            </p>
          </div>
        )}

        {subLoading && (
          <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>
            Consultando estado...
          </div>
        )}

        {!subLoading && subState === 'active' && (
          <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '1rem', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>✅</span>
            <div>
              <strong style={{ color: '#22c55e' }}>Suscripción Activa</strong>
              {sub.daysLeft > 0 && (
                <span style={{ color: '#86efac', fontSize: '0.9rem', marginLeft: '0.75rem' }}>
                  · {sub.daysLeft} día{sub.daysLeft !== 1 ? 's' : ''} restantes
                </span>
              )}
            </div>
          </div>
        )}

        {!subLoading && subState === 'trial' && (
          <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: '1rem', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⏳</span>
            <div>
              <strong style={{ color: '#38bdf8' }}>Período de Prueba</strong>
              <span style={{ color: '#7dd3fc', fontSize: '0.9rem', marginLeft: '0.75rem' }}>
                · {sub.daysLeft} día{sub.daysLeft !== 1 ? 's' : ''} restantes
              </span>
            </div>
          </div>
        )}

        {!subLoading && subState === 'trial_expiring' && (
          <div style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '1rem', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <div>
                <strong style={{ color: '#fbbf24' }}>Tu prueba está por terminar</strong>
                <span style={{ color: '#fde68a', fontSize: '0.9rem', marginLeft: '0.75rem' }}>
                  · {sub.daysLeft} día{sub.daysLeft !== 1 ? 's' : ''} restantes
                </span>
              </div>
            </div>
            {renderPaymentOptions()}
          </div>
        )}

        {!subLoading && subState === 'expired' && (
          <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '1rem', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>❌</span>
              <div>
                <strong style={{ color: '#ef4444' }}>Suscripción Expirada</strong>
                <p style={{ color: '#fca5a5', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                  Tu plan ha terminado. Actívalo nuevamente para seguir usando el servicio.
                </p>
              </div>
            </div>
            {renderPaymentOptions()}
          </div>
        )}

        <form onSubmit={runPreop}>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label>Cédula *</label>
              <input type="text" required value={form.cedula} onChange={e => set('cedula', e.target.value)} placeholder="Tu cédula" />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="tu@correo.com" />
            </div>
          </div>
          <div className="form-group">
            <label>Contraseña *</label>
            <input type="password" required value={form.password} onChange={e => set('password', e.target.value)} placeholder="Tu contraseña de Nova 360" />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button type="button" onClick={handleCheck} style={{
              padding: '0.7rem 1.5rem',
              background: 'rgba(56,189,248,0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56,189,248,0.3)',
              borderRadius: '0.75rem',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem',
              flex: 1,
            }}>
              🔍 Consultar Estado
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '0.7rem 1.5rem', fontSize: '0.95rem' }} disabled={loading || subState === 'expired'}>
              {loading ? '⏳ Ejecutando...' : '🚀 Ejecutar Preoperacional'}
            </button>
          </div>
        </form>

        {subState === 'expired' && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
            <p style={{ color: '#fca5a5', fontSize: '0.85rem', margin: 0, textAlign: 'center' }}>
              Tu suscripción está expirada. Realiza el pago para reactivar el servicio.
            </p>
          </div>
        )}

        {status.message && (
          <div style={{
            padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem',
            background: status.type === 'success' ? 'rgba(34,197,94,0.15)' : status.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(56,189,248,0.15)',
            color: status.type === 'success' ? '#22c55e' : status.type === 'error' ? '#ef4444' : '#38bdf8',
            border: `1px solid ${status.type === 'success' ? 'rgba(34,197,94,0.3)' : status.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(56,189,248,0.3)'}`
          }}>
            {status.message}
          </div>
        )}

        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(56,189,248,0.05)', borderRadius: '1rem', border: '1px solid rgba(56,189,248,0.1)' }}>
          <h3 style={{ color: '#38bdf8', marginBottom: '0.5rem', fontSize: '0.95rem' }}>⏰ Automatización diaria</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
            El sistema ejecuta tu preoperacional automáticamente cada mañana entre 6:00 AM y 12:00 PM (hora Colombia). 
            Recibirás la evidencia en tu correo electrónico.
          </p>
        </div>
      </div>
    </div>
  );

  function renderPaymentOptions() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <p style={{ color: '#f8fafc', fontSize: '0.9rem', fontWeight: '600', margin: 0 }}>
          Activa tu suscripción por 30 días por <strong style={{ color: '#22c55e' }}>${MONTHLY_PRICE.toLocaleString('es-CO')} COP</strong>:
        </p>

        <button
          onClick={handleMercadoPago}
          disabled={paymentLoading}
          style={{
            padding: '0.85rem 1.5rem',
            background: 'linear-gradient(135deg, #009ee3, #0077b5)',
            color: '#fff',
            border: 'none',
            borderRadius: '0.75rem',
            cursor: paymentLoading ? 'not-allowed' : 'pointer',
            fontWeight: '700',
            fontSize: '1rem',
            opacity: paymentLoading ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          {paymentLoading ? '⏳ Generando pago...' : '💳 Pagar con Mercado Pago'}
        </button>

        <button
          onClick={() => setShowTransfer(!showTransfer)}
          style={{
            padding: '0.85rem 1.5rem',
            background: 'rgba(255,255,255,0.08)',
            color: '#f8fafc',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '0.75rem',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          🏦 Transferencia Bancaria
        </button>

        {showTransfer && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '0.75rem',
            padding: '1rem 1.25rem',
          }}>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 0.75rem 0' }}>
              Realiza la transferencia por <strong style={{ color: '#f8fafc' }}>${MONTHLY_PRICE.toLocaleString('es-CO')} COP</strong> a:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Número:</span>
                <span style={{ color: '#f8fafc', fontWeight: '600' }}>{process.env.NEXT_PUBLIC_TRANSFER_NUMBER || '3136174267'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Titular:</span>
                <span style={{ color: '#f8fafc', fontWeight: '600' }}>{process.env.NEXT_PUBLIC_TRANSFER_NAME || 'Deiner Mena'}</span>
              </div>
            </div>
            <p style={{ color: '#fbbf24', fontSize: '0.8rem', margin: '0.75rem 0 0 0' }}>
              ⚠️ Envíanos el comprobante al WhatsApp para activar tu cuenta manualmente.
            </p>
          </div>
        )}
      </div>
    );
  }
}
