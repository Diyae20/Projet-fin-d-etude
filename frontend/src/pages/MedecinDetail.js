import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { medecinService } from '../services/medecinService';
import { rendezvousService } from '../services/rendezvousService';
import { useAuth } from '../contexts/AuthContext';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import Modal from '../components/Modal';

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
    { id: 'r11', text: 'Fièvre élevée avec douleur dentaire', description: 'Signe d\'infection qui se propage' },
    { id: 'r12', text: 'Couronne ou bridge tombé', description: 'Prothèse qui est tombée avec douleur intense' },
    { id: 'r13', text: 'Douleur irradiante', description: 'Douleur qui se propage à l\'oreille, au cou ou à la tête' },
    { id: 'r14', text: 'Difficulté à ouvrir la bouche', description: 'Trismus important empêchant d\'ouvrir la bouche normalement' },
    { id: 'r15', text: 'Perte de sensation', description: 'Engourdissement ou perte de sensibilité après un traitement' }
  ]
};

// Composant Calendrier pour la sélection de date
const Calendar = ({ selectedDate, onDateChange, availableDates, disponibilitesParJour }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState(null);

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelectedDate = (date) => {
    return selectedDate && 
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
  };

  const isAvailableDate = (date) => {
    if (!availableDates || availableDates.length === 0) return false;

    return availableDates.some(availableDate => {
      const availDate = new Date(availableDate);
      return (
        date.getDate() === availDate.getDate() &&
        date.getMonth() === availDate.getMonth() &&
        date.getFullYear() === availDate.getFullYear()
      );
    });
  };

  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDateDisponibilite = (date) => {
    const dateStr = formatDateForAPI(date);
    
    if (!disponibilitesParJour) return 'disponible';
    
    const disponibilite = disponibilitesParJour[dateStr];
    
    if (!disponibilite) return 'disponible'; // Vert par défaut
    
    return disponibilite.niveau_disponibilite; // disponible, presque_complet, complet
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateClick = (date) => {
    if (isPastDate(date) || !isAvailableDate(date)) return;
    onDateChange(date);
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);

    const days = [];

    // En-tête du calendrier avec les noms des jours
    dayNames.forEach((day, index) => {
      days.push(
        <div 
          key={`day-name-${index}`} 
          className={`calendar-day-name ${index === 0 ? 'sunday' : ''}`}
        >
          {day}
        </div>
      );
    });

    // Jours vides avant le premier jour du mois
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isTodayDate = isToday(date);
      const isSelected = isSelectedDate(date);
      const isAvailable = isAvailableDate(date);
      const isPast = isPastDate(date);
      const isSunday = date.getDay() === 0;
      const isHovered = hoveredDate && 
        date.getDate() === hoveredDate.getDate() &&
        date.getMonth() === hoveredDate.getMonth() &&
        date.getFullYear() === hoveredDate.getFullYear();
        const disponibilite = getDateDisponibilite(date);

      days.push(
        <div 
          key={day} 
          className={`calendar-day
            ${isTodayDate ? 'today' : ''}
            ${isSelected ? 'selected' : ''}
            ${isAvailable ? 'available' : ''}
            ${isPast ? 'past' : ''}
            ${isSunday ? 'sunday' : ''}
            ${isHovered && disponibilite !== 'complet' ? 'hover' : ''}
            ${disponibilite === 'complet' ? 'complet' : ''}
            ${disponibilite === 'presque_complet' ? 'presque-complet' : ''}`}
          onClick={() => handleDateClick(date)}
          onMouseEnter={() => setHoveredDate(date)}
          onMouseLeave={() => setHoveredDate(null)}
        >
          <div className="calendar-day-number">{day}</div>
          {isSunday ? (
            <div className="calendar-day-message">Ce jour est fermé</div>
          ) : isAvailable && (
            <div className="calendar-day-indicator">✓</div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button 
          className="btn btn-outline-secondary" 
          onClick={goToPreviousMonth}
        >
          ← Mois précédent
        </button>
        <h3>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button 
          className="btn btn-outline-secondary" 
          onClick={goToNextMonth}
        >
          Mois suivant →
        </button>
      </div>

      <div className="calendar-navigation" style={{ marginTop: '10px', marginBottom: '20px' }}>
        <button 
          className="btn btn-secondary" 
          onClick={goToToday}
        >
          Aujourd'hui
        </button>
      </div>

      <div className="calendar-grid">
        {renderCalendar()}
      </div>

      <div className="calendar-legend" style={{ marginTop: '20px' }}>
        <div className="legend-item">
          <div className="legend-color available"></div>
          <span>Disponible</span>
        </div>
        <div className="legend-item">
          <div className="legend-color presque-complet"></div>
          <span>Presque complet</span>
        </div>
        <div className="legend-item">
          <div className="legend-color complet"></div>
          <span>Complet</span>
        </div>
        <div className="legend-item">
          <div className="legend-color selected"></div>
          <span>Sélectionné</span>
        </div>
        <div className="legend-item">
          <div className="legend-color past"></div>
          <span>Passé</span>
        </div>
      </div>
    </div>
  );
};

const MedecinDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [medecin, setMedecin] = useState(null);
  const [creneaux, setCreneaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedCreneau, setSelectedCreneau] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [availableDates, setAvailableDates] = useState([]);
  const [dateComplete, setDateComplete] = useState(false);
  const [messageDate, setMessageDate] = useState('');
  const [disponibilitesParJour, setDisponibilitesParJour] = useState({});
  const [selectedPriority, setSelectedPriority] = useState('basse'); // Priorité par défaut
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false); // État pour la modale des suggestions
  const [selectedPriorityType, setSelectedPriorityType] = useState(''); // Type de priorité sélectionnée (vert, jaune, rouge)

  useEffect(() => {
    fetchMedecinDetail();
  }, [id]);

  useEffect(() => {
    if (selectedDate) {
      fetchCreneauxDisponibles();
    }
  }, [selectedDate]);

  const fetchMedecinDetail = async () => {
    setLoading(true);
    setError('');

    const result = await medecinService.getMedecinDetail(id);

    if (result.success) {
      setMedecin(result.data);
      // Initialiser les dates disponibles avec les 30 prochains jours
      const dates = [];
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date.toISOString());
      }
      setAvailableDates(dates);
      // Récupérer les disponibilités par jour
      fetchDisponibilitesParJour();
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const fetchDisponibilitesParJour = async () => {
    const result = await rendezvousService.getMedecinDisponibiliteParJour(id);
    if (result.success) {
      setDisponibilitesParJour(result.data.disponibilites || {});
    }
  };

  const fetchCreneauxDisponibles = async () => {
    if (!selectedDate) return;

    // Ne pas récupérer les créneaux pour les dimanches
    if (selectedDate.getDay() === 0) {
      setCreneaux([]);
      setDateComplete(true);
      setMessageDate('Ce jour est fermé');
      return;
    }

    const formattedDate = formatDateForAPI(selectedDate);
    const result = await rendezvousService.getCreneauxDisponibles(id, formattedDate);

    if (result.success) {
      setCreneaux(result.data.creneaux || []);
      setDateComplete(result.data.date_complete || false);
      setMessageDate(result.data.message || '');
    } else {
      setError(result.error);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedCreneau('');
    setCreneaux([]);
  };

  const formatDateForAPI = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleCreneauSelect = (heure) => {
    setSelectedCreneau(heure);
  };

  const handlePrioritySelect = (priority) => {
    // Définir le type de priorité en fonction de la valeur
    let priorityType = '';
    if (priority === 'basse') priorityType = 'vert';
    else if (priority === 'moyenne') priorityType = 'jaune';
    else if (priority === 'urgente') priorityType = 'rouge';
    
    setSelectedPriorityType(priorityType);
    setSelectedPriority(priority); // Définir la priorité directement
    setShowSuggestionsModal(true);
  };

  const handleBooking = async () => {
    // Validation des champs
    const newErrors = {};

    if (!selectedDate) {
      newErrors.date = 'Veuillez sélectionner une date';
    }

    if (!selectedCreneau) {
      newErrors.creneau = 'Veuillez sélectionner un créneau';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setBookingLoading(true);
    setError('');
    setErrors({});

    const formattedDate = formatDateForAPI(selectedDate);
    const result = await rendezvousService.createRendezvous({
      medecin_id: medecin.user.id,
      patient_id: user.id,
      date: formattedDate,
      heure: selectedCreneau,
      priorite: selectedPriority
    });

    if (result.success) {
      setSuccess('Rendez-vous créé avec succès !');
      setSelectedCreneau('');
      fetchCreneauxDisponibles();
    } else {
      setError(result.error);
    }

    setBookingLoading(false);
  };

  if (loading) {
    return <Loading message="Chargement des informations du médecin..." />;
  }

  if (!medecin) {
    return (
      <div className="card">
        <Alert type="error" message="Médecin non trouvé" />
      </div>
    );
  }

  return (
    <div className="medecin-detail">
      <button 
        className="btn btn-secondary" 
        onClick={() => navigate(-1)}
        style={{ marginBottom: '20px' }}
      >
        ← Retour
      </button>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ 
            width: '100px', 
            height: '100px', 
            borderRadius: '50%', 
            backgroundColor: '#e9ecef', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginRight: '20px',
            fontSize: '40px',
            overflow: 'hidden'
          }}>
            {medecin.photo ? (
              <img 
                src={`${medecin.photo}?t=${new Date().getTime()}`} 
                alt={`${medecin.nom_complet}`} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span>👨‍⚕️</span>
            )}
          </div>
          <div>
            <h1 style={{ marginBottom: '5px' }}>{medecin.nom_complet}</h1>
            <p className="medecin-specialite" style={{ fontSize: '18px' }}>
              {medecin.specialite?.nom || 'Non spécifié'}
            </p>
          </div>
        </div>

        {medecin.bio && (
          <div style={{ marginTop: '20px' }}>
            <h3>À propos</h3>
            <p>{medecin.bio}</p>
          </div>
        )}

        <div style={{ marginTop: '20px' }}>
          <h3>Informations pratiques</h3>
          {medecin.adresse_cabinet && (
            <p>🏥 {medecin.adresse_cabinet}</p>
          )}
          {medecin.ville && (
            <p>📍 {medecin.ville}</p>
          )}
          {medecin.telephone && (
            <p>📞 {medecin.telephone}</p>
          )}
          <p>⏱️ Durée moyenne de consultation : {medecin.duree_consultation} minutes</p>
        </div>

        {medecin.experience && (
          <div style={{ marginTop: '20px' }}>
            <h3>Expérience</h3>
            <p>{medecin.experience} ans d'expérience</p>
          </div>
        )}

        {medecin.diplomes && medecin.diplomes.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3>Diplômes</h3>
            <ul>
              {medecin.diplomes.map((diplome, index) => (
                <li key={index}>{diplome}</li>
              ))}
            </ul>
          </div>
        )}

        {medecin.langues && medecin.langues.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3>Langues parlées</h3>
            <p>{medecin.langues.join(', ')}</p>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Prendre rendez-vous</h2>
        <p className="text-muted" style={{ marginBottom: '20px' }}>
          Sélectionnez une date et un créneau pour prendre rendez-vous avec le Dr. {medecin.nom}.
        </p>
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* Afficher les boutons de priorité si le médecin a configuré les suggestions correspondantes */}
        {medecin.suggestions_config && (
          <div className="priority-buttons" style={{ marginBottom: '20px' }}>
            {/* Bouton vert (Consultation) - affiché seulement si le médecin a configuré des suggestions pour le bouton vert */}
            {medecin.suggestions_config.vert && medecin.suggestions_config.vert.length > 0 && (
              <button
                className={`priority-button priority-button-low ${selectedPriority === 'basse' ? 'selected' : ''}`}
                onClick={() => handlePrioritySelect('basse')}
                title="Prendre rendez-vous pour une consultation de routine"
                >
                  <span className="priority-icon">📅</span>
                   <span className="priority-text">Consultation</span>
                </button>
            )}

              {/* Bouton jaune (Suivi) - affiché seulement si le médecin a configuré des suggestions pour le bouton jaune */}
              {medecin.suggestions_config.jaune && medecin.suggestions_config.jaune.length > 0 && (
                <button
                   className={`priority-button priority-button-medium ${selectedPriority === 'moyenne' ? 'selected' : ''}`}
                   onClick={() => handlePrioritySelect('moyenne')}
                   title="Prendre rendez-vous pour un suivi ou une consultation non urgente"
                >
                <span className="priority-icon">⏰</span>
                <span className="priority-text">Suivi</span>
                </button>
              )}

              {/* Bouton rouge (Urgence) - affiché seulement si le médecin a configuré des suggestions pour le bouton rouge */}
              {medecin.suggestions_config.rouge && medecin.suggestions_config.rouge.length > 0 && (
                <button
                  className={`priority-button priority-button-urgent ${selectedPriority === 'urgente' ? 'selected' : ''}`}
                  onClick={() => handlePrioritySelect('urgente')}
                  title="Prendre rendez-vous en cas d'urgence"
                >
                  <span className="priority-icon">🚑</span>
                  <span className="priority-text">Urgence</span>
                </button>
              )}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="date">Date</label>
          <Calendar 
            selectedDate={selectedDate} 
            onDateChange={handleDateChange} 
            availableDates={availableDates}
            disponibilitesParJour={disponibilitesParJour} 
          />
          {errors.date && <div className="invalid-feedback">{errors.date}</div>}
        </div>

        {selectedDate && creneaux.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3>Créneaux disponibles</h3>
            <div className="creneau-list">
              {creneaux.map((creneau, index) => (
                <button
                  key={index}
                  className={`creneau-btn ${selectedCreneau === creneau.heure ? 'selected' : ''}`}
                  onClick={() => handleCreneauSelect(creneau.heure)}
                  disabled={!creneau.disponible}
                >
                  {creneau.heure}
                </button>
              ))}
            </div>
            {errors.creneau && <div className="invalid-feedback" style={{ display: 'block' }}>{errors.creneau}</div>}
          </div>
        )}

        {selectedDate && creneaux.length === 0 && (
          <div style={{ marginTop: '20px' }}>
            {dateComplete ? (
              <>
                <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
                  {messageDate}
                </div>

              </>
            ) : (
              <p>
                Aucun créneau disponible pour cette date. Veuillez choisir une autre date.
              </p>
            )}
          </div>
        )}

      {/* Modale pour afficher les suggestions */}
      <Modal
        isOpen={showSuggestionsModal}
        onClose={() => setShowSuggestionsModal(false)}
        title={selectedPriorityType === 'vert' ? 'Consultation' : selectedPriorityType === 'jaune' ? 'Suivi' : 'Urgence'}
      >
        {medecin.suggestions_config && medecin.suggestions_config[selectedPriorityType] && (
          <div className="suggestions-list">
            <p style={{ marginBottom: '15px' }}>Voici les suggestions pour ce type de rendez-vous :</p>
            {medecin.suggestions_config[selectedPriorityType].map(suggestionId => {
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
          </div>
        )}
      </Modal>


        {selectedCreneau && (
          <button
            className="btn btn-primary"
            onClick={handleBooking}
            disabled={bookingLoading}
            style={{ marginTop: '20px' }}
          >
            {bookingLoading ? 'Création en cours...' : 'Confirmer le rendez-vous'}
          </button>
        )}
      </div>
    </div>
  );
};

export default MedecinDetail;
