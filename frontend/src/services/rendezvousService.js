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

  // Créer un nouveau rendez-vous
  createRendezvous: async (rendezvousData) => {
    try {
      const response = await api.post('/rendezvous/', rendezvousData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Erreur complète lors de la création du rendez-vous:', error);
      console.error('Réponse du serveur:', error.response);
      console.error('Données de la réponse:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.message || 'Erreur lors de la création du rendez-vous'
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
      const response = await api.get(`/rendezvous/disponibles/`, {
        params: {
          medecin_id: medecinId,
          date: date
        }
      });
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
  }
};
