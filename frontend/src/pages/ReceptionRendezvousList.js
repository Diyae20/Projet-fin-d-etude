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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRendezvous, setSelectedRendezvous] = useState(null);
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

    // Masquer les rendez-vous avec le statut "passe" de la liste de la réception
    filtered = filtered.filter(rv => rv.statut !== 'passe');

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

  const handleDeleteClick = (rv) => {
    setSelectedRendezvous(rv);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRendezvous) return;

    try {
      // Supprimer réellement le rendez-vous
      await api.delete(`/users/reception/rendezvous/${selectedRendezvous.id}/`);
      await fetchRendezvous();
      setShowDeleteModal(false);
      setSelectedRendezvous(null);
    } catch (error) {
      setError('Erreur lors de la suppression du rendez-vous.');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setSelectedRendezvous(null);
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
                      <tr key={rv.id} style={{verticalAlign: 'middle', backgroundColor: rv.priorite === 'urgente' ? '#f8d7da' : rv.type_consultation === 'consultation' ? '#d4edda' : rv.type_consultation === 'suivi' ? '#fff3cd' : 'transparent', borderLeft: rv.priorite === 'urgente' ? '4px solid #dc3545' : 'none'}}>
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
                              onClick={() => handleDeleteClick(rv)}
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

      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '9999'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '30px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.3s ease-in-out'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '1px solid #eee'
            }}>
              <h3 style={{
                margin: '0',
                color: '#333',
                fontSize: '22px',
                fontWeight: '600'
              }}>
                Confirmation de suppression
              </h3>
              <button 
                onClick={handleDeleteCancel}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#999',
                  cursor: 'pointer',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                ×
              </button>
            </div>

            <div style={{marginBottom: '25px'}}>
              <p style={{
                margin: '0 0 20px 0',
                color: '#555',
                fontSize: '16px',
                lineHeight: '1.5'
              }}>
                Êtes-vous sûr de vouloir supprimer ce rendez-vous ?
              </p>

              {selectedRendezvous && (
                <div style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '15px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{
                    marginBottom: '8px',
                    color: '#495057',
                    fontSize: '14px'
                  }}>
                    <strong>Patient:</strong> {selectedRendezvous.patient ? `${selectedRendezvous.patient.first_name} ${selectedRendezvous.patient.last_name}` : 'N/A'}
                  </div>
                  <div style={{
                    marginBottom: '8px',
                    color: '#495057',
                    fontSize: '14px'
                  }}>
                    <strong>Médecin:</strong> {selectedRendezvous.medecin ? `${selectedRendezvous.medecin.first_name} ${selectedRendezvous.medecin.last_name}` : 'N/A'}
                  </div>
                  <div style={{
                    color: '#495057',
                    fontSize: '14px'
                  }}>
                    <strong>Date:</strong> {new Date(selectedRendezvous.date).toLocaleDateString('fr-FR')} à {selectedRendezvous.heure}
                  </div>
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button 
                onClick={handleDeleteCancel}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
              >
                Annuler
              </button>
              <button 
                onClick={handleDeleteConfirm}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionRendezvousList;
