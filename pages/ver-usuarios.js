import { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';

export default function VerUsuarios() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, database: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/list-all-users');
      const data = await res.json();
      
      if (data.success) {
        setUsers(data.users);
        setStats({
          total: data.total,
          active: data.active,
          inactive: data.inactive,
          database: data.database
        });
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error al cargar usuarios: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>👥 Usuarios Registrados</h1>

        {/* Estadísticas */}
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          marginBottom: '30px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <div style={statCardStyle}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.total}</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Total</div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>{stats.active}</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Activos</div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f44336' }}>{stats.inactive}</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Inactivos</div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2196F3' }}>{stats.database}</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Base de Datos</div>
          </div>
        </div>

        {loading && <p>⏳ Cargando usuarios...</p>}
        {error && <p style={{ color: 'red' }}>❌ {error}</p>}

        {!loading && !error && users.length === 0 && (
          <p>⚠️ No hay usuarios registrados</p>
        )}

        {!loading && !error && users.length > 0 && (
          <div style={{ width: '100%', maxWidth: '1200px', overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Estado</th>
                  <th style={thStyle}>Nombre</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Cédula</th>
                  <th style={thStyle}>Placa</th>
                  <th style={thStyle}>Suscripción</th>
                  <th style={thStyle}>Vence</th>
                  <th style={thStyle}>KM Actual</th>
                  <th style={thStyle}>Última Ejecución</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={tdStyle}>{user.id}</td>
                    <td style={tdStyle}>
                      {user.active ? (
                        <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>✅ Activo</span>
                      ) : (
                        <span style={{ color: '#f44336', fontWeight: 'bold' }}>❌ Inactivo</span>
                      )}
                    </td>
                    <td style={tdStyle}>{user.nombre}</td>
                    <td style={tdStyle}>{user.email}</td>
                    <td style={tdStyle}>{user.cedula}</td>
                    <td style={tdStyle}>{user.placa}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: user.subscription_status === 'active' ? '#e8f5e9' : '#ffebee',
                        color: user.subscription_status === 'active' ? '#2e7d32' : '#c62828'
                      }}>
                        {user.subscription_status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {user.subscription_until ? formatDate(user.subscription_until) : 'N/A'}
                    </td>
                    <td style={tdStyle}>{user.km_actual}</td>
                    <td style={tdStyle}>
                      {user.last_run ? formatDate(user.last_run) : 'Nunca'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: '30px' }}>
          <button onClick={fetchUsers} style={buttonStyle}>
            🔄 Recargar
          </button>
          <a href="/" style={{ ...buttonStyle, marginLeft: '10px', textDecoration: 'none', display: 'inline-block' }}>
            🏠 Volver al Inicio
          </a>
        </div>
      </main>
    </div>
  );
}

const statCardStyle = {
  padding: '20px',
  backgroundColor: '#f5f5f5',
  borderRadius: '8px',
  textAlign: 'center',
  minWidth: '120px'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  backgroundColor: 'white',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  borderRadius: '8px',
  overflow: 'hidden'
};

const thStyle = {
  backgroundColor: '#2196F3',
  color: 'white',
  padding: '12px',
  textAlign: 'left',
  fontWeight: 'bold',
  fontSize: '14px'
};

const tdStyle = {
  padding: '12px',
  fontSize: '14px'
};

const buttonStyle = {
  padding: '10px 20px',
  backgroundColor: '#2196F3',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '16px'
};
