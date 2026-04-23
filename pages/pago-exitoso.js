import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function PagoExitoso() {
  const router = useRouter();
  const { user } = router.query;
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(t); router.push('/'); }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <Head><title>¡Pago Exitoso! — Nova 360</title></Head>
      <div className="glass-card animate-fade" style={{ textAlign: 'center', maxWidth: '520px', width: '100%', border: '1px solid rgba(34,197,94,0.3)' }}>
        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🎉</div>
        <h1 style={{ color: '#22c55e', fontSize: '2rem' }}>¡Pago Confirmado!</h1>
        <p style={{ color: '#94a3b8', fontSize: '1.05rem', marginBottom: '2rem' }}>
          Tu suscripción a Nova 360 Automation fue activada exitosamente por <strong style={{ color: '#f8fafc' }}>30 días</strong>. Tu preoperacional seguirá enviándose automáticamente cada mañana a las 6:00 AM.
        </p>
        <div style={{ background: 'rgba(34,197,94,0.1)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <p style={{ color: '#22c55e', margin: 0, fontWeight: '700' }}>
            ✅ Recibirás una confirmación en tu correo
          </p>
        </div>
        <p style={{ color: '#475569', fontSize: '0.85rem' }}>Redirigiendo en {countdown} segundos...</p>
      </div>
    </div>
  );
}
