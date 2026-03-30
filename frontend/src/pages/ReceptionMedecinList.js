import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Alert from '../components/Alert';

const ReceptionMedecinList = () => {
  const [medecins, setMedecins] = useState([]);
  const [filteredMedecins, setFilteredMedecins] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [specialiteFilter, setSpecialiteFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMedecins();
  }, []);

  useEffect(() => {
    filterMedecins();
  }, [medecins, searchTerm, specialiteFilter]);

  const fetchMedecins = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/reception/medecins/');
      console.log('Réponse de l\'API médecins:', response.data);
      // Extraire les médecins depuis la propriété results si elle existe (pagination)
      const medecinsData = response.data.results || response.data;
      setMedecins(Array.isArray(medecinsData) ? medecinsData : []);
    } catch (error) {
      if (error.response && error.response.status === 403) {
        setError('Accès non autorisé. Vous devez être connecté en tant que réception.');
      } else {
        setError('Erreur lors du chargement des médecins.');
      }
    } finally {
      setLoading(false);
    }
  };

  const filterMedecins = () => {
    let filtered = medecins;

    if (specialiteFilter !== 'all') {
      filtered = filtered.filter(medecin => {
        const specialite = medecin.specialite || 'Non spécifié';
        return specialite === specialiteFilter;
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(medecin => {
        const nom = medecin.nom_complet || `${medecin.user?.first_name || ''} ${medecin.user?.last_name || ''}`;
        const specialite = medecin.specialite || 'Non spécifié';
        return nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
               specialite.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    setFilteredMedecins(filtered);
  };

  const handleDelete = async (medecinId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce médecin ?')) {
      return;
    }

    try {
      await api.delete(`/users/reception/medecins/${medecinId}/`);
      setMedecins(medecins.filter(medecin => medecin.id !== medecinId));
    } catch (error) {
      setError('Erreur lors de la suppression du médecin.');
    }
  };

  const getSpecialites = () => {
    const specialites = [...new Set(medecins.map(m => m.specialite || 'Non spécifié'))];
    return specialites.sort();
  };

  if (loading) {
    return <div className="text-center mt-5">Chargement...</div>;
  }

  return (
    <div className="reception-medecin-list">
      <div className="container mt-4">
        <h2>Gestion des Médecins</h2>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <div className="row mb-4">
          <div className="col-md-6">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Rechercher par nom ou spécialité..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-6">
            <select
              className="form-control"
              value={specialiteFilter}
              onChange={(e) => setSpecialiteFilter(e.target.value)}
            >
              <option value="all">Toutes les spécialités</option>
              {getSpecialites().map(specialite => (
                <option key={specialite} value={specialite}>
                  {specialite}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            {filteredMedecins.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">Aucun médecin trouvé</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th style={{padding: '15px', minWidth: '150px'}}>Nom</th>
                      <th style={{padding: '15px', minWidth: '200px'}}>Email</th>
                      <th style={{padding: '15px', minWidth: '120px'}}>Téléphone</th>
                      <th style={{padding: '15px', minWidth: '150px'}}>Spécialité</th>
                      <th style={{padding: '15px', minWidth: '150px'}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMedecins.map(medecin => (
                      <tr key={medecin.id} style={{verticalAlign: 'middle'}}>
                        <td style={{padding: '12px 15px'}}>
                          <div style={{fontWeight: '500'}}>
                            {medecin.nom_complet || `${medecin.user?.first_name || ''} ${medecin.user?.last_name || ''}`}
                          </div>
                        </td>
                        <td style={{padding: '12px 15px'}}>{medecin.user?.email || '-'}</td>
                        <td style={{padding: '12px 15px'}}>{medecin.telephone || medecin.user?.phone || '-'}</td>
                        <td style={{padding: '12px 15px'}}>
                          {medecin.specialite ? (
                            <span className="badge bg-primary" style={{fontSize: '0.85em', padding: '6px 12px'}}>
                              {medecin.specialite}
                            </span>
                          ) : (
                            <span style={{color: '#999'}}>Non spécifié</span>
                          )}
                        </td>
                        <td style={{padding: '12px 15px'}}>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => navigate(`/reception/medecins/${medecin.id}`)}
                              style={{minWidth: '60px'}}
                            >
                              Voir
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(medecin.id)}
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

export default ReceptionMedecinList;
