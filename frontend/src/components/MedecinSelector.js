
import React, { useState, useEffect } from 'react';
import { medecinService } from '../services/medecinService';
import Loading from './Loading';
import './MedecinSelector.css';

const MedecinSelector = ({ onMedecinSelect }) => {
  const [medecins, setMedecins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMedecins();
  }, []);

  const fetchMedecins = async () => {
    setLoading(true);
    setError('');

    const result = await medecinService.getMedecins();

    if (result.success) {
      setMedecins(result.data.results || result.data);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  if (loading) {
    return <Loading message="Chargement des médecins..." />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="medecin-selector">
      <h3>Choisissez un médecin</h3>
      {medecins.length === 0 ? (
        <p>Aucun médecin disponible pour le moment.</p>
      ) : (
        <div className="medecin-list">
          {medecins.map(medecin => (
            <div
              key={medecin.id}
              className="medecin-card"
              onClick={() => onMedecinSelect(medecin)}
            >
              <div className="medecin-info">
                <div className="medecin-name">Dr. {medecin.user.first_name} {medecin.user.last_name}</div>
                <div className="medecin-specialite">{medecin.specialite || 'Non spécifié'}</div>
                <div className="medecin-ville">{medecin.ville || 'Non spécifié'}</div>
              </div>
              <div className="medecin-action">
                <button className="btn btn-primary">Sélectionner</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedecinSelector;
