import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { medecinService } from '../services/medecinService';
import { rendezvousService } from '../services/rendezvousService';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import './MedecinList.css';

// Suggestions pré-définies pour chaque type de bouton
const suggestionsPredefinies = {
  vert: [
    { id: 'v1', text: 'Consultation', description: 'Consultation dentaire générale' }
  ],
  jaune: [
    { id: 'j1', text: 'Suivi post-traitement', description: 'Après un traitement (plombage, couronne, extraction), le patient a mal ou des sensations inhabituelles qui ne sont pas urgentes mais nécessitent un contrôle' },
    { id: 'j2', text: 'Ajustement d\'appareil', description: 'Le patient a un appareil dentaire (orthodontie, prothèse) qui gêne ou blesse légèrement' },
    { id: 'j3', text: 'Douleur légère à modérée', description: 'Le patient ressent une douleur supportable qui n\'empêche pas ses activités quotidiennes' },
    { id: 'j4', text: 'Question sur un traitement en cours', description: 'Le patient a des interrogations sur son traitement ou des effets secondaires mineurs' },
    { id: 'j5', text: 'Sensibilité dentaire', description: 'Sensibilité au chaud/froid ou sucré qui apparaît progressivement' },
    { id: 'j6', text: 'Petite complication', description: 'Une petite fissure, un écaillage de plombage qui ne cause pas de douleur intense' },
    { id: 'j7', text: 'Sensibilité dentaire', description: 'Douleur légère lors de la consommation d\'aliments chauds/froids ou sucrés' },
    { id: 'j8', text: 'Gêne après traitement', description: 'Sensation d\'inconfort après un plombage, couronne ou dévitalisation' },
    { id: 'j9', text: 'Petite fracture', description: 'Une petite partie de la dent s\'est cassée mais sans douleur intense' },
    { id: 'j10', text: 'Plombage décollé', description: 'Un plombage est parti mais sans douleur intense' },
    { id: 'j11', text: 'Gencives qui saignent légèrement', description: 'Saignement mineur lors du brossage' },
    { id: 'j12', text: 'Mauvaise haleine persistante', description: 'Problème d\'halitose qui incommode le patient' },
    { id: 'j13', text: 'Petit kyste ou aphte', description: 'Légère gêne mais pas de douleur intense' },
    { id: 'j14', text: 'Question sur un médicament', description: 'Le patient a des questions sur les médicaments prescrits' },
    { id: 'j15', text: 'Douleur légère à la mâchoire', description: 'Légère tension ou douleur à la mâchoire, peut-être liée à l\'articulation' }
  ],
  rouge: [
    { id: 'r1', text: 'Douleur intense et insupportable', description: 'Douleur aiguë qui empêche le patient de dormir ou de vaquer à ses activités normales' },
    { id: 'r2', text: 'Traumatisme dentaire', description: 'Dent cassée, arrachée ou déplacée suite à un choc' },
    { id: 'r3', text: 'Infection avancée', description: 'Gonflement important du visage, fièvre, douleur pulsatile, signes d\'abcès' },
    { id: 'r4', text: 'Saignement important', description: 'Saignement qui ne s\'arrête pas après une extraction ou un traumatisme' },
    { id: 'r5', text: 'Réaction allergique sévère', description: 'Gonflement des lèvres, de la langue, difficulté à respirer suite à un traitement ou médicament' },
    { id: 'r6', text: 'Douleur accompagnée de fièvre', description: 'Douleur dentaire avec fièvre élevée, signe d\'une infection qui se propage' },
    { id: 'r7', text: 'Dent cassée avec nerf exposé', description: 'Fracture importante avec douleur vive' },
    { id: 'r8', text: 'Abcès dentaire', description: 'Infection purulente avec gonflement du visage' },
    { id: 'r9', text: 'Hémorragie importante', description: 'Saignement continu qui ne s\'arrête pas après une extraction' },
    { id: 'r10', text: 'Gonflement important du visage', description: 'Œdème significatif qui peut affecter la respiration ou la déglutition' },
    { id: 'r11', text: 'Fièvre élevée avec douleur dentaire', description: 'Signe d\'une infection qui se propage' },
    { id: 'r12', text: 'Couronne ou bridge tombé', description: 'Prothèse qui est tombée avec douleur intense' },
    { id: 'r13', text: 'Douleur irradiante', description: 'Douleur qui se propage à l\'oreille, au cou ou à la tête' },
    { id: 'r14', text: 'Difficulté à ouvrir la bouche', description: 'Trismus important empêchant d\'ouvrir la bouche normalement' },
    { id: 'r15', text: 'Perte de sensation', description: 'Engourdissement ou perte de sensibilité après un traitement' }
  ]
};

const MedecinList = () => {
  const { user } = useAuth();
  const [medecins, setMedecins] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  const [userRendezvous, setUserRendezvous] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    specialite: '',
    ville: '',
    search: '',
    nom: '',
    prenom: ''
  });
  const [advancedFilters, setAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState('nom');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedMedecin, setSelectedMedecin] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false); // État pour la modale des suggestions
  const [selectedPriorityType, setSelectedPriorityType] = useState(''); // Type de priorité sélectionnée (vert, jaune, rouge)

  useEffect(() => {
    fetchMedecins();
    fetchSpecialites();
  }, [filters, sortBy, sortOrder]);

  useEffect(() => {
    if (user) {
      fetchUserRendezvous();
    }
  }, [user]);

  const fetchUserRendezvous = async () => {
    try {
      const result = await rendezvousService.getRendezvous();
      if (result.success) {
        setUserRendezvous(result.data.results || result.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des rendez-vous:", error);
    }
  };

  const fetchMedecins = async () => {
    setLoading(true);
    setError('');

    const result = await medecinService.getMedecins(filters);

    if (result.success) {
      // L'API retourne un objet avec pagination (results et count) ou un tableau direct
      let medecinsData = result.data.results || result.data;
      // S'assurer que c'est un tableau
      medecinsData = Array.isArray(medecinsData) ? medecinsData : [];

      // Trier les médecins
      medecinsData = sortMedecins(medecinsData, sortBy, sortOrder);

      setMedecins(medecinsData);
    } else {
      setError(result.error);
      setMedecins([]);
    }

    setLoading(false);
  };

  const sortMedecins = (medecins, sortBy, sortOrder) => {
    return [...medecins].sort((a, b) => {
      let valueA, valueB;

      switch (sortBy) {
        case 'nom':
          valueA = a.nom || '';
          valueB = b.nom || '';
          break;
        case 'specialite':
          valueA = a.specialite?.nom || '';
          valueB = b.specialite?.nom || '';
          break;
        case 'ville':
          valueA = a.ville || '';
          valueB = b.ville || '';
          break;
        default:
          valueA = a.nom || '';
          valueB = b.nom || '';
      }

      if (sortOrder === 'asc') {
        return valueA.localeCompare(valueB);
      } else {
        return valueB.localeCompare(valueA);
      }
    });
  };

  const fetchSpecialites = async () => {
    const result = await medecinService.getSpecialites();
    if (result.success) {
      // L'API peut retourner un objet avec pagination ou un tableau direct
      const specialitesData = result.data.results || result.data;
      // S'assurer que c'est un tableau
      setSpecialites(Array.isArray(specialitesData) ? specialitesData : []);
    } else {
      setSpecialites([]);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const toggleAdvancedFilters = () => {
    setAdvancedFilters(!advancedFilters);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const resetFilters = () => {
    setFilters({
      specialite: '',
      ville: '',
      search: '',
      nom: '',
      prenom: ''
    });
    setSortBy('nom');
    setSortOrder('asc');
  };

  const handleBookAppointment = (medecin, priority) => {
    // Définir le type de priorité en fonction de la valeur
    let priorityType = '';
    if (priority === 'basse') priorityType = 'vert';
    else if (priority === 'moyenne') priorityType = 'jaune';
    else if (priority === 'urgente') priorityType = 'rouge';
    
    setSelectedMedecin(medecin);
    setSelectedPriorityType(priorityType);
    setShowSuggestionsModal(true);
  };
  
  const handleAutoBooking = async () => {
  if (!selectedMedecin) return;

  setLoadingBooking(true);
  setBookingError('');
  setBookingSuccess('');

  try {
    // Trouver le premier créneau disponible à partir de 3 jours
    const inThreeDays = new Date();
    inThreeDays.setDate(inThreeDays.getDate() + 3);

    const slot = await findFirstAvailableSlot(selectedMedecin.id, inThreeDays);

    if (!slot) {
      setBookingError('Aucun créneau disponible dans 3 jours pour ce médecin.');
      setLoadingBooking(false);
      return;
    }

    // Déterminer la priorité en fonction du type sélectionné
    let priority = 'basse';
    if (selectedPriorityType === 'jaune') priority = 'moyenne';
    else if (selectedPriorityType === 'rouge') priority = 'urgente';

    // Créer le rendez-vous avec la priorité sélectionnée
    const rendezvousData = {
      medecin_id: selectedMedecin.user.id,
      patient_id: user.id,
      date: slot.date,
      heure: slot.heure,
      type_consultation: 'consultation',
      priorite: priority
    };
    
    const result = await rendezvousService.createRendezvous(rendezvousData);

    if (result.success) {
      setBookingSuccess(`Rendez-vous créé avec succès pour le ${slot.date} à ${slot.heure} !`);
      // Fermer le modal après un délai
      setTimeout(() => {
        setShowSuggestionsModal(false);
        setBookingSuccess('');
      }, 3000);
    } else {
      setBookingError(result.error || 'Erreur lors de la création du rendez-vous.');
    }
  } catch (error) {
    setBookingError('Une erreur est survenue lors de la création du rendez-vous.');
  } finally {
    setLoadingBooking(false);
  }
};

const handleCloseSuggestionsModal = () => {
  setShowSuggestionsModal(false);
  setSelectedMedecin(null);
  setSelectedPriorityType('');
  setBookingError('');
  setBookingSuccess('');
};

  const formatDateForAPI = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const findFirstAvailableSlot = async (medecinId, startDate) => {
    // Chercher le premier créneau disponible dans les 3 prochains jours
    const maxDays = 3;
    let currentDate = new Date(startDate);

    for (let day = 0; day < maxDays; day++) {
      // Ignorer les dimanches (jour 0 de la semaine)
      if (currentDate.getDay() === 0) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      const formattedDate = formatDateForAPI(currentDate);
      const result = await rendezvousService.getCreneauxDisponibles(medecinId, formattedDate);

      if (result.success && result.data.creneaux && result.data.creneaux.length > 0) {
        // Retourner le premier créneau disponible de ce jour
        const firstCreneau = result.data.creneaux[0];
        return {
          date: formattedDate,
          heure: typeof firstCreneau === 'object' ? firstCreneau.heure : firstCreneau
        };
      }

      // Passer au jour suivant
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Aucun créneau trouvé
    return null;
  };

  return (
    <div className="medecin-list">
      <h1>Trouver un médecin</h1>
      <p className="text-muted" style={{ marginBottom: '20px' }}>
        Recherchez un médecin par spécialité, ville ou nom pour prendre rendez-vous.
      </p>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="form-group">
          <label htmlFor="search">Rechercher</label>
          <input
            type="text"
            id="search"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Nom du médecin ou spécialité"
          />
        </div>

        <div className="form-group">
          <label htmlFor="specialite">Spécialité</label>
          <select
            id="specialite"
            name="specialite"
            value={filters.specialite}
            onChange={handleFilterChange}
          >
            <option value="">Toutes les spécialités</option>
            {specialites.map(specialite => (
              <option key={specialite.id} value={specialite.id}>
                {specialite.nom}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="ville">Ville</label>
          <input
            type="text"
            id="ville"
            name="ville"
            value={filters.ville}
            onChange={handleFilterChange}
            placeholder="Ville"
          />
        </div>

        <div className="form-group">
          <button 
            className="btn btn-secondary" 
            onClick={toggleAdvancedFilters}
            style={{ marginRight: '10px' }}
          >
            {advancedFilters ? 'Masquer les filtres avancés' : 'Afficher les filtres avancés'}
          </button>
          <button 
            className="btn btn-outline-secondary" 
            onClick={resetFilters}
          >
            Réinitialiser les filtres
          </button>
        </div>

        {advancedFilters && (
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <h3>Filtres avancés</h3>
            <div className="form-group">
              <label htmlFor="nom">Nom</label>
              <input
                type="text"
                id="nom"
                name="nom"
                value={filters.nom}
                onChange={handleFilterChange}
                placeholder="Nom du médecin"
              />
            </div>

            <div className="form-group">
              <label htmlFor="prenom">Prénom</label>
              <input
                type="text"
                id="prenom"
                name="prenom"
                value={filters.prenom}
                onChange={handleFilterChange}
                placeholder="Prénom du médecin"
              />
            </div>
          </div>
        )}

        <div className="form-group" style={{ marginTop: '20px' }}>
          <label htmlFor="sortBy">Trier par</label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <select
              id="sortBy"
              name="sortBy"
              value={sortBy}
              onChange={handleSortChange}
              style={{ marginRight: '10px', flex: 1 }}
            >
              <option value="nom">Nom</option>
              <option value="specialite">Spécialité</option>
              <option value="ville">Ville</option>
            </select>
            <button 
              className="btn btn-outline-secondary" 
              onClick={toggleSortOrder}
            >
              {sortOrder === 'asc' ? '↑ Croissant' : '↓ Décroissant'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <Loading message="Chargement des médecins..." />
      ) : (
        <div className="medecin-grid">
          {medecins.length === 0 ? (
            <div className="card">
              <p>Aucun médecin trouvé.</p>
            </div>
          ) : (
            medecins.map(medecin => (
              <div key={medecin.id} className="medecin-card">
                <div className="medecin-info">
                  <h3 className="medecin-name">
                    <Link to={`/medecins/${medecin.id}`}>
                      {medecin.nom_complet}
                    </Link>
                  </h3>
                  <p className="medecin-specialite">{medecin.specialite || 'Non spécifié'}</p>
                  {medecin.ville && (
                    <p className="medecin-details">📍 {medecin.ville}</p>
                  )}
                  {medecin.adresse_cabinet && (
                    <p className="medecin-details">🏥 {medecin.adresse_cabinet}</p>
                  )}
                </div>
                <div className="medecin-actions">
                  <div className="priority-buttons">
                    {/* Bouton vert (Consultation) - affiché seulement si le médecin a configuré des suggestions pour le bouton vert */}
                    {medecin.suggestions_config && medecin.suggestions_config.vert && medecin.suggestions_config.vert.length > 0 && (
                      <button
                        className="priority-button priority-button-low"
                        onClick={() => handleBookAppointment(medecin, 'basse')}
                        title="Prendre rendez-vous pour une consultation de routine"
                        >
                          <span className="priority-icon">📅</span>
                           <span className="priority-text">Consultation</span>
                        </button>
                    )}

                      {/* Bouton jaune (Suivi) - affiché seulement si le médecin a configuré des suggestions pour le bouton jaune ET que le patient a déjà eu des rendez-vous */}
                      {medecin.suggestions_config && medecin.suggestions_config.jaune && medecin.suggestions_config.jaune.length > 0 && userRendezvous.length > 0 && (
                        <button
                           className="priority-button priority-button-medium"
                           onClick={() => handleBookAppointment(medecin, 'moyenne')}
                           title="Prendre rendez-vous pour un suivi ou une consultation non urgente"
                        >
                        <span className="priority-icon">⏰</span>
                        <span className="priority-text">Suivi</span>
                        </button>
                      )}

                      {/* Bouton rouge (Urgence) - affiché seulement si le médecin a configuré des suggestions pour le bouton rouge */}
                      {medecin.suggestions_config && medecin.suggestions_config.rouge && medecin.suggestions_config.rouge.length > 0 && (
                        <button
                          className="priority-button priority-button-urgent"
                          onClick={() => handleBookAppointment(medecin, 'urgente')}
                          title="Prendre rendez-vous en cas d'urgence"
                        >
                          <span className="priority-icon">🚑</span>
                          <span className="priority-text">Urgence</span>
                        </button>
                      )}
                    </div>
                <Link 
                  to={`/medecins/${medecin.id}`} 
                  className="btn btn-primary"
                >
                  Voir disponibilités
                </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}



      {/* Modale pour afficher les suggestions */}
      <Modal
        isOpen={showSuggestionsModal}
        onClose={handleCloseSuggestionsModal}
        title={selectedPriorityType === 'vert' ? '' : selectedPriorityType === 'jaune' ? 'Suivi' : 'Urgence'}
        showCloseButton={false}
      >
        {selectedMedecin && selectedMedecin.suggestions_config && selectedMedecin.suggestions_config[selectedPriorityType] && (
          <div className="suggestions-list">
            <p style={{ marginBottom: '15px' }}>Voici les suggestions pour ce type de rendez-vous :</p>
            {selectedMedecin.suggestions_config[selectedPriorityType].map(suggestionId => {
              // Trouver la suggestion correspondante dans les suggestions pré-définies
              let suggestion = null;
              if (selectedPriorityType === 'vert') {
                suggestion = suggestionsPredefinies.vert.find(s => s.id === suggestionId);
              } else if (selectedPriorityType === 'jaune') {
                suggestion = suggestionsPredefinies.jaune.find(s => s.id === suggestionId);
              } else if (selectedPriorityType === 'rouge') {
                suggestion = suggestionsPredefinies.rouge.find(s => s.id === suggestionId);
              }
              
              if (!suggestion) return null;
              
              return (
                <div
                  key={suggestion.id}
                  className="suggestion-item"
                  style={{
                    padding: '15px',
                    marginBottom: '10px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: selectedPriorityType === 'vert' ? '#e8f5e9' : selectedPriorityType === 'jaune' ? '#fff8e1' : '#ffebee'
                  }}
                >
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{suggestion.text}</h4>
                  <p style={{ margin: '0', fontSize: '0.9rem', color: '#666' }}>{suggestion.description}</p>
                </div>
              );
            })}
            
            <div style={{ marginTop: '20px', borderTop: '1px solid #e0e0e0', paddingTop: '15px' }}>
              <p>Voulez-vous prendre rendez-vous avec le Dr. {selectedMedecin.nom_complet} ?</p>
              <button
                className="btn btn-primary"
                onClick={handleAutoBooking}
                disabled={loadingBooking}
                style={{ marginRight: '10px' }}
              >
                {loadingBooking ? 'Chargement...' : 'Confirmer le rendez-vous'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleCloseSuggestionsModal}
              >
                Annuler
              </button>
            </div>
            
            {bookingError && (
              <div className="alert alert-danger" style={{ marginTop: '15px' }}>
                {bookingError}
              </div>
            )}
            
            {bookingSuccess && (
              <div className="alert alert-success" style={{ marginTop: '15px' }}>
                {bookingSuccess}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MedecinList;
