import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Pacientes from './pacientes/Pacientes';
import Diagnosticos from './diagnosticos/Diagnosticos';
import Perfil from './perfil/Perfil';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('dashboard');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/dashboard/summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data);
        
        setSummary(data);
      } else if (response.status === 401) {
        localStorage.removeItem('access_token');
        navigate('/login');
      } else {
        setError('Error al cargar el dashboard');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <h2>Sistema Diagnóstico IA</h2>
        </div>
        <div className="nav-links">
          <button 
            className={activeView === 'dashboard' ? 'nav-link active' : 'nav-link'}
            onClick={() => setActiveView('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={activeView === 'pacientes' ? 'nav-link active' : 'nav-link'}
            onClick={() => setActiveView('pacientes')}
          >
            Pacientes
          </button>
          <button 
            className={activeView === 'diagnosticos' ? 'nav-link active' : 'nav-link'}
            onClick={() => setActiveView('diagnosticos')}
          >
            Diagnósticos
          </button>
          <button 
            className={activeView === 'perfil' ? 'nav-link active' : 'nav-link'}
            onClick={() => setActiveView('perfil')}
          >
            Perfil
          </button>
          <button className="nav-link logout" onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <main className="dashboard-main">
        {error && <div className="error-banner">{error}</div>}

        {activeView === 'dashboard' && summary && (
          <div className="dashboard-content">
            <h1 className="page-title">Dashboard</h1>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span className="stat-label">Total Pacientes</span>
                </div>
                <div className="stat-value">{summary.patients.total}</div>
                <div className="stat-details">
                  <span>Hombres: {summary.patients.male}</span>
                  <span>Mujeres: {summary.patients.female}</span>
                  {summary.patients.other > 0 && <span>Otros: {summary.patients.other}</span>}
                </div>
                <div className="stat-footer">
                  Edad promedio: {summary.patients.average_age} años
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                  <span className="stat-label">Total Diagnósticos</span>
                </div>
                <div className="stat-value">{summary.diagnoses.total}</div>
                <div className="stat-details">
                  <span className="positive">COVID: {summary.diagnoses.covid_positive}</span>
                  <span className="negative">NO COVID: {summary.diagnoses.covid_negative}</span>
                </div>
                <div className="stat-footer">
                  Tasa positiva: {summary.diagnoses.positive_rate}%
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span className="stat-label">Actividad Reciente</span>
                </div>
                <div className="stat-value">{summary.recent_activity.diagnoses_last_7_days}</div>
                <div className="stat-footer">
                  Diagnósticos en los últimos 7 días
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'pacientes' && <Pacientes />}
        {activeView === 'diagnosticos' && <Diagnosticos />}
        {activeView === 'perfil' && <Perfil />}
      </main>
    </div>
  );
}

export default Dashboard;