import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté au chargement
    const token = sessionStorage.getItem('token');
    const userData = sessionStorage.getItem('user');

    if (token && userData) {
      setUser(JSON.parse(userData));
      // Configurer axios pour inclure le token dans toutes les requêtes
      api.defaults.headers.common['Authorization'] = `Token ${token}`;
    }

    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login/', {
        username,
        password
      });

      const { token, user } = response.data;

      // Stocker le token et les informations utilisateur dans sessionStorage (isolé par onglet)
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));

      // Configurer api
      api.defaults.headers.common['Authorization'] = `Token ${token}`;

      setUser(user);
      return { success: true, user: user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur de connexion'
      };
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    sessionStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const register = async (userData) => {
    try {
      console.log("Envoi de la requête d'inscription à /api/auth/register/");
      const response = await api.post('/auth/register/', userData);
      console.log("Réponse de l'API:", response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      console.error("Détails de l'erreur:", error.response?.data);
      return {
        success: false,
        error: error.response?.data || 'Erreur d\'inscription'
      };
    }
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const changePassword = async (oldPassword, newPassword, confirmPassword) => {
    try {
      const response = await api.post('/auth/change-password/', {
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
  };

  const deleteAccount = async (password) => {
    try {
      const response = await api.post('/auth/delete-account/', {
        password
      });
      // Nettoyer le sessionStorage après la suppression du compte
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la suppression du compte'
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    changePassword,
    deleteAccount,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
