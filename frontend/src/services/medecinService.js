import api from './api';

export const medecinService = {
  // Récupérer la liste des médecins avec filtres
  getMedecins: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.specialite) params.append('specialite', filters.specialite);
      if (filters.ville) params.append('ville', filters.ville);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/medecins/?${params.toString()}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur lors de la récupération des médecins'
      };
    }
  },

  // Récupérer les détails d'un médecin
  getMedecinDetail: async (id) => {
    try {
      const response = await api.get(`/medecins/${id}/`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur lors de la récupération des détails du médecin'
      };
    }
  },



  // Récupérer la liste des spécialités
  getSpecialites: async () => {
    try {
      const response = await api.get('/medecins/specialites/');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur lors de la récupération des spécialités'
      };
    }
  },

  // Récupérer le profil du médecin connecté
  getMedecinProfile: async () => {
    try {
      const response = await api.get('/medecins/profile/');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur lors de la récupération de votre profil médecin'
      };
    }
  },

  // Mettre à jour le profil du médecin connecté
  updateMedecinProfile: async (profileData) => {
    try {
      // Si profileData est une instance de FormData, configurer les en-têtes appropriés
      const isFormData = profileData instanceof FormData;
      const config = isFormData ? {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      } : {};

      // Journaliser les données envoyées pour le débogage
      if (isFormData) {
        console.log('Données FormData envoyées:');
        for (let pair of profileData.entries()) {
          console.log(pair[0], pair[1]);
        }
      }

      const response = await api.put('/medecins/profile/', profileData, config);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Erreur lors de la mise à jour de votre profil médecin'
      };
    }
  },

};
