import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { rendezvousService } from '../services/rendezvousService';
import notePatientService from '../services/notePatientService';
import api from '../services/api';
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
  const [currentPatientId, setCurrentPatientId] = useState(null);
  const [patientRendezvous, setPatientRendezvous] = useState([]);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedRendezvous, setSelectedRendezvous] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    setError('');

    try {
      // Récupérer directement les patients associés au médecin connecté
      const response = await api.get('/medecins/patients/');
      const patientsData = response.data.results || response.data;

      if (Array.isArray(patientsData)) {
        // Récupérer toutes les notes du médecin
        const notesResult = await notePatientService.getNotes();
        const notes = notesResult.success ? notesResult.data : [];

        // Transformer les données pour correspondre au format attendu
        const patients = patientsData.map(patient => {
          // Vérifier si ce patient a des notes
          const patientNotes = notes.filter(note => note.patient.id === patient.id);
          
          return {
            id: patient.id,
            nom: patient.last_name || 'Non renseigné',
            prenom: patient.first_name || 'Non renseigné',
            email: patient.email || 'Non renseigné',
            phone: patient.phone || 'Non renseigné',
            rendezvous_count: patient.rendezvous_count || 0,
            dernier_rendezvous: null, // Sera mis à jour si nécessaire
            dernier_statut: null, // Sera mis à jour si nécessaire
            hasNotes: patientNotes.length > 0 && patientNotes[0].contenu && patientNotes[0].contenu.trim() !== '' // Vérifier si le patient a des notes avec du contenu
          };
        });

        console.log('Patients récupérés:', patients);
        setPatients(patients);
      } else {
        setError('Format de données invalide');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des patients:', error);
      setError(error.response?.data?.detail || 'Erreur lors de la récupération des patients');
    } finally {
      setLoading(false);
    }
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
        rdv => {
          // Vérifier si rdv.patient est un objet ou un ID
          const patientId = typeof rdv.patient === 'object' ? rdv.patient.id : rdv.patient;
          return patientId === patient.id;
        }
      );
      // Trier par date décroissante
      patientRdv.sort((a, b) => new Date(b.date) - new Date(a.date));
      setPatientRendezvous(patientRdv);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleOpenNotesForPatient = async (patient) => {
    setLoading(true);
    setError('');

    // Stocker l'ID du patient pour la mise à jour ultérieure
    setCurrentPatientId(patient.id);

    // Récupérer les notes pour ce patient
    const result = await notePatientService.getNotes(patient.id);

    if (result.success) {
      const notes = result.data;
      // Vérifier s'il y a des notes
      if (notes.length > 0) {
        // Prendre la première note (la plus récente)
        const note = notes[0];
        
        // Ouvrir la modal de notes avec la note existante
        handleOpenNotesModal(note);
      } else {
        // Ouvrir la modal de notes avec une note vide
        handleOpenNotesModal({ id: null, contenu: '' });
      }
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleOpenNotesModal = (note) => {
    setSelectedRendezvous(note);
    setNoteText(note.contenu || '');
    setIsEditingNotes(true); // Toujours en mode édition
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

    let result;
    // Si la note a déjà un ID, on la met à jour
    if (selectedRendezvous.id) {
      result = await notePatientService.updateNote(
        selectedRendezvous.id,
        noteText
      );
    } else {
      // Sinon, on crée une nouvelle note
      result = await notePatientService.createOrUpdateNote(
        currentPatientId,
        noteText
      );
    }

    if (result.success) {
      setSuccess('Notes enregistrées avec succès !');
      // Mettre à jour la propriété hasNotes du patient en cours de modification
      if (currentPatientId) {
        setPatients(prevPatients =>
          prevPatients.map(p =>
            p.id === currentPatientId
              ? { ...p, hasNotes: true }
              : p
          )
        );
      }
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
          <div className="search-container" style={{margin: '20px 0'}}>
            <input
              type="text"
              className="form-control"
              placeholder="Rechercher par nom"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{maxWidth: '400px', padding: '10px', borderRadius: '5px', border: '1px solid #ddd'}}
            />
          </div>
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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.filter(patient => {
                    if (!searchTerm) return true;
                    const fullName = `${patient.prenom} ${patient.nom}`.toLowerCase();
                    return fullName.includes(searchTerm.toLowerCase());
                  }).map(patient => (
                    <tr key={patient.id}>
                      <td>{patient.prenom} {patient.nom}</td>
                      <td>{patient.email}</td>
                      <td>{patient.phone || 'Non renseigné'}</td>
                      <td>{patient.rendezvous_count}</td>
                      <td>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleOpenNotesForPatient(patient)}
                        >
                          {patient.hasNotes ? 'Modifier la Note' : 'Ajouter une Note'}
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
                      <div className="rendezvous-patient">
                        👤 {rdv.patient_prenom} {rdv.patient_nom}
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
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Notes de consultation</h3>
              <button className="close-modal" onClick={handleCloseNotesModal}>x</button>
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
