import { useState } from 'react';
import Head from 'next/head';
import { UserPlus, CheckCircle, ShieldCheck, Zap, Clock, CreditCard } from 'lucide-react';

export default function Home() {
  const [formData, setFormData] = useState({
    cedula: '',
    nombre: '',
    placa: '',
    email: '',
    password: '',
    supervisor: 'eduardo Villareal',
    km_actual: '',
    vacaciones_inicio: '',
    vacaciones_fin: ''
  });

  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setRegistered(true);
        setStatus({ type: 'success', message: data.message });
      } else {
        setStatus({ type: 'error', message: data.message || 'Error al registrar' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Error de conexión con el servidor' });
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <Head><title>Registro Exitoso — Nova 360 Automation</title></Head>
        <div className="glass-card animate-fade" style={{ textAlign: 'center', maxWidth: '560px', width: '100%' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>¡Todo listo, {formData.nombre.split(' ')[0]}!</h1>
          <p style={{ color: '#94a3b8', marginBottom: '2rem', fontSize: '1.1rem' }}>
            Revisa tu correo <strong style={{ color: '#38bdf8' }}>{formData.email}</strong> — te enviamos los detalles de tu cuenta.
          </p>
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <p style={{ color: '#22c55e', fontWeight: '700', fontSize: '1.1rem', margin: 0 }}>
              ✅ Tu preoperacional se enviará automáticamente mañana a las 6:00 AM
            </p>
          </div>
          <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '1rem', padding: '1.5rem' }}>
            <p style={{ color: '#38bdf8', margin: 0 }}>⏳ <strong>5 días gratis</strong> — Luego solo $10.000/mes</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Head>
        <title>Nova 360 — Automatización de Preoperacional</title>
        <meta name="description" content="Regístrate y automatiza tu preoperacional diario. 5 días gratis." />
      </Head>

      <div style={{ textAlign: 'center', marginBottom: '3rem' }} className="animate-fade">
        <h1>Nova 360 Automation</h1>
        <p style={{ color: '#94a3b8', fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto' }}>
          Rellena tu información <strong style={{ color: '#f8fafc' }}>una sola vez</strong> y nosotros nos encargamos de tu preoperacional automáticamente cada mañana a las 6:00 AM.
        </p>
        
        {/* Explicación amigable del sistema */}
        <div style={{ 
          maxWidth: '700px', 
          margin: '2rem auto 0 auto', 
          background: 'rgba(56,189,248,0.1)', 
          border: '1px solid rgba(56,189,248,0.2)', 
          borderRadius: '1.25rem', 
          padding: '1.5rem',
          textAlign: 'left'
        }}>
          <h3 style={{ color: '#38bdf8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={20} /> ¿Cómo funciona esto?
          </h3>
          <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.5', margin: 0 }}>
            Tú solo dinos quién eres y qué moto manejas en el formulario de abajo. 
            <br /><br />
            <strong>¿Y el resto del formulario largo?</strong> No te preocupes. Nuestro sistema inteligente se encarga de "chulear" (marcar como Bueno / Sí) todas las partes técnicas de la moto por ti. Así ahorras tiempo y te aseguras de que tu reporte diario siempre llegue a tiempo y sin errores.
          </p>
        </div>

        <div style={{ display: 'inline-flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '0.4rem 1rem', borderRadius: '9999px', fontSize: '0.9rem', fontWeight: '600' }}>
            ✅ 5 días gratis
          </span>
          <span style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', padding: '0.4rem 1rem', borderRadius: '9999px', fontSize: '0.9rem', fontWeight: '600' }}>
            💳 Luego $10.000/mes
          </span>
          <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '0.4rem 1rem', borderRadius: '9999px', fontSize: '0.9rem', fontWeight: '600' }}>
            🤖 IA verificada
          </span>
        </div>
      </div>

      <div className="grid">
        {/* Formulario */}
        <div className="glass-card animate-fade">
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={24} color="#38bdf8" />
            Registro — Tu información
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Datos personales */}
            <p style={{ fontSize: '0.8rem', color: '#38bdf8', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700' }}>
              Datos Personales
            </p>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>Cédula *</label>
                <input type="text" required value={formData.cedula} onChange={e => set('cedula', e.target.value)} placeholder="Ej: 1077449318" />
              </div>
              <div className="form-group">
                <label>Nombre Completo *</label>
                <input type="text" required value={formData.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Duvier Mena" />
              </div>
            </div>

            <div className="form-group">
              <label>Correo Electrónico * (recibirás la evidencia diaria aquí)</label>
              <input type="email" required value={formData.email} onChange={e => set('email', e.target.value)} placeholder="tu@correo.com" />
            </div>

            {/* Datos de acceso ConectarTV */}
            <p style={{ fontSize: '0.8rem', color: '#38bdf8', marginBottom: '1rem', marginTop: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700' }}>
              Acceso ConectarTV (Nova 360)
            </p>
            <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
              <p style={{ color: '#fbbf24', fontSize: '0.85rem', margin: 0 }}>
                🔒 Tus credenciales se usan exclusivamente para completar tu preoperacional. Nunca se comparten.
              </p>
            </div>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>Contraseña de Nova 360 *</label>
                <input type="password" required value={formData.password} onChange={e => set('password', e.target.value)} placeholder="Tu contraseña" />
              </div>
              <div className="form-group">
                <label>Placa de Moto *</label>
                <input type="text" required value={formData.placa} onChange={e => set('placa', e.target.value.toUpperCase())} placeholder="Ej: AGC-15I" maxLength={8} />
              </div>
            </div>

            {/* Datos del trabajo */}
            <p style={{ fontSize: '0.8rem', color: '#38bdf8', marginBottom: '1rem', marginTop: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700' }}>
              Datos del Trabajo
            </p>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>Supervisor</label>
                <input type="text" value={formData.supervisor} onChange={e => set('supervisor', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Kilometraje Actual (aprox.)</label>
                <input type="number" value={formData.km_actual} onChange={e => set('km_actual', e.target.value)} placeholder="Ej: 12500" />
              </div>
            </div>

            {/* Vacaciones */}
            <div style={{ padding: '1rem', background: 'rgba(56,189,248,0.05)', borderRadius: '1rem', marginBottom: '1.5rem', border: '1px solid rgba(56,189,248,0.1)' }}>
              <p style={{ fontSize: '0.85rem', color: '#38bdf8', marginBottom: '0.75rem', fontWeight: '600' }}>
                🏖️ Período de Vacaciones (Opcional)
              </p>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>Si tienes fechas de vacaciones programadas, el sistema las registrará automáticamente cada día.</p>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Inicio</label>
                  <input type="date" value={formData.vacaciones_inicio} onChange={e => set('vacaciones_inicio', e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Fin</label>
                  <input type="date" value={formData.vacaciones_fin} onChange={e => set('vacaciones_fin', e.target.value)} />
                </div>
              </div>
            </div>

            {status.message && (
              <div style={{
                padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem',
                background: status.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                color: status.type === 'success' ? '#22c55e' : '#ef4444',
                border: `1px solid ${status.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`
              }}>
                {status.message}
              </div>
            )}

            <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.05rem' }} disabled={loading}>
              {loading ? '⏳ Activando tu automatización...' : '🚀 Activar 5 Días Gratis'}
            </button>
            <p style={{ textAlign: 'center', color: '#475569', fontSize: '0.8rem', marginTop: '0.75rem' }}>
              Sin tarjeta de crédito. Después del trial: $10.000 COP/mes.
            </p>
          </form>
        </div>

        {/* Beneficios */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card animate-fade" style={{ animationDelay: '0.15s' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(99,102,241,0.2)', borderRadius: '0.75rem', flexShrink: 0 }}>
                <Zap size={24} color="#6366f1" />
              </div>
              <div>
                <h3 style={{ marginBottom: '0.4rem' }}>100% Automático</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                  Login, llenado de formulario, kilometraje incremental y envío — todo en menos de 2 minutos cada mañana.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card animate-fade" style={{ animationDelay: '0.25s' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(34,197,94,0.2)', borderRadius: '0.75rem', flexShrink: 0 }}>
                <CheckCircle size={24} color="#22c55e" />
              </div>
              <div>
                <h3 style={{ marginBottom: '0.4rem' }}>Evidencia en tu Correo</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                  Recibirás cada mañana una captura de pantalla del formulario enviado. Siempre tendrás tu comprobante.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card animate-fade" style={{ animationDelay: '0.35s' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(56,189,248,0.2)', borderRadius: '0.75rem', flexShrink: 0 }}>
                <ShieldCheck size={24} color="#38bdf8" />
              </div>
              <div>
                <h3 style={{ marginBottom: '0.4rem' }}>IA Verificadora</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                  Una IA revisa cada formulario antes de enviarlo para asegurar que todos los campos están correctamente llenados.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card animate-fade" style={{ animationDelay: '0.45s', border: '1px solid rgba(56,189,248,0.3)' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(251,191,36,0.2)', borderRadius: '0.75rem', flexShrink: 0 }}>
                <Clock size={24} color="#fbbf24" />
              </div>
              <div>
                <h3 style={{ marginBottom: '0.4rem' }}>5 Días Gratis, Luego $10.000/mes</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                  Prueba el sistema sin compromiso. Si te convence (y lo hará), renueva por solo $10.000 pesos al mes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
