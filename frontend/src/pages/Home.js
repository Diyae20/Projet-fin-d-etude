import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { user } = useAuth();

  // Rediriger les médecins vers leur tableau de bord
  if (user && user.role === 'medecin') {
    return <Navigate to="/dashboard/medecin" replace />;
  }

  return (
    <div className="home">
      <div className="card">
        <h1>Bienvenue sur Rendez-vous Médicaux</h1>
        <p>
          Prenez facilement rendez-vous avec des médecins de votre région.
        </p>

        {!user ? (
          <div style={{ marginTop: '20px' }}>
            <Link to="/register" className="btn btn-primary">
              Créer un compte
            </Link>
            <Link to="/" className="btn btn-secondary" style={{ marginLeft: '10px' }}>
              Se connecter
            </Link>
          </div>
        ) : (
          <div style={{ marginTop: '20px' }}>
            <Link to="/medecins" className="btn btn-primary">
              Trouver un médecin
            </Link>
            <Link to="/rendezvous" className="btn btn-secondary" style={{ marginLeft: '10px' }}>
              Mes rendez-vous
            </Link>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Comment ça marche ?</h2>
        <div style={{ marginTop: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <h3>1. Créez votre compte</h3>
            <p>Inscrivez-vous en quelques secondes pour accéder à tous nos services.</p>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <h3>2. Trouvez un médecin</h3>
            <p>Parcourez notre liste de médecins et filtrez par spécialité ou ville.</p>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <h3>3. Prenez rendez-vous</h3>
            <p>Choisissez le créneau qui vous convient le mieux parmi les disponibilités.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
