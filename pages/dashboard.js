import Head from 'next/head';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [form, setForm] = useState({ cedula: '', email: '', password: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  useEffect(() => {
    const saved = localStorage.getItem('nova_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setForm({ cedula: u.cedula || '', email: u.email || '', password: '' });
      } catch {}
    }
  }, []);

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
          Ingresa tus datos para ejecutar el preoperacional manualmente en cualquier momento.
        </p>

        {userInfo && (
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '1rem', padding: '1rem 1.5rem', marginBottom: '2rem' }}>
            <p style={{ color: '#22c55e', fontWeight: '700', margin: 0 }}>
              ✅ Usuario: {userInfo.nombre} · Placa: {userInfo.placa} · {userInfo.email}
            </p>
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

          <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.05rem' }} disabled={loading}>
            {loading ? '⏳ Ejecutando...' : '🚀 Ejecutar Preoperacional'}
          </button>
        </form>

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
}