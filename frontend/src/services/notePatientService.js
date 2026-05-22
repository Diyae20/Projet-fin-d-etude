import api from './api';

/**
 * Service pour gérer les notes des patients
 */
const notePatientService = {
  /**
   * Récupérer toutes les notes du médecin connecté
   * @param {number} patientId - ID du patient (optionnel)
   * @returns {Promise} - Promesse avec les notes
   */
  getNotes: async (patientId = null) => {
    try {
      const params = patientId ? { patient_id: patientId } : {};
      const response = await api.get('/rendezvous/notes/', { params });
      return {
        success: true,
        data: response.data.results || response.data
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des notes:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur lors de la récupération des notes'
      };
    }
  },

  /**
   * Récupérer une note spécifique
   * @param {number} noteId - ID de la note
   * @returns {Promise} - Promesse avec la note
   */
  getNote: async (noteId) => {
    try {
      const response = await api.get(`/rendezvous/notes/${noteId}/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de la note:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur lors de la récupération de la note'
      };
    }
  },

  /**
   * Créer ou mettre à jour une note pour un patient
   * @param {number} patientId - ID du patient
   * @param {string} contenu - Contenu de la note
   * @returns {Promise} - Promesse avec la note créée ou mise à jour
   */
  createOrUpdateNote: async (patientId, contenu) => {
    try {
      const response = await api.post('/rendezvous/notes/', {
        patient_id: patientId,
        contenu: contenu
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erreur lors de la création/mise à jour de la note:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur lors de la création/mise à jour de la note'
      };
    }
  },

  /**
   * Mettre à jour une note existante
   * @param {number} noteId - ID de la note
   * @param {string} contenu - Nouveau contenu de la note
   * @returns {Promise} - Promesse avec la note mise à jour
   */
  updateNote: async (noteId, contenu) => {
    try {
      const response = await api.put(`/rendezvous/notes/${noteId}/`, {
        contenu: contenu
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la note:', error);
      console.error("Détails de l'erreur:", error.response?.data);
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur lors de la mise à jour de la note'
      };
    }
  },

  /**
   * Supprimer une note
   * @param {number} noteId - ID de la note
   * @returns {Promise} - Promesse de suppression
   */
  deleteNote: async (noteId) => {
    try {
      await api.delete(`/rendezvous/notes/${noteId}/`);
      return {
        success: true
      };
    } catch (error) {
      console.error('Erreur lors de la suppression de la note:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur lors de la suppression de la note'
      };
    }
  }
};

export default notePatientService;
