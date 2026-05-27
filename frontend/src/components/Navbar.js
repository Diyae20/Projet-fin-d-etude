import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        Rendez-vous Médicaux
      </Link>
      <div className="navbar-nav">
        {user ? (
          <>
            {user.role === 'patient' && (
              <Link to="/medecins">Médecins</Link>
            )}
            {user.role === 'medecin' && (
              <Link to="/dashboard/medecin">Mon Espace Médecin</Link>
            )}
            {user.role === 'reception' && (
              <Link to="/reception/dashboard">Espace Réception</Link>
            )}
            {user.role === 'patient' && (
              <Link to="/rendezvous">Mes Rendez-vous</Link>
            )}
            {user.role === 'patient' && (
              <Link to="/patient/rendezvous/history">Historique</Link>
            )}
            <Link to="/change-password">Changer mot de passe</Link>
            <Link to="/delete-account" style={{ color: '#dc3545' }}>Supprimer mon compte</Link>
            <span>Bonjour, {user.first_name}</span>
            <button onClick={handleLogout} className="btn btn-secondary">
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <Link to="/">Connexion</Link>
            <Link to="/register">Inscription</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
