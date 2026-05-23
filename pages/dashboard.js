import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Play, CheckCircle, AlertCircle, Loader2, RefreshCw, Eye, EyeOff, AlertTriangle, Zap, Database, Server, Code } from 'lucide-react';

export default function Dashboard() {
  const [systemStatus, setSystemStatus] = useState({
    webServer: 'checking',
    scheduler: 'checking',
    database: 'checking',
    g4f: 'checking',
    lastExecution: null,
    nextExecution: null,
    usersActive: 0,
    usersTotal: 0
  });

  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [manualExecution, setManualExecution] = useState({
    cedula: '',
    email: '',
    password: ''
  });

  // Verificar estado del sistema
  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000); // Cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const checkSystemStatus = async () => {
    try {
      const res = await fetch('/api/system-status');
      const data = await res.json();
      setSystemStatus(data);
    } catch (error) {
      console.error('Error verificando estado:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeNow = async () => {
    if (!manualExecution.cedula || !manualExecution.email || !manualExecution.password) {
      setStatus({ type: 'error', message: 'Por favor completa todos los campos' });
      return;
    }

    setExecuting(true);
    setStatus({ type: 'info', message: 'Ejecutando preoperacional...' });

    try {
      const res = await fetch('/api/run-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualExecution)
      });

      const data = await res.json();
      setStatus({
        type: res.ok ? 'success' : 'error',
        message: data.message
      });

      if (res.ok) {
        setManualExecution({ cedula: '', email: '', password: '' });
        setTimeout(checkSystemStatus, 2000);
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Error de conexión' });
    } finally {
      setExecuting(false);
    }
  };

  const StatusBadge = ({ status, label }) => {
    const statusConfig = {
      'ok': { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: CheckCircle },
      'warning': { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', icon: AlertCircle },
      'error': { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: AlertTriangle },
      'checking': { color: '#38bdf8', bg: 'rgba(56,189,248,0.1)', icon: Loader2 }
    };

    const config = statusConfig[status] || statusConfig['checking'];
    const Icon = config.icon;

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        background: config.bg,
        color: config.color,
        borderRadius: '0.5rem',
        fontSize: '0.9rem',
        fontWeight: '600'
      }}>
        <Icon size={16} className={status === 'checking' ? 'animate-spin' : ''} />
        {label}
      </div>
    );
  };

  return (
    <div className="container">
      <Head>
        <title>Dashboard — Nova 360 Automation</title>
      </Head>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>🎛️ Dashboard del Sistema</h1>
          <p style={{ color: '#94a3b8' }}>Verifica el estado y ejecuta manualmente si es necesario</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={checkSystemStatus}
            style={{
              background: 'rgba(56,189,248,0.1)',
              border: '1px solid #38bdf844',
              color: '#38bdf8',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '600'
            }}
          >
            <RefreshCw size={16} /> Actualizar
          </button>
          <Link href="/" style={{
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.3)',
            color: '#818cf8',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: '600'
          }}>
            ← Volver
          </Link>
        </div>
      </div>

      {/* Estado del Sistema */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Server size={24} color="#38bdf8" />
          Estado del Sistema
        </h2>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {/* Servidor Web */}
          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Servidor Web</h3>
              <StatusBadge status={systemStatus.webServer} label={systemStatus.webServer === 'ok' ? 'Activo' : 'Verificando'} />
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
              {systemStatus.webServer === 'ok' ? '✅ El servidor está corriendo correctamente' : '⏳ Verificando conexión...'}
            </p>
          </div>

          {/* Scheduler */}
          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Scheduler</h3>
              <StatusBadge status={systemStatus.scheduler} label={systemStatus.scheduler === 'ok' ? 'Activo' : 'Verificando'} />
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
              {systemStatus.scheduler === 'ok' ? '✅ Ejecutándose cada hora (6 AM - 12 PM)' : '⏳ Verificando...'}
            </p>
          </div>

          {/* Base de Datos */}
          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Base de Datos</h3>
              <StatusBadge status={systemStatus.database} label={systemStatus.database === 'ok' ? 'Conectada' : 'Verificando'} />
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
              {systemStatus.database === 'ok' ? `✅ ${systemStatus.usersTotal} usuarios registrados` : '⏳ Verificando...'}
            </p>
          </div>

          {/* G4F (IA) */}
          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>G4F (IA)</h3>
              <StatusBadge status={systemStatus.g4f} label={systemStatus.g4f === 'ok' ? 'Disponible' : 'Verificando'} />
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
              {systemStatus.g4f === 'ok' ? '✅ 111+ modelos gratuitos disponibles' : '⏳ Verificando...'}
            </p>
          </div>
        </div>

        {/* Última Ejecución */}
        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(56,189,248,0.05)', borderRadius: '0.75rem', border: '1px solid rgba(56,189,248,0.1)' }}>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 0.25rem 0' }}>📅 Última Ejecución</p>
              <p style={{ color: '#f8fafc', fontSize: '1rem', margin: 0, fontWeight: '600' }}>
                {systemStatus.lastExecution ? new Date(systemStatus.lastExecution).toLocaleString('es-CO') : 'Pendiente'}
              </p>
            </div>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 0.25rem 0' }}>⏰ Próxima Ejecución</p>
              <p style={{ color: '#f8fafc', fontSize: '1rem', margin: 0, fontWeight: '600' }}>
                {systemStatus.nextExecution ? new Date(systemStatus.nextExecution).toLocaleString('es-CO') : 'Mañana 6:00 AM'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ejecutar Manualmente */}
      <div className="glass-card">
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={24} color="#fbbf24" />
          Ejecutar Preoperacional Manualmente
        </h2>

        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
          Si el sistema no se ejecutó automáticamente o necesitas ejecutarlo ahora, ingresa tus credenciales aquí:
        </p>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label>Cédula *</label>
            <input
              type="text"
              placeholder="Ej: 1077449318"
              value={manualExecution.cedula}
              onChange={e => setManualExecution({ ...manualExecution, cedula: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Correo Electrónico *</label>
            <input
              type="email"
              placeholder="tu@correo.com"
              value={manualExecution.email}
              onChange={e => setManualExecution({ ...manualExecution, email: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label>Contraseña Nova 360 *</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Tu contraseña"
              value={manualExecution.password}
              onChange={e => setManualExecution({ ...manualExecution, password: e.target.value })}
              style={{ paddingRight: '2.5rem' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '0.5rem'
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {status.message && (
          <div style={{
            padding: '1rem',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
            background: status.type === 'success' ? 'rgba(34,197,94,0.1)' : status.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(56,189,248,0.1)',
            color: status.type === 'success' ? '#22c55e' : status.type === 'error' ? '#ef4444' : '#38bdf8',
            border: `1px solid ${status.type === 'success' ? 'rgba(34,197,94,0.3)' : status.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(56,189,248,0.3)'}`
          }}>
            {status.message}
          </div>
        )}

        <button
          onClick={executeNow}
          disabled={executing || !manualExecution.cedula || !manualExecution.email || !manualExecution.password}
          style={{
            width: '100%',
            padding: '1rem',
            fontSize: '1.05rem',
            background: executing ? '#334155' : '#fbbf24',
            color: executing ? '#94a3b8' : '#000',
            border: 'none',
            borderRadius: '0.75rem',
            cursor: executing ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            opacity: executing || !manualExecution.cedula || !manualExecution.email || !manualExecution.password ? 0.5 : 1
          }}
        >
          {executing ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Ejecutando...
            </>
          ) : (
            <>
              <Play size={20} />
              Ejecutar Ahora
            </>
          )}
        </button>

        <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '1rem', textAlign: 'center' }}>
          🔒 Tus credenciales se usan solo para completar el preoperacional. Nunca se guardan.
        </p>
      </div>

      {/* Información del Formulario Faltante */}
      <div className="glass-card" style={{ marginTop: '2rem', background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24' }}>
          <AlertTriangle size={24} />
          ℹ️ Sobre el Formulario Preoperacional
        </h2>

        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '1rem', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#f8fafc' }}>¿Qué campos se rellenan automáticamente?</h3>
          <ul style={{ color: '#cbd5e1', lineHeight: '1.8', margin: 0, paddingLeft: '1.5rem' }}>
            <li><strong>Supervisor:</strong> Se rellena con "eduardo Villareal"</li>
            <li><strong>Kilometraje:</strong> Se incrementa automáticamente cada día</li>
            <li><strong>Radio Buttons (Sí/No, Bueno/Malo):</strong> Se selecciona la opción positiva automáticamente</li>
            <li><strong>Observaciones:</strong> Se rellena con "Nada"</li>
            <li><strong>Vacaciones:</strong> Se rellenan con las fechas que proporcionaste</li>
            <li><strong>Campos de Estado del Vehículo:</strong> Se marcan como "Bueno"</li>
          </ul>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '1rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#f8fafc' }}>¿Qué campos NO se rellenan?</h3>
          <p style={{ color: '#cbd5e1', margin: 0, lineHeight: '1.8' }}>
            Los campos que requieren información específica de tu empresa o situación particular. Si el sistema detecta que falta algún campo, lo intentará rellenar automáticamente con un valor genérico o te lo reportará en el correo de evidencia.
          </p>
        </div>

        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(34,197,94,0.1)', borderRadius: '0.75rem', border: '1px solid rgba(34,197,94,0.3)' }}>
          <p style={{ color: '#22c55e', margin: 0, fontWeight: '600' }}>
            ✅ Si el formulario tiene campos adicionales que no se rellenan, el sistema los detectará y te lo reportará en el correo.
          </p>
        </div>
      </div>

      <style jsx>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
