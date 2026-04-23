import Head from 'next/head';
import { Play, Trash2, Loader2, CheckCircle2, XCircle, RefreshCw, Crown } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/router';

export async function getServerSideProps() {
  // require() dentro de getServerSideProps = solo se ejecuta en el servidor
  const { all } = require('../lib/db');
  const users = await all(`SELECT * FROM users ORDER BY created_at DESC`);
  return { props: { users: JSON.parse(JSON.stringify(users)) } };
}

function getSubscriptionBadge(user) {
  const status = user.subscription_status || 'trial';
  const now = new Date();
  const trialEnd = user.subscription_until ? new Date(user.subscription_until) : null;
  const daysLeft = trialEnd ? Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)) : null;

  if (status === 'active') return { label: '✅ Activo', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' };
  if (status === 'expired') return { label: '❌ Expirado', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
  if (status === 'trial') {
    if (daysLeft !== null && daysLeft > 0) return { label: `⏳ Trial (${daysLeft}d)`, color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' };
    return { label: '⏰ Trial expirado', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
  }
  return { label: status, color: '#94a3b8', bg: 'rgba(100,116,139,0.15)' };
}

export default function Admin({ users }) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });

  const runUser = async (id) => {
    if (processingId) return;
    setProcessingId(id);
    setStatus({ type: 'info', message: 'Iniciando proceso para el usuario...' });
    try {
      const res = await fetch('/api/run-user', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
      });
      const data = await res.json();
      setStatus({ type: res.ok ? 'success' : 'error', message: data.message });
      if (res.ok) router.replace(router.asPath);
    } catch {
      setStatus({ type: 'error', message: 'Error de conexión' });
    } finally { setProcessingId(null); }
  };

  const activateUser = async (id) => {
    const months = prompt('¿Cuántos meses activar?', '1');
    if (!months) return;
    try {
      const res = await fetch('/api/activate-user', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, months: parseInt(months) }),
      });
      const data = await res.json();
      setStatus({ type: res.ok ? 'success' : 'error', message: data.message });
      if (res.ok) router.replace(router.asPath);
    } catch {
      setStatus({ type: 'error', message: 'Error al activar' });
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      const res = await fetch('/api/delete-user', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
      });
      if (res.ok) { setStatus({ type: 'success', message: 'Usuario eliminado' }); router.replace(router.asPath); }
    } catch {
      setStatus({ type: 'error', message: 'Error al eliminar' });
    }
  };

  const totalActive = users.filter(u => u.subscription_status === 'active').length;
  const totalTrial = users.filter(u => u.subscription_status === 'trial').length;
  const totalExpired = users.filter(u => u.subscription_status === 'expired').length;

  return (
    <div className="container">
      <Head><title>Admin — Nova 360 SaaS</title></Head>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Panel de Administración</h1>
          <p style={{ color: '#94a3b8' }}>Gestiona los preoperacionales automatizados</p>
        </div>
        <button onClick={() => router.replace(router.asPath)} style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '2rem', gap: '1rem' }}>
        {[
          { label: 'Activos (pagos)', value: totalActive, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
          { label: 'En Trial', value: totalTrial, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
          { label: 'Expirados', value: totalExpired, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', border: `1px solid ${s.color}33` }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: s.color }}>{s.value}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {status.message && (
        <div style={{
          padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
          background: status.type === 'success' ? 'rgba(34,197,94,0.1)' : status.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(56,189,248,0.1)',
          color: status.type === 'success' ? '#22c55e' : status.type === 'error' ? '#ef4444' : '#38bdf8',
          border: `1px solid ${status.type === 'success' ? '#22c55e33' : status.type === 'error' ? '#ef444433' : '#38bdf833'}`
        }}>
          {status.type === 'success' && <CheckCircle2 size={20} />}
          {status.type === 'error' && <XCircle size={20} />}
          {status.type === 'info' && <Loader2 size={20} className="animate-spin" />}
          {status.message}
        </div>
      )}

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)' }}>
                <th style={{ padding: '1rem' }}>Usuario</th>
                <th style={{ padding: '1rem' }}>Vehículo</th>
                <th style={{ padding: '1rem' }}>Suscripción</th>
                <th style={{ padding: '1rem' }}>Última Ejecución</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const badge = getSubscriptionBadge(u);
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }} className="table-row">
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '600' }}>{u.nombre}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>CC: {u.cedula} · {u.email}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className="badge" style={{ background: '#334155', color: '#f8fafc' }}>{u.placa}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ background: badge.bg, color: badge.color, padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                      {u.last_run ? new Date(u.last_run).toLocaleString('es-CO') : 'Pendiente'}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => runUser(u.id)} disabled={!!processingId} className="btn-icon" title="Ejecutar Ahora">
                          {processingId === u.id ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                        </button>
                        <button onClick={() => activateUser(u.id)} className="btn-icon btn-icon-gold" title="Activar Suscripción">
                          <Crown size={16} />
                        </button>
                        <button onClick={() => deleteUser(u.id)} className="btn-icon btn-icon-danger" title="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    No hay usuarios registrados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .table-row:hover { background: rgba(255,255,255,0.02); }
        .btn-icon {
          background: #1e293b; border: 1px solid #334155; color: #38bdf8;
          padding: 0.45rem; border-radius: 0.5rem; cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center;
        }
        .btn-icon:hover:not(:disabled) { background: #334155; transform: translateY(-1px); }
        .btn-icon:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-icon-danger { color: #ef4444; }
        .btn-icon-danger:hover { background: rgba(239,68,68,0.1) !important; border-color: #ef444433; }
        .btn-icon-gold { color: #fbbf24; }
        .btn-icon-gold:hover { background: rgba(251,191,36,0.1) !important; border-color: #fbbf2433; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
