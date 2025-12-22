import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Pacientes.css';

function Pacientes() {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  // Tamaño de página por defecto y su setter
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: 'M'
  });

  useEffect(() => {
    fetchPacientes();
  }, [page, perPage]);

  const fetchPacientes = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
      const response = await fetch(`http://localhost:5000/api/patients/?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // API devuelve { data: [...], page, pages, per_page, total }
        setPacientes(data.data || []);
        setPage(data.page || 1);
        setPages(data.pages || 1);
        setTotal(data.total || 0);
      } else if (response.status === 401) {
        localStorage.removeItem('access_token');
        navigate('/login');
      } else {
        setError('Error al cargar pacientes');
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

    if (!formData.full_name || !formData.age) {
      setError('Nombre y edad son obligatorios');
      return;
    }

    const token = localStorage.getItem('access_token');
    const url = editingPatient
      ? `http://localhost:5000/api/patients/${editingPatient.id}`
      : 'http://localhost:5000/api/patients/';
    const method = editingPatient ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          age: parseInt(formData.age),
          gender: formData.gender
        })
      });

      if (response.ok) {
        setShowModal(false);
        setFormData({ full_name: '', age: '', gender: 'M' });
        setEditingPatient(null);
        fetchPacientes();
      } else {
        const data = await response.json();
        setError(data.detail || 'Error al guardar paciente');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error(err);
    }
  };

  const handleEdit = (paciente) => {
    setEditingPatient(paciente);
    setFormData({
      full_name: paciente.full_name,
      age: paciente.age.toString(),
      gender: paciente.gender
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este paciente?')) return;

    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(`http://localhost:5000/api/patients/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchPacientes();
      } else {
        setError('Error al eliminar paciente');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error(err);
    }
  };

  const openModal = () => {
    setEditingPatient(null);
    setFormData({ full_name: '', age: '', gender: 'M' });
    setShowModal(true);
    setError('');
  };

  if (loading) {
    return <div className="loading">Cargando pacientes...</div>;
  }

  return (
    <div className="pacientes-container">
      <div className="pacientes-header">
        <h1>Gestión de Pacientes</h1>
        <button className="btn-primary" onClick={openModal}>
          + Nuevo Paciente
        </button>
      </div>

      <div className="pacientes-controls">
        <div className="per-page">
          <label>Mostrar:</label>
          <select value={perPage} onChange={(e) => { setPerPage(parseInt(e.target.value)); setPage(1); }}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span className="total-info">Total: {total}</span>
        </div>
        {pages > 1 && (
          <div className="pagination">
            <button className="btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Anterior
            </button>
            <span className="page-info">Página {page} de {pages}</span>
            <button className="btn-secondary" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>
              Siguiente
            </button>
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="pacientes-controls">
        <div className="search-box">
          <input
            className="search-input"
            type="text"
            placeholder="Buscar paciente por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="pacientes-grid">
        { (pacientes.filter(p => p.full_name.toLowerCase().includes(search.toLowerCase())).length === 0) ? (
          <div className="empty-state">
            <p>No hay pacientes registrados</p>
            <button className="btn-primary" onClick={openModal}>
              Crear primer paciente
            </button>
          </div>
        ) : (
          pacientes
            .filter(p => p.full_name.toLowerCase().includes(search.toLowerCase()))
            .map(paciente => (
            <div key={paciente.id} className="paciente-card">
              <div className="paciente-info">
                <h3>{paciente.full_name}</h3>
                <p>Edad: {paciente.age} años</p>
                <p>Género: {paciente.gender === 'M' ? 'Masculino' : paciente.gender === 'F' ? 'Femenino' : 'Otro'}</p>
              </div>
              <div className="paciente-actions">
                <button className="btn-secondary" onClick={() => handleEdit(paciente)}>
                  Editar
                </button>
                <button className="btn-danger" onClick={() => handleDelete(paciente.id)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPatient ? 'Editar Paciente' : 'Nuevo Paciente'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Nombre Completo</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  placeholder="Ej: Carlos Gómez"
                  required
                />
              </div>

              <div className="form-group">
                <label>Edad</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  placeholder="Ej: 45"
                  min="0"
                  max="150"
                  required
                />
              </div>

              <div className="form-group">
                <label>Género</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="O">Otro</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingPatient ? 'Guardar Cambios' : 'Crear Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Pacientes;