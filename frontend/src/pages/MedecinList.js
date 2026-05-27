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
      // Récupérer tous les rendez-vous, y compris ceux passés
      const result = await rendezvousService.getAllRendezvousIncludingPast();
      if (result.success) {
        const rendezvous = result.data.results || result.data;
        setUserRendezvous(rendezvous);
        console.log("DEBUG - Tous les rendez-vous du patient:", rendezvous);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des rendez-vous:", error);
    }
  };

  // Fonction de débogage pour vérifier si un patient a un rendez-vous passé avec un médecin
  const hasPastAppointmentWithMedecin = (medecin) => {
    console.log("DEBUG - Medecin:", medecin);
    console.log("DEBUG - Tous les rendez-vous du patient:", userRendezvous);
    
    // Afficher les détails de chaque rendez-vous pour comprendre la structure
    userRendezvous.forEach(rdv => {
      console.log("DEBUG - Rendez-vous:", rdv);
      console.log("DEBUG - rdv.medecin:", rdv.medecin);
      console.log("DEBUG - rdv.medecin_id:", rdv.medecin_id);
      console.log("DEBUG - rdv.medecin?.id:", rdv.medecin?.id);
      console.log("DEBUG - rdv.medecin?.user?.id:", rdv.medecin?.user?.id);
    });
    
    const medecinRendezvous = userRendezvous.filter(rdv => {
      // Essayer différentes façons d'accéder à l'ID du médecin
      const medecinIdFromRdv = rdv.medecin?.id || rdv.medecin?.user?.id || rdv.medecin_id;
      console.log("DEBUG - ID du médecin dans le rendez-vous:", medecinIdFromRdv, "ID du médecin recherché:", medecin.id);
      
      // Vérifier si les ID correspondent
      if (medecinIdFromRdv === medecin.id) {
        return true;
      }
      
      // Si les ID ne correspondent pas, vérifier si c'est le même médecin en comparant d'autres propriétés
      if (rdv.medecin && typeof rdv.medecin === 'object') {
        // Comparer par nom et prénom
        const rdvMedecinName = `${rdv.medecin.first_name || ''} ${rdv.medecin.last_name || ''}`.toLowerCase();
        const medecinName = (medecin.nom_complet || medecin.first_name + ' ' + medecin.last_name || '').toLowerCase();
        console.log("DEBUG - Nom du médecin dans le rendez-vous:", rdvMedecinName, "Nom du médecin recherché:", medecinName);
        return rdvMedecinName === medecinName;
      }
      
      return false;
    });
    console.log("DEBUG - Rendez-vous avec ce médecin:", medecinRendezvous);
    
    const hasPastAppointment = medecinRendezvous.some(rdv => {
      const rdvDate = new Date(rdv.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      console.log("DEBUG - Rendez-vous:", rdv);
      console.log("DEBUG - Date du rendez-vous:", rdvDate);
      console.log("DEBUG - Date d'aujourd'hui:", today);
      console.log("DEBUG - Statut du rendez-vous:", rdv.statut);
      // Un rendez-vous est considéré comme passé si son statut est "passe", quelle que soit sa date
      const isPast = rdv.statut === 'passe';
      console.log("DEBUG - Est passé:", isPast);
      return isPast;
    });
    console.log("DEBUG - A un rendez-vous passé:", hasPastAppointment);
    return hasPastAppointment;
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
    // Déterminer la date de début et le message d'erreur en fonction du type de priorité
    let startDate;
    let errorMessage;

    if (selectedPriorityType === 'jaune') {
      // Pour le bouton jaune (Suivi): rechercher à partir de 1 jour
      startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      errorMessage = 'Aucun créneau disponible dans les 7 prochains jours pour ce médecin. Veuillez contacter le cabinet directement pour un rendez-vous de suivi.';
    } else {
      // Pour les autres types: rechercher à partir de 3 jours
      startDate = new Date();
      startDate.setDate(startDate.getDate() + 3);
      errorMessage = 'Aucun créneau disponible dans 3 jours pour ce médecin.';
    }

    // Utiliser l'ID de l'utilisateur du médecin car le champ medecin dans le modèle RendezVous est un ForeignKey vers User
    const medecinUserId = selectedMedecin.user?.id || selectedMedecin.id;

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
    }

    // Pour les priorités moyenne (jaune) et urgente (rouge), utiliser priorityBooking
    if (selectedPriorityType === 'jaune' || selectedPriorityType === 'rouge') {
      // Déterminer le déai en jours selon le type de priorité
      const delayDays = selectedPriorityType === 'jaune' ? 1 : 0;
      
      let result;
      
      if (selectedPriorityType === 'rouge') {
        // Pour le bouton rouge (urgence), utiliser emergencyBooking qui recherche le créneau le plus proche le jour même
        // et échange directement un rendez-vous de priorité basse si nécessaire
        result = await rendezvousService.emergencyBooking(
          medecinUserId,
          user.id,
          priority,
          typeConsultation
        );
      } else {
        // Pour le bouton jaune (suivi), utiliser priorityBooking avec un délai de 1 jour
        result = await rendezvousService.priorityBooking(
          medecinUserId,
          user.id,
          priority,
          typeConsultation,
          delayDays
        );
      }

      if (result.success) {
        setBookingSuccess(`Rendez-vous créé avec succès pour le ${result.data.rendezvous.date} à ${result.data.rendezvous.heure} ! Un rendez-vous a été réorganisé pour vous permettre d'obtenir ce créneau.`);
        // Fermer le modal après un délai
        setTimeout(() => {
          setShowSuggestionsModal(false);
          setBookingSuccess('');
        }, 5000); // Augmenter le délai à 5 secondes pour permettre la lecture du message
      } else {
        console.error('Erreur détaillée:', result.error);
        setBookingError(result.error || errorMessage);
      }
    } else {
      // Pour la priorité basse (vert), utiliser l'approche normale
      const slot = await findFirstAvailableSlot(medecinUserId, startDate, false);

      if (!slot) {
        setBookingError(errorMessage);
        setLoadingBooking(false);
        return;
      }

      // Créer le rendez-vous avec la priorité et le type de consultation sélectionnés
      const rendezvousData = {
        medecin_id: medecinUserId,
        patient_id: user.id,
        date: slot.date,
        heure: slot.heure,
        type_consultation: typeConsultation,
        priorite: priority
      };

      const result = await rendezvousService.createRendezvous(rendezvousData);

      if (result.success) {
        setBookingSuccess(`Rendez-vous créé avec succès pour le ${slot.date} à ${slot.heure} !`);
        // Fermer le modal après un délai
        setTimeout(() => {
          setShowSuggestionsModal(false);
          setBookingSuccess('');
        }, 5000); // Augmenter le délai à 5 secondes pour permettre la lecture du message
      } else {
        setBookingError(result.error || 'Erreur lors de la création du rendez-vous.');
      }
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

  const findFirstAvailableSlot = async (medecinId, startDate, isYellowButton = false) => {
    // Pour le bouton jaune, chercher dans les 1 jour suivant au lieu de 3 jours
    const maxDays = isYellowButton ? 1 : 3;
    let currentDate = new Date(startDate);

    // Récupérer les informations du médecin pour vérifier s'il travaille le samedi
    // medecinId est l'ID de l'utilisateur du médecin, on cherche donc par user.id
    const medecin = medecins.find(m => m.user?.id === medecinId || m.id === medecinId);
    const travailleSamedi = medecin && medecin.travaille_samedi === true;

    console.log('findFirstAvailableSlot - medecinId:', medecinId, 'startDate:', startDate, 'isYellowButton:', isYellowButton);
    console.log('findFirstAvailableSlot - medecin:', medecin, 'travailleSamedi:', travailleSamedi);

    for (let day = 0; day < maxDays; day++) {
      // Ignorer les dimanches (jour 0 de la semaine)
      if (currentDate.getDay() === 0) {
        console.log('findFirstAvailableSlot - Ignorant dimanche:', formatDateForAPI(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Ignorer les samedis si le médecin ne travaille pas le samedi (jour 6 de la semaine)
      if (currentDate.getDay() === 6 && !travailleSamedi) {
        console.log('findFirstAvailableSlot - Ignorant samedi (médecin ne travaille pas le samedi):', formatDateForAPI(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      const formattedDate = formatDateForAPI(currentDate);
      console.log('findFirstAvailableSlot - Vérifiant créneaux pour:', formattedDate);
      const result = await rendezvousService.getCreneauxDisponibles(medecinId, formattedDate);
      console.log('findFirstAvailableSlot - Résultat créneaux disponibles:', result);
      console.log('findFirstAvailableSlot - result.success:', result.success);
      console.log('findFirstAvailableSlot - result.data:', result.data);
      console.log('findFirstAvailableSlot - result.data.creneaux:', result.data?.creneaux);
      console.log('findFirstAvailableSlot - result.data.creneaux.length:', result.data?.creneaux?.length);

      if (result.success && result.data.creneaux && result.data.creneaux.length > 0) {
        // Retourner le premier créneau disponible de ce jour
        const firstCreneau = result.data.creneaux[0];
        console.log('findFirstAvailableSlot - Créneau trouvé:', firstCreneau);
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

      // Pour le bouton jaune, si la date est complète (maximum de patients atteint),
      // chercher un rendez-vous à échanger
      if (isYellowButton && result.success && result.data.date_complete) {
        console.log("findFirstAvailableSlot - Date complète, recherche d'un rendez-vous à échanger pour:", formattedDate);
        return await findExchangeableAppointment(medecinId, currentDate);
      }

      // Passer au jour suivant
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Pour le bouton jaune, si aucun créneau n'est disponible dans le délai d'1 jour,
    // chercher un rendez-vous à échanger
    if (isYellowButton) {
      console.log("findFirstAvailableSlot - Aucun créneau disponible pour le bouton jaune, recherche d'un rendez-vous à échanger");

      // Vérifier d'abord s'il y a des rendez-vous pour ce médecin
      const allRendezvous = await rendezvousService.getRendezvousByMedecinAndDate(medecinId, null);
      if (allRendezvous.success && allRendezvous.data && allRendezvous.data.length > 0) {
        console.log("findFirstAvailableSlot - Des rendez-vous existent pour ce médecin, recherche d'un rendez-vous à échanger");
        return await findExchangeableAppointment(medecinId, startDate);
      } else {
        console.log("findFirstAvailableSlot - Aucun rendez-vous trouvé pour ce médecin, impossible d'échanger");
      }
    }

    // Aucun créneau trouvé
    console.log('findFirstAvailableSlot - Aucun créneau trouvé');
    return null;
  };

  const findExchangeableAppointment = async (medecinId, startDate) => {
    // Chercher un rendez-vous normal (priorité basse) qui peut être déplacé
    // dans les 7 jours suivants
    const maxDays = 7;
    let currentDate = new Date(startDate);

    // Récupérer les informations du médecin pour vérifier s'il travaille le samedi
    // medecinId est l'ID de l'utilisateur du médecin, on cherche donc par user.id
    const medecin = medecins.find(m => m.user?.id === medecinId || m.id === medecinId);
    const travailleSamedi = medecin && medecin.travaille_samedi === true;

    console.log('findExchangeableAppointment - medecinId:', medecinId, 'startDate:', startDate);
    console.log('findExchangeableAppointment - medecin:', medecin, 'travailleSamedi:', travailleSamedi);

    for (let day = 0; day < maxDays; day++) {
      // Ignorer les dimanches (jour 0 de la semaine)
      if (currentDate.getDay() === 0) {
        console.log('findExchangeableAppointment - Ignorant dimanche:', formatDateForAPI(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Ignorer les samedis si le médecin ne travaille pas le samedi (jour 6 de la semaine)
      if (currentDate.getDay() === 6 && !travailleSamedi) {
        console.log('findExchangeableAppointment - Ignorant samedi (médecin ne travaille pas le samedi):', formatDateForAPI(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      const formattedDate = formatDateForAPI(currentDate);
      console.log('findExchangeableAppointment - Vérifiant rendez-vous pour:', formattedDate);

      // Récupérer tous les rendez-vous pour ce jour
      const result = await rendezvousService.getRendezvousByMedecinAndDate(medecinId, formattedDate);

      if (result.success && result.data) {
        const rendezvousList = Array.isArray(result.data.results) ? result.data.results : result.data;
        console.log('findExchangeableAppointment - Rendez-vous trouvés:', rendezvousList.length);
        console.log('findExchangeableAppointment - Détails des rendez-vous:', rendezvousList);

        // Chercher un rendez-vous avec priorité basse (consultation normale)
        const normalAppointment = rendezvousList.find(rv => 
          rv.priorite === 'basse' && rv.statut !== 'annule' && rv.statut !== 'passe'
        );
        console.log('findExchangeableAppointment - Rendez-vous de priorité basse trouvé:', normalAppointment);
        console.log('findExchangeableAppointment - Structure du rendez-vous:', JSON.stringify(normalAppointment));

      if (normalAppointment) {
        console.log('findExchangeableAppointment - Rendez-vous échangeable trouvé:', normalAppointment.id);

          // Trouver un nouveau créneau pour ce patient (le plus tôt possible)
        const newSlotForPatient = await findFirstAvailableSlotForPatient(medecinId, normalAppointment.patient_id, formattedDate);

        if (newSlotForPatient) {
            // Retourner le créneau libéré pour le patient qui a demandé le suivi
            // ainsi que les informations pour déplacer le rendez-vous de l'autre patient
            return {
              date: formattedDate,
              heure: normalAppointment.heure,
              exchangedAppointmentId: normalAppointment.id,
              newDate: newSlotForPatient.date,
              newHeure: newSlotForPatient.heure
            };
          }
        }
      }

      // Passer au jour suivant
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Aucun rendez-vous échangeable trouvé
    console.log('findExchangeableAppointment - Aucun rendez-vous échangeable trouvé');
    return null;
  };

  const findFirstAvailableSlotForPatient = async (medecinId, patientId, originalDate) => {
    // Chercher le premier créneau disponible pour le patient dont le rendez-vous a été déplacé
    // en commençant par le lendemain de son rendez-vous original
    const maxDays = 30; // Chercher dans les 30 prochains jours
    let currentDate = new Date(originalDate);
    currentDate.setDate(currentDate.getDate() + 1); // Commencer le lendemain

    // Récupérer les informations du médecin pour vérifier s'il travaille le samedi
    // medecinId est l'ID de l'utilisateur du médecin, on cherche donc par user.id
    const medecin = medecins.find(m => m.user?.id === medecinId || m.id === medecinId);
    const travailleSamedi = medecin && medecin.travaille_samedi === true;

    console.log('findFirstAvailableSlotForPatient - medecinId:', medecinId, 'patientId:', patientId, 'originalDate:', originalDate);
    console.log('findFirstAvailableSlotForPatient - medecin:', medecin, 'travailleSamedi:', travailleSamedi);

    for (let day = 0; day < maxDays; day++) {
      // Ignorer les dimanches (jour 0 de la semaine)
      if (currentDate.getDay() === 0) {
        console.log('findFirstAvailableSlotForPatient - Ignorant dimanche:', formatDateForAPI(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Ignorer les samedis si le médecin ne travaille pas le samedi (jour 6 de la semaine)
      if (currentDate.getDay() === 6 && !travailleSamedi) {
        console.log('findFirstAvailableSlotForPatient - Ignorant samedi (médecin ne travaille pas le samedi):', formatDateForAPI(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      const formattedDate = formatDateForAPI(currentDate);
      console.log('findFirstAvailableSlotForPatient - Vérifiant créneaux pour:', formattedDate);
      const result = await rendezvousService.getCreneauxDisponibles(medecinId, formattedDate);
      console.log('findFirstAvailableSlotForPatient - Résultat créneaux disponibles:', result);

      if (result.success && result.data.creneaux && result.data.creneaux.length > 0) {
        // Retourner le premier créneau disponible de ce jour
        const firstCreneau = result.data.creneaux[0];
        console.log('findFirstAvailableSlotForPatient - Créneau trouvé:', firstCreneau);
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
    console.log('findFirstAvailableSlotForPatient - Aucun créneau trouvé');
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

                      {/* Bouton jaune (Suivi) - affiché seulement si le médecin a configuré des suggestions pour le bouton jaune ET que le patient a déjà eu des rendez-vous avec ce médecin qui sont passés */}
                      {(() => {
                        // Filtrer les rendez-vous du patient avec ce médecin
                        const medecinRendezvous = userRendezvous.filter(rdv => 
                          rdv.medecin_id === medecin.id || rdv.medecin === medecin.id || rdv.medecin?.id === medecin.id
                        );
                        
                        // Utiliser la fonction de débogage pour vérifier si le patient a un rendez-vous passé avec ce médecin
                        const hasPastAppointment = hasPastAppointmentWithMedecin(medecin);
                        
                        return medecin.suggestions_config && 
                               medecin.suggestions_config.jaune && 
                               medecin.suggestions_config.jaune.length > 0 && 
                               hasPastAppointment ? (
                          <button
                             className="priority-button priority-button-medium"
                             onClick={() => handleBookAppointment(medecin, 'moyenne')}
                             title="Prendre rendez-vous pour un suivi ou une consultation non urgente"
                          >
                          <span className="priority-icon">⏰</span>
                          <span className="priority-text">Suivi</span>
                          </button>
                        ) : null;
                      })()}

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
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {selectedPriorityType === 'vert' ? (
              <>
                <span className="priority-badge green">Consultation</span>
              </>
            ) : selectedPriorityType === 'jaune' ? (
              <span className="priority-badge yellow">Suivi</span>
            ) : (
              <span className="priority-badge red">Urgence</span>
            )}
          </div>
        }
        showCloseButton={true}
        className="suggestions-modal"
      >
        {selectedMedecin && selectedMedecin.suggestions_config && selectedMedecin.suggestions_config[selectedPriorityType] && (
          <div className="suggestions-list">
            <p>Voici les suggestions pour ce type de rendez-vous :</p>
            {selectedMedecin.suggestions_config[selectedPriorityType].map((suggestionId, index) => {
              // Trouver la suggestion correspondante dans les suggestions pré-définies
              let suggestion = null;
              if (selectedPriorityType === 'vert') {
                suggestion = suggestionsPredefinies.vert.find(s => s.id === suggestionId);
                // Si non trouvé, essayer avec l'index
                if (!suggestion && suggestionsPredefinies.vert[index]) {
                  suggestion = suggestionsPredefinies.vert[index];
                }
              } else if (selectedPriorityType === 'jaune') {
                suggestion = suggestionsPredefinies.jaune.find(s => s.id === suggestionId);
                // Si non trouvé, essayer avec l'index
                if (!suggestion && suggestionsPredefinies.jaune[index]) {
                  suggestion = suggestionsPredefinies.jaune[index];
                }
              } else if (selectedPriorityType === 'rouge') {
                suggestion = suggestionsPredefinies.rouge.find(s => s.id === suggestionId);
                // Si non trouvé, essayer avec l'index
                if (!suggestion && suggestionsPredefinies.rouge[index]) {
                  suggestion = suggestionsPredefinies.rouge[index];
                }
              }
              
              if (!suggestion) return null;
              
              return (
                <div
                  key={suggestion.id || index}
                  className={`suggestion-item ${selectedPriorityType}`}
                >
                  <h4>{suggestion.text}</h4>
                  <p>{suggestion.description}</p>
                </div>
              );
            })}
            
            {/* NB - Avertissement selon le type de priorité */}
            {selectedPriorityType === 'jaune' && (
              <div className="suggestions-warning" style={{
                background: '#fff8e1',
                border: '2px solid #ffc107',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '15px',
                marginTop: '5px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>⚠️</span>
                  <div>
                    <strong style={{ color: '#e65100', fontSize: '14px' }}>NB :</strong>
                    <p style={{ margin: '5px 0 0 0', color: '#333', fontSize: '13px', lineHeight: '1.6' }}>
                      Si votre situation ne correspond pas aux suggestions listées :<br/>
                      (1) une majoration de <strong>2 000 DH</strong> sera appliquée,<br/>
                      (2) vous serez remis dans la file d'attente normale.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedPriorityType === 'rouge' && (
              <div className="suggestions-warning" style={{
                background: '#ffebee',
                border: '2px solid #f44336',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '15px',
                marginTop: '5px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>🚨</span>
                  <div>
                    <strong style={{ color: '#b71c1c', fontSize: '14px' }}>NB :</strong>
                    <p style={{ margin: '5px 0 0 0', color: '#333', fontSize: '13px', lineHeight: '1.6' }}>
                      Si votre cas n'est pas une urgence réelle, le rendez-vous sera reclassé en consultation normale et une majoration de <strong>5 000 DH</strong> sera appliquée pour utilisation injustifiée de la priorité d'urgence.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="suggestions-actions">
              <p>Voulez-vous prendre rendez-vous avec le Dr. {selectedMedecin.nom_complet} ?</p>
              <div className="btn-group">
                <button
                  className="btn btn-primary"
                  onClick={handleAutoBooking}
                  disabled={loadingBooking}
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
