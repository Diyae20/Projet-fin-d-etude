import api from './api';

export const userService = {
  // Récupérer le profil de l'utilisateur connecté
  getUserProfile: async () => {
    try {
      const response = await api.get('/users/profile/');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Impossible de récupérer votre profil. Veuillez réessayer.'
      };
    }
  },

  // Mettre à jour le profil de l'utilisateur
  updateUserProfile: async (userData) => {
    try {
      const response = await api.put('/users/profile/', userData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Impossible de mettre à jour votre profil. Veuillez réessayer.'
      };
    }
  },

  // Changer le mot de passe
  changePassword: async (passwordData) => {
    try {
      const response = await api.post('/users/change-password/', passwordData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Impossible de changer votre mot de passe. Veuillez réessayer.'
      };
    }
  },

  // Supprimer le compte
  deleteAccount: async () => {
    try {
      const response = await api.delete('/users/account/');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Impossible de supprimer votre compte. Veuillez réessayer.'
      };
    }
  }
};
