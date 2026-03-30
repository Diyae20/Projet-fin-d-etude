import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Alert from '../components/Alert';

const ReceptionDashboard = () => {
  const [stats, setStats] = useState({
    total_patients: 0,
    total_medecins: 0,
    total_rendezvous: 0,
    rendezvous_en_attente: 0,
    rendezvous_confirmes: 0,
    rendezvous_annules: 0,
    rendezvous_passe: 0,
    rendezvous_aujourdhui: 0
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/reception/dashboard/');
      setStats(response.data);
    } catch (error) {
      if (error.response && error.response.status === 403) {
        setError('Accès non autorisé. Vous devez être connecté en tant que réception.');
      } else {
        setError('Erreur lors du chargement des statistiques.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-5">Chargement...</div>;
  }

  return (
    <div className="reception-dashboard">
      <div className="container mt-4">
        <h2>Tableau de bord - Réception</h2>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <div className="row mt-4">
          <div className="col-md-3 mb-4">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Total Patients</h5>
                <h2 className="text-primary">{stats.total_patients}</h2>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-4">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Total Médecins</h5>
                <h2 className="text-success">{stats.total_medecins}</h2>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-4">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Total Rendez-vous</h5>
                <h2 className="text-info">{stats.total_rendezvous}</h2>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-4">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Rendez-vous Aujourd'hui</h5>
                <h2 className="text-warning">{stats.rendezvous_aujourdhui}</h2>
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-4 mb-4">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">En Attente</h5>
                <h2 className="text-warning">{stats.rendezvous_en_attente}</h2>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-4">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Confirmés</h5>
                <h2 className="text-success">{stats.rendezvous_confirmes}</h2>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-4">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Annulés</h5>
                <h2 className="text-danger">{stats.rendezvous_annules}</h2>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-4">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Passés</h5>
                <h2 className="text-secondary">{stats.rendezvous_passe || 0}</h2>
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Actions Rapides</h5>
                <div className="d-flex gap-2 flex-wrap">
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate('/reception/users')}
                  >
                    Gérer les Patients
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={() => navigate('/reception/medecins')}
                  >
                    Gérer les Médecins
                  </button>
                  <button
                    className="btn btn-info"
                    onClick={() => navigate('/reception/rendezvous')}
                  >
                    Gérer les Rendez-vous
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionDashboard;
