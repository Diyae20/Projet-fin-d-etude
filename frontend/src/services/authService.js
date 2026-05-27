import api from './api';

export const authService = {
  login: async (username, password) => {
    try {
      const response = await api.post(`/auth/login/`, {
        username,
        password
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur de connexion'
      };
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post(`/auth/register/`, userData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Erreur d\'inscription'
      };
    }
  },

  logout: async () => {
    try {
      await api.post(`/auth/logout/`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Erreur lors de la déconnexion'
      };
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get(`/auth/profile/`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: 'Erreur lors de la récupération du profil'
      };
    }
  },

  changePassword: async (oldPassword, newPassword, confirmPassword) => {
    try {
      const response = await api.post(`/auth/change-password/`, {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors du changement de mot de passe'
      };
    }
  },

  deleteAccount: async (password) => {
    try {
      const response = await api.post(`/auth/delete-account/`, {
        password
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la suppression du compte'
      };
    }
  }
};
