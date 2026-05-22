import React, { useState, useEffect } from 'react';
import { rendezvousService } from '../services/rendezvousService';
import { useAuth } from '../contexts/AuthContext';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import './PatientRendezvousHistory.css';

const PatientRendezvousHistory = () => {
  const { user } = useAuth();
  const [rendezvous, setRendezvous] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRendezvousHistory();
  }, []);

  const fetchRendezvousHistory = async () => {
    setLoading(true);
    setError('');

    try {
      // Récupérer tous les rendez-vous du patient
      const result = await rendezvousService.getRendezvous();

      if (result.success) {
        const allRendezvous = result.data.results || result.data;

        // Filtrer pour ne garder que les rendez-vous avec le statut "passé"
        const historyRendezvous = allRendezvous.filter(rdv => 
          rdv.statut === 'passe'
        );

        // Trier les rendez-vous par date décroissante
        historyRendezvous.sort((a, b) => new Date(b.date) - new Date(a.date));

        setRendezvous(historyRendezvous);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Erreur lors du chargement de l'historique des rendez-vous");
    } finally {
      setLoading(false);
    }
  };

  const getStatutClass = (statut) => {
    switch (statut) {
      case 'confirme':
        return 'statut-confirme';
      case 'annule':
        return 'statut-annule';
      case 'en_attente':
        return 'statut-en_attente';
      case 'passe':
        return 'statut-passe';
      default:
        return '';
    }
  };

  const getStatutLabel = (statut) => {
    switch (statut) {
      case 'confirme':
        return 'Confirmé';
      case 'annule':
        return 'Annulé';
      case 'en_attente':
        return 'En attente';
      case 'passe':
        return 'Passé';
      default:
        return statut;
    }
  };

  const handleDeleteRendezvous = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ? Cette action est irréversible.')) {
      return;
    }

    try {
      const result = await rendezvousService.deleteRendezvous(id);

      if (result.success) {
        setSuccess('Rendez-vous supprimé avec succès');
        // Rafraîchir la liste des rendez-vous
        fetchRendezvousHistory();
        // Masquer le message de succès après 3 secondes
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Erreur lors de la suppression du rendez-vous');
      }
    } catch (err) {
      setError('Erreur lors de la suppression du rendez-vous');
    }
  };

  if (loading) {
    return <Loading message="Chargement de l\'historique des rendez-vous..." />;
  }

  return (
    <div className="rendezvous-history">
      <h1>Historique des rendez-vous passés</h1>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <div className="card">
        {rendezvous.length === 0 ? (
          <p>Vous n'avez pas encore de rendez-vous passés.</p>
        ) : (
          <div className="rendezvous-list">
            {rendezvous.map(rdv => (
              <div key={rdv.id} className="rendezvous-item" style={{backgroundColor: rdv.type_consultation === 'consultation' ? '#d4edda' : rdv.type_consultation === 'suivi' ? '#fff3cd' : 'transparent'}}>
                <div className="rendezvous-info">
                  <div className="rendezvous-date">
                    📅 {new Date(rdv.date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })} à {rdv.heure}
                  </div>
                  <div className="rendezvous-medecin">
                    👨‍⚕️ Dr. {rdv.medecin ? `${rdv.medecin.first_name} ${rdv.medecin.last_name}` : rdv.medecin_nom || 'N/A'}
                  </div>
                  {rdv.type_consultation === 'consultation' && (
                    <div className="rendezvous-motif">
                      📋 Consultation
                    </div>
                  )}
                  {rdv.type_consultation === 'suivi' && (
                    <div className="rendezvous-motif">
                      📋 Suivi
                    </div>
                  )}
                  <span className={`rendezvous-statut ${getStatutClass(rdv.statut)}`}>
                    {getStatutLabel(rdv.statut)}
                  </span>
                </div>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteRendezvous(rdv.id)}
                  title="Supprimer ce rendez-vous"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientRendezvousHistory;
