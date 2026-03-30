import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { rendezvousService } from '../services/rendezvousService';
import Loading from '../components/Loading';
import Alert from '../components/Alert';

const MedecinPatients = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientRendezvous, setPatientRendezvous] = useState([]);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedRendezvous, setSelectedRendezvous] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    setError('');

    // Récupérer tous les rendez-vous du médecin
    let allRendezvous = [];

    // Récupérer la première page
    let result = await rendezvousService.getMedecinRendezvous();

    if (result.success) {
      let rendezvousList = result.data.results || result.data;

      if (Array.isArray(rendezvousList)) {
        allRendezvous = [...allRendezvous, ...rendezvousList];
      }

      // Récupérer les pages suivantes si elles existent
      while (result.data.next) {
        // Extraire l'URL de la page suivante
        const nextUrl = result.data.next;
        result = await rendezvousService.getMedecinRendezvousByUrl(nextUrl);

        if (result.success) {
          rendezvousList = result.data.results || result.data;

          if (Array.isArray(rendezvousList)) {
            allRendezvous = [...allRendezvous, ...rendezvousList];
          }
        } else {
          setError(result.error);
          break;
        }
      }
    } else {
      setError(result.error);
    }

    console.log('Tous les rendez-vous récupérés:', allRendezvous);

    // Extraire les patients uniques de tous les rendez-vous
    const patientsMap = new Map();
    allRendezvous.forEach(rdv => {
      if (!patientsMap.has(rdv.patient)) {
        patientsMap.set(rdv.patient, {
          id: rdv.patient,
          nom: rdv.patient_nom,
          prenom: rdv.patient_prenom,
          email: rdv.patient_email,
          phone: rdv.patient_phone,
          rendezvous_count: 1,
          dernier_rendezvous: rdv.date,
          dernier_statut: rdv.statut
        });
      } else {
        const patient = patientsMap.get(rdv.patient);
        patient.rendezvous_count += 1;
        // Mettre à jour le dernier rendez-vous si nécessaire
        if (new Date(rdv.date) > new Date(patient.dernier_rendezvous)) {
          patient.dernier_rendezvous = rdv.date;
          patient.dernier_statut = rdv.statut;
        }
      }
    });

    console.log('Patients extraits:', Array.from(patientsMap.values()));
    setPatients(Array.from(patientsMap.values()));
    setLoading(false);
  };

  const handlePatientClick = async (patient) => {
    setSelectedPatient(patient);
    setLoading(true);
    setError('');

    // Récupérer tous les rendez-vous de ce patient avec ce médecin
    const result = await rendezvousService.getMedecinRendezvous();

    if (result.success) {
      // Filtrer les rendez-vous pour ce patient spécifique
      const patientRdv = (result.data.results || result.data).filter(
        rdv => rdv.patient === patient.id
      );
      // Trier par date décroissante
      patientRdv.sort((a, b) => new Date(b.date) - new Date(a.date));
      setPatientRendezvous(patientRdv);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleOpenNotesModal = (rendezvous) => {
    setSelectedRendezvous(rendezvous);
    setNoteText(rendezvous.notes || '');
    setIsEditingNotes(!rendezvous.notes); // Mode édition seulement si pas de notes
    setShowNotesModal(true);
  };

  const handleCloseNotesModal = () => {
    setShowNotesModal(false);
    setSelectedRendezvous(null);
    setNoteText('');
    setIsEditingNotes(false);
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    const result = await rendezvousService.updateRendezvousNotes(
      selectedRendezvous.id,
      { notes: noteText }
    );

    if (result.success) {
      setSuccess('Notes enregistrées avec succès !');
      // Mettre à jour les rendez-vous affichés
      setPatientRendezvous(prevRdv =>
        prevRdv.map(rdv =>
          rdv.id === selectedRendezvous.id
            ? { ...rdv, notes: noteText }
            : rdv
        )
      );
      // Fermer la modal après l'enregistrement
      handleCloseNotesModal();
    } else {
      setError(result.error);
    }

    setSaving(false);
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

  if (loading && !selectedPatient) {
    return <Loading message="Chargement de vos patients..." />;
  }

  return (
    <div className="medecin-patients">
      <h1>Mes Patients</h1>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {!selectedPatient ? (
        <div className="patients-list">
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard/medecin')}>
            ← Retour au Tableau de bord - Médecin
          </button>
          {patients.length === 0 ? (
            <p>Vous n'avez pas encore de patients.</p>
          ) : (
            <div className="card">
              <h2>Liste de vos patients</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Nombre de rendez-vous</th>
                    <th>Dernier rendez-vous</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map(patient => (
                    <tr key={patient.id}>
                      <td>{patient.prenom} {patient.nom}</td>
                      <td>{patient.email}</td>
                      <td>{patient.phone || 'Non renseigné'}</td>
                      <td>{patient.rendezvous_count}</td>
                      <td>{new Date(patient.dernier_rendezvous).toLocaleDateString('fr-FR')}</td>
                      <td>
                        <span className={`rendezvous-statut ${getStatutClass(patient.dernier_statut)}`}>
                          {getStatutLabel(patient.dernier_statut)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-primary"
                          onClick={() => handlePatientClick(patient)}
                        >
                          Voir les détails
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="patient-details">
          <button className="btn btn-secondary" onClick={() => setSelectedPatient(null)}>
            ← Retour à la liste des patients
          </button>

          <div className="card">
            <h2>Détails du patient: {selectedPatient.prenom} {selectedPatient.nom}</h2>
            <div className="patient-info">
              <p><strong>Email:</strong> {selectedPatient.email}</p>
              <p><strong>Téléphone:</strong> {selectedPatient.phone || 'Non renseigné'}</p>
              <p><strong>Nombre total de rendez-vous:</strong> {selectedPatient.rendezvous_count}</p>
            </div>

            <h3>Historique des rendez-vous</h3>
            {patientRendezvous.length === 0 ? (
              <p>Aucun rendez-vous trouvé pour ce patient.</p>
            ) : (
              <div className="rendezvous-history">
                {patientRendezvous.map(rdv => (
                  <div key={rdv.id} className="rendezvous-item">
                    <div className="rendezvous-info">
                      <div className="rendezvous-date">
                        📅 {new Date(rdv.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })} à {rdv.heure}
                      </div>
                      {rdv.motif && (
                        <div className="rendezvous-motif">
                          📝 Motif: {rdv.motif}
                        </div>
                      )}
                      <span className={`rendezvous-statut ${getStatutClass(rdv.statut)}`}>
                        {getStatutLabel(rdv.statut)}
                      </span>
                    </div>

                    {/* Les notes ne sont plus affichées ici, seulement accessibles via le bouton "Voir notes" */}

                    <button
                      className="btn btn-primary"
                      onClick={() => handleOpenNotesModal(rdv)}
                    >
                      {rdv.notes ? 'Voir notes' : 'Ajouter des notes'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showNotesModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Notes de consultation</h3>
              <button className="close-modal" onClick={handleCloseNotesModal}>×</button>
            </div>
            <div className="modal-body">
              <p>
                Date du rendez-vous: {new Date(selectedRendezvous.date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })} à {selectedRendezvous.heure}
              </p>
              {selectedRendezvous.motif && (
                <p><strong>Motif:</strong> {selectedRendezvous.motif}</p>
              )}
              <div className="form-group">
                <label htmlFor="notes">Notes du médecin:</label>
                {isEditingNotes ? (
                  <textarea
                    id="notes"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows="10"
                    placeholder="Décrivez ce que vous avez fait lors de cette consultation..."
                  />
                ) : (
                  <div className="notes-display">
                    {noteText || "Aucune note enregistrée"}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={handleCloseNotesModal}
                disabled={saving}
              >
                Annuler
              </button>
              {isEditingNotes ? (
                <button
                  className="btn btn-primary"
                  onClick={handleSaveNotes}
                  disabled={saving}
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => setIsEditingNotes(true)}
                  disabled={saving}
                >
                  Modifier
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedecinPatients;
