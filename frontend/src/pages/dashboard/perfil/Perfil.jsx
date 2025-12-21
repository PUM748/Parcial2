import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Perfil.css';

function Perfil() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    id: null,
    full_name: '',
    email: ''
  });
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          full_name: data.full_name,
          email: data.email,
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      } else if (response.status === 401) {
        localStorage.removeItem('access_token');
        navigate('/login');
      } else {
        setError('Error al cargar perfil');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.full_name || !formData.email) {
      setError('Nombre y correo son obligatorios');
      return;
    }

    if (formData.new_password && formData.new_password !== formData.confirm_password) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.new_password && formData.new_password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    const token = localStorage.getItem('access_token');
    const updateData = {
      full_name: formData.full_name,
      email: formData.email
    };

    if (formData.new_password) {
      updateData.current_password = formData.current_password;
      updateData.new_password = formData.new_password;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        await fetchProfile(); 
        setEditing(false);
        setSuccess('Perfil actualizado correctamente');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Error al actualizar perfil');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Está seguro de eliminar su cuenta? Esta acción no se puede deshacer.')) {
      return;
    }

    const token = localStorage.getItem('access_token');

    try {
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        localStorage.removeItem('access_token');
        alert('Cuenta eliminada correctamente');
        navigate('/login');
      } else {
        const data = await response.json();
        setError(data.detail || 'Error al eliminar cuenta');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error(err);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: profile.full_name,
      email: profile.email,
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    setEditing(false);
    setError('');
  };

  if (loading) {
    return <div className="loading">Cargando perfil...</div>;
  }

  return (
    <div className="perfil-container">
      <div className="perfil-card">
        <div className="perfil-header">
          <svg
            className="perfil-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <h2>Mi Perfil</h2>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {!editing ? (
          <div className="perfil-view">
            <div className="profile-info">
              <div className="info-item">
                <label>Nombre Completo</label>
                <p>{profile.full_name}</p>
              </div>

              <div className="info-item">
                <label>Correo Electrónico</label>
                <p>{profile.email}</p>
              </div>

              <div className="info-item">
                <label>ID de Usuario</label>
                <p>#{profile.id}</p>
              </div>
            </div>

            <div className="profile-actions">
              <button
                className="btn-primary"
                onClick={() => setEditing(true)}
              >
                Editar Perfil
              </button>
              <button
                className="btn-danger"
                onClick={handleDelete}
              >
                Eliminar Cuenta
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="perfil-form">
            <div className="form-group">
              <label>Nombre Completo</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Ej: Dr. Juan Pérez"
                required
              />
            </div>

            <div className="form-group">
              <label>Correo Electrónico</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="correo@ejemplo.com"
                required
              />
            </div>

            <div className="password-section">
              <h3>Cambiar Contraseña (Opcional)</h3>

              <div className="form-group">
                <label>Contraseña Actual</label>
                <input
                  type="password"
                  value={formData.current_password}
                  onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                  placeholder="Ingresa tu contraseña actual"
                />
              </div>

              <div className="form-group">
                <label>Nueva Contraseña</label>
                <input
                  type="password"
                  value={formData.new_password}
                  onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <label>Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  placeholder="Repite la nueva contraseña"
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancel}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Perfil;