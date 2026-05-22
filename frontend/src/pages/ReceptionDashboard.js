import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Alert from '../components/Alert';
import UrgentNotificationAlert from '../components/UrgentNotificationAlert';

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
  const [patientsWithRendezvous, setPatientsWithRendezvous] = useState([]); 

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/reception/dashboard/');
      setStats(response.data);

       const usersResponse = await api.get('/users/reception/users/');
       const usersData = usersResponse.data.results || usersResponse.data;


      const rendezvousResponse = await api.get('/users/reception/rendezvous/');
      const rendezvousData = rendezvousResponse.data.results || rendezvousResponse.data;


      const patientsMap = new Map();

      if (Array.isArray(usersData)) {
        usersData.forEach(user => {
          if (user.role === 'patient' && user.visible_for_reception) {
            patientsMap.set(user.id, {
              ...user,
              medecin: null
            });
          }
        });
      }

      if (Array.isArray(rendezvousData)) {
        rendezvousData.forEach(rdv => {
          if (rdv.patient && rdv.patient.id && patientsMap.has(rdv.patient.id)) {
            const patient = patientsMap.get(rdv.patient.id);

            if (rdv.medecin) {
              patientsMap.set(rdv.patient.id, {
                ...patient,
                medecin: rdv.medecin
              });
            }
          }
        });
      }

      const patients = Array.from(patientsMap.values());
      setPatientsWithRendezvous(patients);

      setStats(prevStats => ({
        ...prevStats,
        total_patients: patients.length
      }));
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
      <UrgentNotificationAlert />
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

          <div className="col-md-6 mb-4">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Annulés</h5>
                <h2 className="text-danger">{stats.rendezvous_annules}</h2>
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
