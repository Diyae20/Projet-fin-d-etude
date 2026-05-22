
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Alert from './Alert';
import './CreneauHoraireManager.css';

const CreneauHoraireManager = ({ medecinId }) => {
  const [creneaux, setCreneaux] = useState({
    lundi: { actif: true, heure_debut: '08:00', heure_fin: '18:00' },
    mardi: { actif: true, heure_debut: '08:00', heure_fin: '18:00' },
    mercredi: { actif: true, heure_debut: '08:00', heure_fin: '18:00' },
    jeudi: { actif: true, heure_debut: '08:00', heure_fin: '18:00' },
    vendredi: { actif: true, heure_debut: '08:00', heure_fin: '18:00' },
    samedi: { actif: false, heure_debut: '08:00', heure_fin: '12:00' },
    dimanche: { actif: false, heure_debut: '08:00', heure_fin: '12:00' }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchCreneaux();
  }, [medecinId]);

  const fetchCreneaux = async () => {
    try {
      setLoading(true);
      // Récupérer les informations du médecin pour obtenir ses horaires
      const response = await api.get(`/medecins/${medecinId}/`);
      
      if (response.data) {

        const joursSemaine = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
        const horaires = {};

        joursSemaine.forEach(jour => {
          horaires[jour] = {
            actif: response.data[`${jour}_actif`] !== undefined ? response.data[`${jour}_actif`] : (jour === 'samedi' || jour === 'dimanche' ? false : true),
            heure_debut: response.data[`${jour}_debut`] || '08:00',
            heure_fin: response.data[`${jour}_fin`] || (jour === 'samedi' || jour === 'dimanche' ? '12:00' : '18:00')
          };
        });

        setCreneaux(prev => ({
          ...prev,
          ...horaires
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des créneaux:', error);
      // En cas d'erreur, on garde les valeurs par défaut
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (jour) => {
    setCreneaux(prev => ({
      ...prev,
      [jour]: {
        ...prev[jour],
        actif: !prev[jour].actif
      }
    }));
  };

  const handleTimeChange = (jour, field, value) => {
    setCreneaux(prev => ({
      ...prev,
      [jour]: {
        ...prev[jour],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      // Transformer les données pour l'envoi à l'API
      // On envoie à la fois les champs individuels et l'objet structuré
      const horairesData = {};
      Object.entries(creneaux).forEach(([jour, config]) => {
        horairesData[`${jour}_actif`] = config.actif;
        horairesData[`${jour}_debut`] = config.heure_debut;
        horairesData[`${jour}_fin`] = config.heure_fin;
      });
      
      // Ajouter l'objet horaires structuré pour une utilisation plus facile
      horairesData.horaires = creneaux;

      await api.put(`/users/reception/medecins/${medecinId}/`, horairesData);
      setSuccess('Créneaux horaires mis à jour avec succès!');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des créneaux:', error);
      setError('Erreur lors de la mise à jour des créneaux horaires.');
    } finally {
      setLoading(false);
    }
  };

  const joursSemaine = [
    { id: 'lundi', label: 'Lundi' },
    { id: 'mardi', label: 'Mardi' },
    { id: 'mercredi', label: 'Mercredi' },
    { id: 'jeudi', label: 'Jeudi' },
    { id: 'vendredi', label: 'Vendredi' },
    { id: 'samedi', label: 'Samedi' },
    { id: 'dimanche', label: 'Dimanche' }
  ];

  if (loading) {
    return <div className="text-center mt-3">Chargement des créneaux horaires...</div>;
  }

  return (
    <div className="creneau-horaire-manager mt-4">
      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4>Créneaux horaires</h4>
            {!isEditing && (
              <button
                className="btn btn-primary"
                onClick={() => setIsEditing(true)}
              >
                Modifier
              </button>
            )}
          </div>

          {error && <Alert type="error" message={error} onClose={() => setError('')} />}
          {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Jour</th>
                      <th>Actif</th>
                      <th>Heure de début</th>
                      <th>Heure de fin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {joursSemaine.map(jour => (
                      <tr key={jour.id}>
                        <td>{jour.label}</td>
                        <td>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`actif-${jour.id}`}
                              checked={creneaux[jour.id].actif}
                              onChange={() => handleDayToggle(jour.id)}
                            />
                            <label className="form-check-label" htmlFor={`actif-${jour.id}`}>
                              {creneaux[jour.id].actif ? 'Oui' : 'Non'}
                            </label>
                          </div>
                        </td>
                        <td>
                          <input
                            type="time"
                            className="form-control"
                            value={creneaux[jour.id].heure_debut}
                            onChange={(e) => handleTimeChange(jour.id, 'heure_debut', e.target.value)}
                            disabled={!creneaux[jour.id].actif}
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="time"
                            className="form-control"
                            value={creneaux[jour.id].heure_fin}
                            onChange={(e) => handleTimeChange(jour.id, 'heure_fin', e.target.value)}
                            disabled={!creneaux[jour.id].actif}
                            required
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="d-flex gap-2 mt-4">
                <button type="submit" className="btn btn-success" disabled={loading}>
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsEditing(false);
                    fetchCreneaux();
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Jour</th>
                    <th>Statut</th>
                    <th>Heures</th>
                  </tr>
                </thead>
                <tbody>
                  {joursSemaine.map(jour => (
                    <tr key={jour.id}>
                      <td>{jour.label}</td>
                      <td>
                        {creneaux[jour.id].actif ? (
                          <span className="badge bg-success">Disponible</span>
                        ) : (
                          <span className="badge bg-danger">Non disponible</span>
                        )}
                      </td>
                      <td>
                        {creneaux[jour.id].actif 
                          ? `${creneaux[jour.id].heure_debut} - ${creneaux[jour.id].heure_fin}`
                          : '-'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreneauHoraireManager;
