import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Alert from '../components/Alert';

const DeleteAccount = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { deleteAccount } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setPassword(e.target.value);
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await deleteAccount(password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="delete-account">
      <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <h2>Supprimer mon compte</h2>
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {!showConfirmation ? (
          <div>
            <p style={{ marginBottom: '20px' }}>
              Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.
            </p>
            <button
              onClick={() => setShowConfirmation(true)}
              className="btn btn-danger"
              style={{ width: '100%' }}
            >
              Oui, je veux supprimer mon compte
            </button>
          </div>
        ) : (
          <form onSubmit={handleDelete}>
            <p style={{ marginBottom: '20px' }}>
              Pour confirmer la suppression de votre compte, veuillez entrer votre mot de passe :
            </p>
            <div className="form-group">
              <label htmlFor="password">Mot de passe *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={handleChange}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmation(false);
                  setPassword('');
                }}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-danger"
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? 'Suppression...' : 'Confirmer la suppression'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default DeleteAccount;
