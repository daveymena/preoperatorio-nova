/**
 * Página de Administración de Usuarios
 * Para insertar y ver usuarios en la BD
 */

import { useState, useEffect } from 'react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState('');
  const [dbInfo, setDbInfo] = useState(null);

  useEffect(() => {
    loadDBInfo();
    loadUsers();
  }, []);

  const loadDBInfo = async () => {
    try {
      const response = await fetch('/api/check-db');
      const data = await response.json();
      setDbInfo(data.database);
    } catch (error) {
      console.error('Error cargando info de BD:', error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/list-users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
        setMessage(`✅ ${data.count} usuario(s) encontrado(s)`);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const seedDaveyUser = async () => {
    try {
      setSeeding(true);
      setMessage('⏳ Insertando usuario de Davey...');
      
      const response = await fetch('/api/seed-user');
      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ ${data.message}`);
        await loadUsers(); // Recargar lista
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error insertando usuario:', error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>👥 Administración de Usuarios</h1>
      
      {/* Información de la Base de Datos */}
      {dbInfo && (
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: dbInfo.connected ? '#d4edda' : '#f8d7da',
          border: `1px solid ${dbInfo.connected ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '5px'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>
            {dbInfo.connected ? '✅ Base de Datos Conectada' : '❌ Base de Datos No Conectada'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            <div>
              <strong>Tipo:</strong> {dbInfo.type}
            </div>
            <div>
              <strong>URL:</strong> {dbInfo.url}
            </div>
            <div>
              <strong>Usuarios:</strong> {dbInfo.userCount}
            </div>
            <div>
              <strong>Tablas:</strong> {dbInfo.tables?.length || 0}
            </div>
          </div>
          {dbInfo.tables && dbInfo.tables.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <strong>Tablas disponibles:</strong> {dbInfo.tables.join(', ')}
            </div>
          )}
          {dbInfo.sampleUser && (
            <div style={{ marginTop: '10px' }}>
              <strong>Primer usuario:</strong> {dbInfo.sampleUser.nombre} ({dbInfo.sampleUser.email})
            </div>
          )}
          {dbInfo.error && (
            <div style={{ marginTop: '10px', color: '#721c24' }}>
              <strong>Error:</strong> {dbInfo.error}
            </div>
          )}
        </div>
      )}
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Acciones:</p>
        <button
          onClick={seedDaveyUser}
          disabled={seeding || loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: seeding || loading ? 'not-allowed' : 'pointer',
            marginRight: '10px',
            opacity: seeding || loading ? 0.6 : 1
          }}
        >
          {seeding ? '⏳ Insertando...' : '🌱 Insertar Usuario Davey'}
        </button>
        
        <button
          onClick={() => { loadDBInfo(); loadUsers(); }}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? '⏳ Cargando...' : '🔄 Recargar Todo'}
        </button>
      </div>

      {message && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          backgroundColor: message.includes('❌') ? '#ffe6e6' : '#e6f7ff',
          borderLeft: `4px solid ${message.includes('❌') ? '#ff4444' : '#1890ff'}`,
          borderRadius: '5px'
        }}>
          {message}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>⏳ Cargando usuarios...</p>
        </div>
      ) : users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
          <h3>⚠️ No hay usuarios en la base de datos</h3>
          <p>Haz clic en "Insertar Usuario Davey" para crear el usuario por defecto</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Nombre</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Cédula</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Placa</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>KM</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Estado</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Suscripción</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px' }}>{user.id}</td>
                  <td style={{ padding: '12px' }}>{user.nombre}</td>
                  <td style={{ padding: '12px' }}>{user.email}</td>
                  <td style={{ padding: '12px' }}>{user.cedula}</td>
                  <td style={{ padding: '12px' }}>{user.placa}</td>
                  <td style={{ padding: '12px' }}>{user.km_actual}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: user.active ? '#d4edda' : '#f8d7da',
                      color: user.active ? '#155724' : '#721c24'
                    }}>
                      {user.active ? '✅ Activo' : '❌ Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {user.subscription_until ? new Date(user.subscription_until).toLocaleDateString('es-CO') : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e8f4f8', borderRadius: '5px' }}>
        <h4>ℹ️ Información</h4>
        <ul>
          <li><strong>Usuario Davey:</strong> daveymena16@gmail.com</li>
          <li><strong>Contraseña:</strong> 1077449318</li>
          <li><strong>Cédula:</strong> 1077449318</li>
          <li><strong>Base de datos:</strong> {process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite'}</li>
        </ul>
      </div>
    </div>
  );
}
