import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Alert from '../components/Alert';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    email: '',
    new_password: '',
    confirm_password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Vérifier que les mots de passe correspondent
    if (formData.new_password !== formData.confirm_password) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    // Vérifier la longueur du mot de passe
    if (formData.new_password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/reset-password/', {
        email: formData.email,
        new_password: formData.new_password
      });
      setSuccess('Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.');
      setFormData({
        email: '',
        new_password: '',
        confirm_password: ''
      });
      
      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setError('Cet email n\'existe pas. Veuillez vous inscrire.');
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password">
      <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h2>Réinitialiser le mot de passe</h2>
        <p className="text-muted" style={{ marginBottom: '20px' }}>
          Entrez votre adresse email et votre nouveau mot de passe pour réinitialiser votre compte.
        </p>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Adresse email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="votre@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="new_password">Nouveau mot de passe *</label>
            <input
              type="password"
              id="new_password"
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              required
              minLength="8"
              placeholder="Au moins 8 caractères"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm_password">Confirmer le nouveau mot de passe *</label>
            <input
              type="password"
              id="confirm_password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              required
              minLength="8"
              placeholder="Répétez le mot de passe"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Réinitialisation en cours...' : 'Réinitialiser le mot de passe'}
          </button>
        </form>

        <p style={{ marginTop: '15px', textAlign: 'center' }}>
          <button 
            type="button" 
            className="btn btn-link" 
            onClick={() => navigate('/')}
            style={{ padding: 0 }}
          >
            Retour à la connexion
          </button>
        </p>
        
        <p style={{ marginTop: '10px', textAlign: 'center' }}>
          Pas encore de compte ? <button 
            type="button" 
            className="btn btn-link" 
            onClick={() => navigate('/register')}
            style={{ padding: 0 }}
          >
            S'inscrire
          </button>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
