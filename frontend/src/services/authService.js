import axios from 'axios';

const API_BASE_URL = '/api/auth';

export const authService = {
  login: async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login/`, {
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
      const response = await axios.post(`${API_BASE_URL}/register/`, userData);
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
      await axios.post(`${API_BASE_URL}/logout/`);
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
      const response = await axios.get(`${API_BASE_URL}/profile/`);
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
      const response = await axios.post(`${API_BASE_URL}/change-password/`, {
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
      const response = await axios.post(`${API_BASE_URL}/delete-account/`, {
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
