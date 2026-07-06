import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { medecinService } from '../services/medecinService';
import { rendezvousService } from '../services/rendezvousService';
import { useAuth } from '../contexts/AuthContext';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import Modal from '../components/Modal';
import api from '../services/api';



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
  const joursSemaine = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
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

    // Récupérer les informations de base du médecin
    const result = await medecinService.getMedecinDetail(id);

    if (result.success) {


      console.log('Données du médecin:', result.data);
      
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

  // Vérifier si le médecin a des horaires configurés
  if (!medecin || !medecin.user || !medecin.user.id) {
    setCreneaux([]);
    setDateComplete(true);
    setMessageDate('Informations du médecin non disponibles');
    return;
  }

  // Obtenir le jour de la semaine en français
  const joursSemaine = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const jour = joursSemaine[selectedDate.getDay()];

  // Vérifier si le médecin travaille ce jour-là
  const jourActif = medecin[`${jour}_actif`];
  if (!jourActif) {
    setCreneaux([]);
    setDateComplete(true);
    setMessageDate(`Le médecin ne travaille pas les ${jour}s`);
    return;
  }

  const formattedDate = formatDateForAPI(selectedDate);
  
  try {
    const result = await rendezvousService.getCreneauxDisponibles(id, formattedDate);

    if (result.success) {
      // Utiliser la durée de consultation si elle est disponible dans la réponse
      const dureeConsultation = result.data.duree_consultation || 60;
      
      // Mettre à jour la durée de consultation du médecin si nécessaire
      if (dureeConsultation !== (medecin.duree_consultation || 60)) {
        setMedecin(prevMedecin => ({
          ...prevMedecin,
          duree_consultation: dureeConsultation
        }));
      }

       const dateComplete = result.data.date_complete || (result.data.creneaux || []).length === 0;
       setDateComplete(dateComplete);
      
      // Si la date est complète, afficher le message approprié
      if (dateComplete && result.data.message) {
        setMessageDate(typeof result.data.message === 'string' ? result.data.message : 'Tous les créneaux sont réservés pour cette date.');
      } else if (!dateComplete) {
        setMessageDate('');
      }

      setCreneaux(result.data.creneaux || []);

       if (dateComplete) {
              // Tous les créneaux sont réservés pour cette date
      }


    } else {
      console.error('Erreur API:', result.error);
      setError(result.error);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des créneaux:', error);
    setError('Une erreur est survenue lors de la récupération des créneaux disponibles.');
  }
};



  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedCreneau('');
  };

  const formatDateForAPI = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const findFirstAvailableSlot = async (medecinId, startDate, isYellowButton = false) => {
    // Pour le bouton jaune, chercher uniquement dans le jour suivant (délai d'1 jour)
    const maxDays = isYellowButton ? 1 : 3;
    let currentDate = new Date(startDate);
    
    // S'assurer que l'heure est à 00:00 pour éviter les problèmes de comparaison
    currentDate.setHours(0, 0, 0, 0);
    
    // Pour le bouton jaune, s'assurer que la date de début est bien le lendemain
    if (isYellowButton) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Si la date spécifiée est avant demain, utiliser demain comme date de début
      if (currentDate < tomorrow) {
        console.log(`findFirstAvailableSlot - La date spécifiée (${formatDateForAPI(currentDate)}) est avant demain (${formatDateForAPI(tomorrow)}), utilisation de demain`);
        currentDate = tomorrow;
      }
    }
    
    console.log(`findFirstAvailableSlot - Recherche à partir du ${formatDateForAPI(currentDate)} (maxDays: ${maxDays}, isYellowButton: ${isYellowButton})`);

    // Récupérer les informations du médecin pour vérifier s'il travaille le samedi
    const medecinInfo = medecin;
    const travailleSamedi = medecinInfo && medecinInfo.travaille_samedi;

    for (let day = 0; day < maxDays; day++) {
      // Ignorer les dimanches (jour 0 de la semaine)
      if (currentDate.getDay() === 0) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Ignorer les samedis si le médecin ne travaille pas le samedi (jour 6 de la semaine)
      if (currentDate.getDay() === 6 && !travailleSamedi) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      const formattedDate = formatDateForAPI(currentDate);
      const result = await rendezvousService.getCreneauxDisponibles(medecinId, formattedDate);

      if (result.success && result.data.creneaux && result.data.creneaux.length > 0) {
        // Retourner le premier créneau disponible de ce jour
        const firstCreneau = result.data.creneaux[0];
        const creneauHeure = typeof firstCreneau === 'object' ? firstCreneau.heure : firstCreneau;
        
        // Vérifier que le créneau existe bien dans la liste des créneaux disponibles
        const creneauExists = result.data.creneaux.some(creneau => creneau.heure === creneauHeure);
        if (creneauExists) {
          return {
            date: formattedDate,
            heure: creneauHeure
          };
        } else {
          console.error('findFirstAvailableSlot - Erreur: Le créneau trouvé n\'existe pas dans la liste des créneaux disponibles');
        }
      }

      // Passer au jour suivant
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Pour le bouton jaune, si aucun créneau n'est disponible dans le délai d'1 jour,
    // chercher un rendez-vous normal à échanger
    if (isYellowButton) {
      const exchangeSlot = await findExchangeableAppointment(medecinId, startDate);
      if (exchangeSlot) {
        return exchangeSlot;
      }
    }

    // Aucun créneau trouvé
    return null;
  };

  const findExchangeableAppointment = async (medecinId, startDate) => {
    // Chercher un rendez-vous normal (priorité basse) qui peut être déplacé
    // dans le jour suivant (délai d'1 jour)
    const maxDays = 1;
    let currentDate = new Date(startDate);
    
    // S'assurer que l'heure est à 00:00 pour éviter les problèmes de comparaison
    currentDate.setHours(0, 0, 0, 0);
    
    // S'assurer que la date de début est bien le lendemain
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Si la date spécifiée est avant demain, utiliser demain comme date de début
    if (currentDate < tomorrow) {
      console.log(`findExchangeableAppointment - La date spécifiée (${formatDateForAPI(currentDate)}) est avant demain (${formatDateForAPI(tomorrow)}), utilisation de demain`);
      currentDate = tomorrow;
    }
    
    console.log(`findExchangeableAppointment - Recherche à partir du ${formatDateForAPI(currentDate)} (maxDays: ${maxDays})`);

    // Récupérer les informations du médecin pour vérifier s'il travaille le samedi
    const medecinInfo = medecin;
    const travailleSamedi = medecinInfo && medecinInfo.travaille_samedi;

    for (let day = 0; day < maxDays; day++) {
      // Ignorer les dimanches (jour 0 de la semaine)
      if (currentDate.getDay() === 0) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Ignorer les samedis si le médecin ne travaille pas le samedi (jour 6 de la semaine)
      if (currentDate.getDay() === 6 && !travailleSamedi) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      const formattedDate = formatDateForAPI(currentDate);

      // Récupérer tous les rendez-vous pour ce jour
      const result = await rendezvousService.getRendezvousByMedecinAndDate(medecinId, formattedDate);

      if (result.success && result.data) {
        const rendezvousList = Array.isArray(result.data.results) ? result.data.results : result.data;

        // Chercher un rendez-vous avec priorité basse (consultation normale)
        const normalAppointment = rendezvousList.find(rv => 
          rv.priorite === 'basse' && rv.statut !== 'annule' && rv.statut !== 'passe'
        );

        if (normalAppointment) {
          // Récupérer les informations du patient dont le rendez-vous sera déplacé
          const patientId = normalAppointment.patient_id;

          // Trouver un nouveau créneau pour ce patient (le plus tôt possible)
          const newSlotForPatient = await findFirstAvailableSlotForPatient(medecinId, patientId, formattedDate);

          if (newSlotForPatient) {
            // Mettre à jour le rendez-vous du patient déplacé
            await rendezvousService.updateRendezvousDateTime(normalAppointment.id, newSlotForPatient.date, newSlotForPatient.heure);

            // Envoyer une notification au patient dont le rendez-vous a été modifié
            await rendezvousService.notifyRendezvousChanged(
              normalAppointment.id,
              formattedDate,
              normalAppointment.heure,
              newSlotForPatient.date,
              newSlotForPatient.heure
            );

            // Retourner le créneau libéré pour le patient qui a demandé le suivi
            return {
              date: formattedDate,
              heure: normalAppointment.heure,
              exchangedAppointmentId: normalAppointment.id
            };
          }
        }
      }

      // Passer au jour suivant
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Aucun rendez-vous échangeable trouvé
    return null;
  };

  const findFirstAvailableSlotForPatient = async (medecinId, patientId, originalDate) => {
    // Chercher le premier créneau disponible pour le patient dont le rendez-vous a été déplacé
    // en commençant par le lendemain de son rendez-vous original
    const maxDays = 30; // Chercher dans les 30 prochains jours
    let currentDate = new Date(originalDate);
    currentDate.setDate(currentDate.getDate() + 1); // Commencer le lendemain
    
    // S'assurer que l'heure est à 00:00 pour éviter les problèmes de comparaison
    currentDate.setHours(0, 0, 0, 0);
    
    console.log(`findFirstAvailableSlotForPatient - Recherche à partir du ${formatDateForAPI(currentDate)} (maxDays: ${maxDays})`);

    // Récupérer les informations du médecin pour vérifier s'il travaille le samedi
    const medecinInfo = medecin;
    const travailleSamedi = medecinInfo && medecinInfo.travaille_samedi;

    for (let day = 0; day < maxDays; day++) {
      // Ignorer les dimanches (jour 0 de la semaine)
      if (currentDate.getDay() === 0) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Ignorer les samedis si le médecin ne travaille pas le samedi (jour 6 de la semaine)
      if (currentDate.getDay() === 6 && !travailleSamedi) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      const formattedDate = formatDateForAPI(currentDate);
      const result = await rendezvousService.getCreneauxDisponibles(medecinId, formattedDate);

      if (result.success && result.data.creneaux && result.data.creneaux.length > 0) {
        // Retourner le premier créneau disponible de ce jour
        const firstCreneau = result.data.creneaux[0];
        const creneauHeure = typeof firstCreneau === 'object' ? firstCreneau.heure : firstCreneau;
        
        // Vérifier que le créneau existe bien dans la liste des créneaux disponibles
        const creneauExists = result.data.creneaux.some(creneau => creneau.heure === creneauHeure);
        if (creneauExists) {
          return {
            date: formattedDate,
            heure: creneauHeure
          };
        } else {
          console.error('findFirstAvailableSlotForPatient - Erreur: Le créneau trouvé n\'existe pas dans la liste des créneaux disponibles');
        }
      }

      // Passer au jour suivant
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Aucun créneau trouvé
    return null;
  };

  const handleCreneauSelect = (heure) => {
  if (typeof heure === 'string') {
    setSelectedCreneau(heure);
    setErrors({ ...errors, creneau: '' });
  } else {
    console.error('L\'heure du créneau n\'est pas une chaîne de caractères:', heure);
  }
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

  const handleAutoBooking = async () => {
    if (!user || !user.id) {
      setError('vous devez être connecté pour prendre un rendez-vous.');
      return;
    }

    if (!medecin || !medecin.user || !medecin.user.id) {
       setError('Informations du médecin non disponibles. Veuillez réessayer.');
       return;
    }

    setBookingLoading(true);
    setError('');
    setErrors({});

    try {
      // Déterminer la date de début et le message d'erreur en fonction du type de priorité
      let startDate;
      let errorMessage;
      let searchDays;

      if (selectedPriorityType === 'jaune') {
        // Pour le bouton jaune (Suivi): rechercher à partir de 1 jour
        startDate = new Date();
        startDate.setDate(startDate.getDate() + 1);
        searchDays = 1;
        errorMessage = 'Aucun créneau disponible dans 1 jour pour ce médecin.';
      } else {
        // Pour les autres types: rechercher à partir de 3 jours
        startDate = new Date();
        startDate.setDate(startDate.getDate() + 3);
        searchDays = 3;
        errorMessage = 'Aucun créneau disponible dans 3 jours pour ce médecin.';
      }

      // S'assurer que l'heure de début est à 00:00 pour éviter les problèmes de comparaison
      startDate.setHours(0, 0, 0, 0);

      console.log(`Recherche de créneaux pour ${selectedPriorityType} à partir du ${formatDateForAPI(startDate)} (délai: ${searchDays} jours)`);

      // Utiliser l'ID de l'utilisateur du médecin car le champ medecin dans le modèle RendezVous est un ForeignKey vers User
      const slot = await findFirstAvailableSlot(medecin.user.id, startDate, selectedPriorityType === 'jaune');
      
      if (!slot) {
        console.log(`Aucun créneau trouvé pour ${selectedPriorityType} dans les ${searchDays} jours`);
        setError(errorMessage);
        setBookingLoading(false);
        return;
      }
      
      console.log(`Créneau trouvé pour ${selectedPriorityType}: ${slot.date} à ${slot.heure}`);

      // Déterminer la priorité et le type de consultation en fonction du type sélectionné
      let priority = 'basse';
      let typeConsultation = null;

      if (selectedPriorityType === 'vert') {
        priority = 'basse';
        typeConsultation = 'consultation';
      } else if (selectedPriorityType === 'jaune') {
        priority = 'moyenne';
        typeConsultation = 'suivi';
      } else if (selectedPriorityType === 'rouge') {
        priority = 'urgente';
        
        // Pour le bouton rouge (urgence), utiliser emergencyBooking qui recherche le créneau le plus proche le jour même
        // et échange directement un rendez-vous de priorité basse si nécessaire
        const result = await rendezvousService.emergencyBooking(
          medecin.user.id,
          user.id,
          priority,
          typeConsultation
        );
        
        if (result.success) {
          // Vérifier si un rendez-vous a été échangé
          if (result.data.exchangedAppointmentId) {
            setSuccess(`Rendez-vous d'urgence créé avec succès pour le ${result.data.rendezvous.date} à ${result.data.rendezvous.heure} ! Un rendez-vous a été réorganisé pour vous permettre d'obtenir ce créneau.`);
          } else {
            setSuccess(`Rendez-vous d'urgence créé avec succès pour le ${result.data.rendezvous.date} à ${result.data.rendezvous.heure} !`);
          }
          // Fermer le modal après un délai
          setTimeout(() => {
            setShowSuggestionsModal(false);
            setSuccess('');
          }, 5000);
        } else {
          setError(result.error || errorMessage);
        }
        setBookingLoading(false);
        return;
      }

      // Créer le rendez-vous avec la priorité et le type de consultation sélectionnés
      const rendezvousData = {
        medecin_id: medecin.user.id,
        patient_id: user.id,
        date: slot.date,
        heure: slot.heure,
        type_consultation: typeConsultation,
        priorite: priority
      };

      const result = await rendezvousService.createRendezvous(rendezvousData);

      if (result.success) {
        // Vérifier si un rendez-vous a été échangé
        if (slot.exchangedAppointmentId) {
          setSuccess(`Rendez-vous créé avec succès pour le ${slot.date} à ${slot.heure} ! Un rendez-vous a été réorganisé pour vous permettre d'obtenir ce créneau.`);
        } else {
          setSuccess(`Rendez-vous créé avec succès pour le ${slot.date} à ${slot.heure} !`);
        }
        // Fermer le modal après un délai
        setTimeout(() => {
          setShowSuggestionsModal(false);
          setSuccess('');
        }, 5000); // Augmenter le délai à 5 secondes pour permettre la lecture du message
      } else {
        setError(result.error || 'Erreur lors de la création du rendez-vous.');
      }
    } catch (error) {
      setError('Une erreur est survenue lors de la création du rendez-vous.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleBooking = async () => {

    if (!user || !user.id) {
      setError('vous devez être connecté pour prendre un rendez-vous.'); 
      return;
    }

    if (!medecin || !medecin.user || !medecin.user.id) {
       setError('Informations du médecin non disponibles. Veuillez réessayer.');
       return;
    }
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
    const medecinId =  medecin.user.id; 
    const rendezvousData = {
      medecin_id: medecinId,
      patient_id: user.id,
      date: formattedDate,
      heure: selectedCreneau,
      priorite: selectedPriority
    };
    
    const result = await rendezvousService.createRendezvous(rendezvousData);

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
          <p>⏱️ Durée moyenne pour chaque patient : {medecin.duree_consultation} minutes</p>
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
        {error && <Alert type="error" message={typeof error === 'string' ? error : JSON.stringify(error)} onClose={() => setError('')} />}
        {success && <Alert type="success" message={typeof success === 'string' ? success : JSON.stringify(success)} onClose={() => setSuccess('')} />}


        {/* Les boutons de priorité ont été supprimés */}

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
                  {typeof creneau.heure === 'string' ? creneau.heure : JSON.stringify(creneau.heure)}
                </button>
              ))}
            </div>
            {errors.creneau && <div className="invalid-feedback" style={{ display: 'block' }}>{errors.creneau}</div>}
          </div>
        )}

        {selectedDate && creneaux.length === 0 && (
  <div style={{ marginTop: '20px' }}>
    <Alert 
      type="info" 
      message={typeof messageDate === 'string' ? messageDate : 'Tous les créneaux sont réservés pour cette date.'}
    />



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
            })}

            <div className="suggestions-actions">
              <p>Voulez-vous prendre rendez-vous avec le Dr. {medecin.nom_complet} ?</p>
              <div className="btn-group">
                <button
                  className="btn btn-primary"
                  onClick={handleAutoBooking}
                  disabled={bookingLoading}
                >
                  {bookingLoading ? 'Chargement...' : 'Confirmer le rendez-vous'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowSuggestionsModal(false)}
                >
                  Annuler
                </button>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger" style={{ marginTop: '15px' }}>
                {typeof error === 'string' ? error : JSON.stringify(error)}
              </div>
            )}

            {success && (
              <div className="alert alert-success" style={{ marginTop: '15px' }}>
                {success}
              </div>
            )}
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
