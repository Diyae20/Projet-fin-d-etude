import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Alert from '../components/Alert';

const ReceptionRendezvousList = () => {
  const [rendezvous, setRendezvous] = useState([]);
  const [filteredRendezvous, setFilteredRendezvous] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRendezvous();
  }, []);

  useEffect(() => {
    filterRendezvous();
  }, [rendezvous, filter, searchTerm]);

  const fetchRendezvous = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/reception/rendezvous/');
      console.log('Réponse de l\'API rendezvous:', response.data);
      // Extraire les rendez-vous depuis la propriété results si elle existe (pagination)
      const rendezvousData = response.data.results || response.data;
      setRendezvous(Array.isArray(rendezvousData) ? rendezvousData : []);
    } catch (error) {
      if (error.response && error.response.status === 403) {
        setError('Accès non autorisé. Vous devez être connecté en tant que réception.');
      } else {
        setError('Erreur lors du chargement des rendez-vous.');
      }
    } finally {
      setLoading(false);
    }
  };

  const filterRendezvous = () => {
    let filtered = rendezvous;

    if (filter !== 'all') {
      filtered = filtered.filter(rv => rv.statut === filter);
    }

    if (searchTerm) {
      filtered = filtered.filter(rv => {
        const patientName = rv.patient ? `${rv.patient.first_name || ''} ${rv.patient.last_name || ''}` : '';
        const medecinName = rv.medecin ? `${rv.medecin.first_name || ''} ${rv.medecin.last_name || ''}` : '';
        return patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               medecinName.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    setFilteredRendezvous(filtered);
  };

  const handleDelete = async (rvId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
      return;
    }

    try {
      await api.delete(`/users/reception/rendezvous/${rvId}/`);
      setRendezvous(rendezvous.filter(rv => rv.id !== rvId));
    } catch (error) {
      setError('Erreur lors de la suppression du rendez-vous.');
    }
  };

  const getStatutBadgeClass = (statut) => {
    switch (statut) {
      case 'en_attente':
        return 'warning';
      case 'confirme':
        return 'success';
      case 'annule':
        return 'danger';
      case 'passe':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return <div className="text-center mt-5">Chargement...</div>;
  }

  return (
    <div className="reception-rendezvous-list">
      <div className="container mt-4">
        <h2>Gestion des Rendez-vous</h2>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <div className="row mb-4">
          <div className="col-md-6">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Rechercher par patient ou médecin..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-6">
            <select
              className="form-control"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="confirme">Confirmé</option>
              <option value="annule">Annulé</option>
              <option value="passe">Passé</option>
            </select>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            {filteredRendezvous.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">Aucun rendez-vous trouvé</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th style={{padding: '15px', minWidth: '150px'}}>Patient</th>
                      <th style={{padding: '15px', minWidth: '150px'}}>Médecin</th>
                      <th style={{padding: '15px', minWidth: '200px'}}>Date et Heure</th>
                      <th style={{padding: '15px', minWidth: '120px'}}>Statut</th>
                      <th style={{padding: '15px', minWidth: '150px'}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRendezvous.map(rv => (
                      <tr key={rv.id} style={{verticalAlign: 'middle'}}>
                        <td style={{padding: '12px 15px'}}>
                          <div style={{fontWeight: '500'}}>
                            {rv.patient ? `${rv.patient.first_name || ''} ${rv.patient.last_name || ''}` : 'N/A'}
                          </div>
                        </td>
                        <td style={{padding: '12px 15px'}}>
                          <div style={{fontWeight: '500'}}>
                            {rv.medecin ? `${rv.medecin.first_name || ''} ${rv.medecin.last_name || ''}` : 'N/A'}
                          </div>
                        </td>
                        <td style={{padding: '12px 15px'}}>
                          {new Date(rv.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })} à {rv.heure}
                        </td>
                        <td style={{padding: '12px 15px'}}>
                          <span className={`badge bg-${getStatutBadgeClass(rv.statut)}`} style={{fontSize: '0.85em', padding: '6px 12px'}}>
                            {rv.statut}
                          </span>
                        </td>
                        <td style={{padding: '12px 15px'}}>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => navigate(`/reception/rendezvous/${rv.id}`)}
                              style={{minWidth: '60px'}}
                            >
                              Voir
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(rv.id)}
                              style={{minWidth: '60px'}}
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <button
          className="btn btn-secondary mt-3"
          onClick={() => navigate('/reception/dashboard')}
        >
          Retour au tableau de bord
        </button>
      </div>
    </div>
  );
};

export default ReceptionRendezvousList;
