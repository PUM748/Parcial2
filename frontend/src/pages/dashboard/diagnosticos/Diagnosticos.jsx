import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Diagnosticos.css';

function Diagnosticos() {
  const navigate = useNavigate();
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [filters, setFilters] = useState({
    patient_id: '',
    result: '',
    date_from: '',
    date_to: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    fetchPacientes();
    fetchDiagnosticos();
  }, [page, filters]);

  const fetchPacientes = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const params = new URLSearchParams({ page: '1', per_page: '1000' });
      const response = await fetch(`http://localhost:5000/api/patients/?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPacientes(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDiagnosticos = async () => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: '10'
    });

    if (filters.patient_id) params.append('patient_id', filters.patient_id);
    if (filters.result) params.append('result', filters.result);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);

    try {
      const response = await fetch(`http://localhost:5000/api/diagnoses/?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDiagnosticos(data.data);
        setTotalPages(Math.ceil(data.total / data.per_page));
      } else if (response.status === 401) {
        localStorage.removeItem('access_token');
        navigate('/login');
      } else {
        setError('Error al cargar diagnósticos');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona una imagen válida');
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedPatient || !selectedImage) {
      setError('Debe seleccionar un paciente y una imagen');
      return;
    }

    setUploading(true);
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('image', selectedImage);
    formData.append('patient_id', selectedPatient);

    try {
      const response = await fetch('http://localhost:5000/api/diagnoses/predict', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();


        const patientInfo = pacientes.find(p => p.id === parseInt(selectedPatient));
        const enrichedData = {
          ...data,
          patient_name: patientInfo ? patientInfo.full_name : 'Paciente',
          created_at: new Date().toISOString()
        };

        setAnalysisResult(enrichedData);
        await fetchDiagnosticos();
      } else {
        const data = await response.json();
        setError(data.detail || 'Error al procesar diagnóstico');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const openModal = () => {
    setShowModal(true);
    setSelectedPatient('');
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setError('');
  };

  const closeModal = () => {
    setShowModal(false);
    setAnalysisResult(null);
    setSelectedPatient('');
    setSelectedImage(null);
    setImagePreview(null);
    setError('');
  };

  const viewDiagnosis = (diagnosis) => {
    setSelectedDiagnosis(diagnosis);
  };

  const handleFilterChange = () => {
    setPage(1);
  };

  const handleCleanFilter = () => {
    setFilters({
      patient_id: '',
      result: '',
      date_from: '',
      date_to: ''
    });
    setPage(1);
  };

  if (loading && diagnosticos.length === 0) {
    return <div className="loading">Cargando diagnósticos...</div>;
  }

  return (
    <div className="diagnosticos-container">
      <div className="diagnosticos-header">
        <h2>Diagnósticos</h2>
        <button className="btn-primary" onClick={openModal}>
          + Nuevo Diagnóstico
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filters-section">
        <h3>Filtros</h3>
        <button className="btn-clean-filters" onClick={handleCleanFilter}>Limpiar filtros</button>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Paciente</label>
            <select
              value={filters.patient_id}
              onChange={(e) => {
                setFilters({ ...filters, patient_id: e.target.value });
                handleFilterChange();
              }}
            >
              <option value="">Todos los pacientes</option>
              {pacientes.map(p => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Resultado</label>
            <select
              value={filters.result}
              onChange={(e) => {
                setFilters({ ...filters, result: e.target.value });
                handleFilterChange();
              }}
            >
              <option value="">Todos los resultados</option>
              <option value="COVID">COVID</option>
              <option value="NO COVID">NO COVID</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Desde</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => {
                setFilters({ ...filters, date_from: e.target.value });
                handleFilterChange();
              }}
            />
          </div>

          <div className="filter-group">
            <label>Hasta</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => {
                setFilters({ ...filters, date_to: e.target.value });
                handleFilterChange();
              }}
            />
          </div>
        </div>
      </div>

      <div className="diagnosticos-list">
        {diagnosticos.length === 0 ? (
          <div className="empty-state">
            <p>No hay diagnósticos registrados</p>
            <button className="btn-primary" onClick={openModal}>
              Crear primer diagnóstico
            </button>
          </div>
        ) : (
          <>
            <div className="diagnosticos-grid">
              {diagnosticos.map(diag => (
                <div key={diag.id} className="diagnostico-card">
                  <div className="diagnostico-image">
                    <img src={diag.image_url} alt="Rayos X" />
                  </div>
                  <div className="diagnostico-info">
                    <h4>{diag.patient_name}</h4>
                    <div className="diagnostico-result">
                      <span className={`result-badge ${diag.result === 'COVID' ? 'positive' : 'negative'}`}>
                        {diag.result}
                      </span>
                      <span className="confidence">
                        Confianza: {diag.confidence.toFixed(1)}%
                      </span>
                    </div>
                    <p className="diagnostico-date">
                      {new Date(diag.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <button
                    className="btn-view"
                    onClick={() => viewDiagnosis(diag)}
                  >
                    Ver Detalles
                  </button>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn-secondary"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </button>
                <span className="page-info">
                  Página {page} de {totalPages}
                </span>
                <button
                  className="btn-secondary"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>


      {showModal && (
        <div className="modal-overlay" onClick={() => !uploading && !analysisResult && closeModal()}>
          <div className="modal-content diagnosis-detail" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{analysisResult ? 'Resultado del Diagnóstico' : 'Nuevo Diagnóstico'}</h3>
              <button
                className="modal-close"
                onClick={closeModal}
                disabled={uploading}
              >×</button>
            </div>

            {!analysisResult ? (
              <>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Paciente</label>
                    <select
                      value={selectedPatient}
                      onChange={(e) => setSelectedPatient(e.target.value)}
                      required
                      disabled={uploading}
                    >
                      <option value="">Seleccionar paciente</option>
                      {pacientes.map(p => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Imagen de Rayos X</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      required
                      disabled={uploading}
                    />
                    {imagePreview && (
                      <div className="image-preview">
                        <img src={imagePreview} alt="Preview" width={250} height={200} />
                      </div>
                    )}
                  </div>

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={closeModal}
                      disabled={uploading}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={uploading}
                    >
                      {uploading ? 'Procesando...' : 'Procesar Diagnóstico'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="diagnosis-content">
                  <div className="diagnosis-images">
                    <div className="diagnosis-image-box">
                      <h4>Imagen Original</h4>
                      <img src={analysisResult.image_url} alt="Rayos X Original" />
                    </div>
                    <div className="diagnosis-image-box">
                      <h4>Mapa de Calor</h4>
                      <img src={analysisResult.heatmap_url} alt="Heatmap" />
                    </div>
                  </div>

                  <div className="diagnosis-info-detail">
                    <div className="info-row">
                      <span className="label">Paciente:</span>
                      <span className="value">{analysisResult.patient_name}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Resultado:</span>
                      <span className={`value result-badge ${analysisResult.result === 'COVID' ? 'positive' : 'negative'}`}>
                        {analysisResult.result}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="label">Confianza:</span>
                      <span className="value">{analysisResult.confidence.toFixed(2)}%</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Fecha:</span>
                      <span className="value">
                        {new Date(analysisResult.created_at).toLocaleString('es-ES')}
                      </span>
                    </div>
                    <div className="result-tip">
                      <p className={`value result-badge ${analysisResult.result === 'COVID' ? 'positive' : 'negative'}`}>{analysisResult.result === 'COVID' ? 'El paciente presenta signos COVID-19.' : 'El paciente no presenta signos de COVID-19.'}</p>
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    className="btn-primary"
                    onClick={closeModal}
                  >
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}


      {selectedDiagnosis && (
        <div className="modal-overlay" onClick={() => setSelectedDiagnosis(null)}>
          <div className="modal-content diagnosis-detail" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalles del Diagnóstico</h3>
              <button className="modal-close" onClick={() => setSelectedDiagnosis(null)}>×</button>
            </div>

            <div className="diagnosis-content">
              <div className="diagnosis-images">
                <div className="diagnosis-image-box">
                  <h4>Imagen Original</h4>
                  <img src={selectedDiagnosis.image_url} alt="Rayos X Original" />
                </div>
                <div className="diagnosis-image-box">
                  <h4>Mapa de Calor</h4>
                  <img src={selectedDiagnosis.heatmap_url} alt="Heatmap" />
                </div>
              </div>

              <div className="diagnosis-info-detail">
                <div className="info-row">
                  <span className="label">Paciente:</span>
                  <span className="value">{selectedDiagnosis.patient_name}</span>
                </div>
                <div className="info-row">
                  <span className="label">Resultado:</span>
                  <span className={`value result-badge ${selectedDiagnosis.result === 'COVID' ? 'positive' : 'negative'}`}>
                    {selectedDiagnosis.result}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Confianza:</span>
                  <span className="value">{selectedDiagnosis.confidence.toFixed(2)}%</span>
                </div>
                <div className="info-row">
                  <span className="label">Fecha:</span>
                  <span className="value">
                    {new Date(selectedDiagnosis.created_at).toLocaleString('es-ES')}
                  </span>
                </div>

                <div className="result-tip">
                  <p className={`value result-badge ${selectedDiagnosis.result === 'COVID' ? 'positive' : 'negative'}`}>{selectedDiagnosis.result === 'COVID' ? 'El paciente presenta signos COVID-19.' : 'El paciente no presenta signos de COVID-19.'}</p>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={() => setSelectedDiagnosis(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Diagnosticos;