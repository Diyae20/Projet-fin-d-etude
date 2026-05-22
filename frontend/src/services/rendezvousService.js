import api from './api';

export const rendezvousService = {
  // Récupérer la liste des rendez-vous
  getRendezvous: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.statut) params.append('statut', filters.statut);
      if (filters.date) params.append('date', filters.date);
      if (filters.medecin) params.append('medecin', filters.medecin);

      const response = await api.get(`/rendezvous/?${params.toString()}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur lors de la récupération des rendez-vous'
      };
    }
  },

  // Récupérer tous les rendez-vous du patient, y compris ceux passés
  getAllRendezvousIncludingPast: async () => {
    try {
      const response = await api.get('/rendezvous/patient/all/');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur lors de la récupération des rendez-vous'
      };
    }
  },

  // Créer un nouveau rendez-vous
  createRendezvous: async (rendezvousData) => {
    try {
      // Vérifier que le créneau horaire existe dans la liste des créneaux disponibles
      if (rendezvousData.medecin_id && rendezvousData.date && rendezvousData.heure) {
        const creneauxResult = await rendezvousService.getCreneauxDisponibles(rendezvousData.medecin_id, rendezvousData.date);
        if (creneauxResult.success && creneauxResult.data.creneaux) {
          const creneauExists = creneauxResult.data.creneaux.some(
            creneau => creneau.heure === rendezvousData.heure
          );
          if (!creneauExists) {
            return {
              success: false,
              error: `Le créneau horaire ${rendezvousData.heure} n\'est pas disponible pour cette date.`
            };
          }
        }
      }
      
      // Convertir les IDs en chaînes de caractères pour éviter les problèmes de type
      const formattedData = {
        ...rendezvousData,
        medecin_id: String(rendezvousData.medecin_id),
        patient_id: String(rendezvousData.patient_id)
      };
      console.log('Données envoyées pour la création du rendez-vous:', formattedData);
      const response = await api.post('/rendezvous/', formattedData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Erreur complète lors de la création du rendez-vous:', error);
      console.error('Réponse du serveur:', error.response);
      console.error('Données de la réponse:', error.response?.data);
      console.error('Statut de la réponse:', error.response?.status);
      console.error('Données envoyées:', rendezvousData);
      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.message || error.response?.data?.error || 'Erreur lors de la création du rendez-vous'
      };
    }
  },

  // Annuler un rendez-vous
  cancelRendezvous: async (id) => {
    try {
      const response = await api.patch(`/rendezvous/${id}/`, {
        statut: 'annule'
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: 'Erreur lors de l\'annulation du rendez-vous'
      };
    }
  },

  // Récupérer les créneaux disponibles pour un médecin à une date donnée
  getCreneauxDisponibles: async (medecinId, date) => {
    try {
      const params = new URLSearchParams();
      if (medecinId) params.append('medecin_id', medecinId);
      if (date) params.append('date', date);

      const response = await api.get(`/rendezvous/disponibles/?${params.toString()}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: 'Erreur lors de la récupération des créneaux disponibles'
      };
    }
  },



  // Récupérer les détails d'un rendez-vous
  getRendezvousDetail: async (id) => {
    try {
      const response = await api.get(`/rendezvous/${id}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: 'Erreur lors de la récupération des détails du rendez-vous'
      };
    }
  },

  // Récupérer les rendez-vous du médecin connecté
  getMedecinRendezvous: async () => {
    try {
      const response = await api.get('/rendezvous/medecin/');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur lors de la récupération de vos rendez-vous'
      };
    }
  },

  // Récupérer les rendez-vous par URL (pour la pagination)
  getMedecinRendezvousByUrl: async (url) => {
    try {
      const response = await api.get(url);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur lors de la récupération des rendez-vous'
      };
    }
  },

  // Mettre à jour le statut d'un rendez-vous
  updateRendezvousStatut: async (id, statutData) => {
    try {
      const response = await api.patch(`/rendezvous/${id}/`, statutData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur lors de la mise à jour du statut du rendez-vous'
      };
    }
  },

  // Mettre à jour les notes d'un rendez-vous
  updateRendezvousNotes: async (id, notesData) => {
    try {
      const response = await api.patch(`/rendezvous/${id}/`, notesData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur lors de la mise à jour des notes du rendez-vous'
      };
    }
  },

  // Récupérer les disponibilités par jour pour un médecin
  getMedecinDisponibiliteParJour: async (medecinId, dateDebut = null, dateFin = null) => {
    try {
      const params = {
        medecin_id: medecinId
      };
      if (dateDebut) params.date_debut = dateDebut;
      if (dateFin) params.date_fin = dateFin;

      const response = await api.get('/rendezvous/disponibilite-par-jour/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur lors de la récupération des disponibilités'
      };
    }
  },

  // Supprimer un rendez-vous
  deleteRendezvous: async (id) => {
    try {
      const response = await api.delete(`/rendezvous/${id}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur lors de la suppression du rendez-vous'
      };
    }
  },

  // Mettre à jour la date et l'heure d'un rendez-vous
  updateRendezvousDateTime: async (id, date, heure) => {
    try {
      const response = await api.patch(`/rendezvous/${id}/update-datetime/`, { date, heure });
      return { success: true, data: response.data };
    } catch (error) {
      console.log('updateRendezvousDataTime - Erreur:', error);
      return {success: false, error};
    }
  },

  // Récupérer tous les rendez-vous d'un médecin pour une date spécifique
  getRendezvousByMedecinAndDate: async (medecinId, date) => {
    try {
      console.log('getRendezvousByMedecinAndDate - medecinId:', medecinId, 'date:', date);

      // Utiliser la nouvelle route publique pour les patients
      const params = new URLSearchParams();
      // Ne pas filtrer par date pour récupérer tous les rendez-vous
      // if (date) params.append('date', date);

      const response = await api.get(`/rendezvous/medecin/${medecinId}/public/?${params.toString()}`);
      const rendezvous = Array.isArray(response.data) ? response.data : [];
      console.log('getRendezvousByMedecinAndDate - Rendez-vous du médecin pour cette date:', rendezvous);

      // Filtrer les rendez-vous par date côté client
      let filteredRendezvous = rendezvous;
      if (date) {
        filteredRendezvous = rendezvous.filter(rdv => rdv.date === date);
      }
      console.log('getRendezvousByMedecinAndDate - Rendez-vous filtrés par date:', filteredRendezvous);

      return { success: true, data: filteredRendezvous };
    } catch (error) {
      console.log('getRendezvousByMedecinAndDate - Erreur:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur lors de la récupération des rendez-vous'
      };
    }
  },

  // Envoyer une notification au patient dont le rendez-vous a été modifié
  notifyRendezvousChanged: async (id, oldDate, oldHeure, newDate, newHeure) => {
    try {
      const response = await api.post(`/rendezvous/${id}/notify-change/`, {
        oldDate,
        oldHeure,
        newDate,
        newHeure
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.log('notifyRendezvousChanged - Erreur:', error);
      return {success: false, error };
    }
  },

  // Échanger un rendez-vous automatiquement
  exchangeRendezvous: async (patientId, oldRdvId, newDate, newHeure) => {
    try {
      const response = await api.post('/rendezvous/exchange/', {
       patient_id: patientId,
       old_rdv_id: oldRdvId,
       new_date: newDate,
       new_heure: newHeure
      });
      return { success: true, data: response.data };
    } catch (error) {
     console.error('Erreur lors de l\'échange de rendez-vous:', error);
     return {
       success: false,
       error: error.response?.data?.error || 'Erreur lors de l\'échange de rendez-vous'
    };
   }
 },
   // Créer un rendez-vous de priorité (en échangeant un rendez-vous existant)
  priorityBooking: async (medecinId, patientId, priority, typeConsultation = null, delayDays = 0) => {
    try {
      const response = await api.post('/rendezvous/priority-booking/', {
        medecin_id: medecinId,
        patient_id: patientId,
        priority: priority,
        type_consultation: typeConsultation,
        delay_days: delayDays
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Erreur lors de la création du rendez-vous de priorité:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la création du rendez-vous de priorité'
      };
    }
  },
  // Créer un rendez-vous d'urgence (en échangeant directement un rendez-vous de priorité basse)
  emergencyBooking: async (medecinId, patientId, priority, typeConsultation = null) => {
    try {
      const response = await api.post('/rendezvous/emergency-booking/', {
        medecin_id: medecinId,
        patient_id: patientId,
        priority: priority,
        type_consultation: typeConsultation
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Erreur lors de la création du rendez-vous d\'urgence:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la création du rendez-vous d\'urgence'
      };
    }
  },
    // Recuperer les notifications urgentes
  getNotificationsUrgentes: async () => {
    try {
      const response = await api.get('/rendezvous/notifications/urgentes/');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: 'Erreur lors de la recuperation des notifications'
      };
    }
  },

  // Marquer une notification comme lue
  markNotificationLue: async (id) => {
    try {
      const response = await api.patch(`/rendezvous/notifications/urgentes/${id}/lue/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: 'Erreur' };
    }
  },

  // Acquitter une notification
  acquitterNotification: async (id) => {
    try {
      const response = await api.patch(`/rendezvous/notifications/urgentes/${id}/acquitter/`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: 'Erreur' };
    }
  },

  // Acquitter toutes les notifications
  acquitterAllNotifications: async () => {
    try {
      const response = await api.patch('/rendezvous/notifications/urgentes/acquitter-all/');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: 'Erreur' };
    }
  },
};
