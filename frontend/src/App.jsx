import { Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import Registro from './pages/auth/Registro';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard'

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <div className="content">
        <div className="icon-wrapper">
          <div className="icon-circle">
            <svg 
              className="icon" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </div>
        </div>

        <h1 className="title">
          SISTEMA WEB INTELIGENTE PARA DIAGNÓSTICO ASISTIDO POR IA
        </h1>

        <p className="subtitle">
          Aplicación web para hospitales que permite a doctores gestionar pacientes y realizar diagnósticos asistidos por inteligencia artificial a partir de imágenes de rayos X.
        </p>

        <div className="info-card">
          <div className="card-content">

            <p className="card-text">
              El objetivo principal es apoyar la toma de decisiones médicas, mostrando tanto el resultado de la predicción como una visualización explicativa (mapa de calor / Grad-CAM).
            </p>
          </div>
        </div>

        <div className="button-group">
          <button 
            className="button button-primary"
            onClick={() => navigate('/registro')}
          >
            Registrarse
          </button>
          <button 
            className="button button-secondary"
            onClick={() => navigate('/login')}
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;