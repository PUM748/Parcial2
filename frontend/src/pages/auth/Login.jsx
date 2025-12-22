import { useEffect, useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true); // 👈 Nuevo estado

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!formData.email || !formData.password) {
      setError('Todos los campos son obligatorios');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('access_token', data.access_token);
        navigate('/dashboard');
      } else {
        setError(data.detail || 'Credenciales incorrectas');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setCheckingAuth(false);
        return;
      }

      try {
        // Verificar el token
        const response = await fetch('http://localhost:5000/api/dashboard/summary', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          navigate('/dashboard');
        } else {
          localStorage.removeItem('access_token');
        }
      } catch (err) {
        console.error('Error verificando token:', err);
        localStorage.removeItem('access_token');
      } finally {
        setCheckingAuth(false);
      }
    };

    verifyToken();
  }, [navigate]);

  if (checkingAuth) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <p>Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <button onClick={() => navigate("/")} className='back_button'>
          <FaArrowLeft size={20} /> 
        </button>

        <div className="auth-header">
          <svg
            className="auth-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
            <polyline points="10 17 15 12 10 7"></polyline>
            <line x1="15" y1="12" x2="3" y2="12"></line>
          </svg>
          <h1 className="auth-title">Iniciar Sesión</h1>
          <p className="auth-subtitle">Accede al sistema de diagnóstico</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="juan@hospital.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="Tu contraseña"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-footer-text">
            ¿No tienes una cuenta?{' '}
            <button
              onClick={() => navigate('/registro')}
              className="auth-link"
              disabled={loading}
            >
              Regístrate
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;