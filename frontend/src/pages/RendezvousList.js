import React, { useState, useEffect } from 'react';
import { rendezvousService } from '../services/rendezvousService';
import { userService } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';
import Loading from '../components/Loading';
import Alert from '../components/Alert';

const RendezvousList = () => {
  const { user, updateUser } = useAuth();
  const [rendezvous, setRendezvous] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address: '',
    city: '',
    photo: null
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [originalPhoto, setOriginalPhoto] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  useEffect(() => {
    fetchRendezvous();
    initializeFormData();
  }, [user]);

  const initializeFormData = () => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        date_of_birth: user.date_of_birth || '',
        address: user.address || '',
        city: user.city || '',
        photo: null
      });
      // Afficher la photo de profil actuelle
      if (user.photo) {
        const photoUrl = `${user.photo}?t=${new Date().getTime()}`;
        setPhotoPreview(photoUrl);
        setOriginalPhoto(photoUrl);
      } else {
        setPhotoPreview(null);
        setOriginalPhoto(null);
      }
      setRemovePhoto(false);
    }
  };

  const fetchRendezvous = async () => {
    setLoading(true);
    setError('');

    const result = await rendezvousService.getRendezvous();

    if (result.success) {
      setRendezvous(result.data.results || result.data);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
      return;
    }

    setCancellingId(id);
    setError('');

    const result = await rendezvousService.cancelRendezvous(id);

    if (result.success) {
      setSuccess('Rendez-vous annulé avec succès');
      fetchRendezvous();
    } else {
      setError(result.error);
    }

    setCancellingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier que le fichier est une image
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner une image valide');
        return;
      }
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("L'image ne doit pas dépasser 5MB");
        return;
      }
      // Créer un aperçu de l'image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setFormData({
        ...formData,
        photo: file
      });
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setRemovePhoto(true);
    setFormData({
      ...formData,
      photo: null
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Préparer les données à envoyer
    const formDataToSend = new FormData();
    formDataToSend.append('first_name', formData.first_name);
    formDataToSend.append('last_name', formData.last_name);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('phone', formData.phone);
    if (formData.date_of_birth) {
      formDataToSend.append('date_of_birth', formData.date_of_birth);
    }
    if (formData.address) {
      formDataToSend.append('address', formData.address);
    }
    if (formData.city) {
      formDataToSend.append('city', formData.city);
    }

    // Ajouter la photo si elle a été modifiée
    if (formData.photo) {
      formDataToSend.append('photo', formData.photo);
    }
    // Marquer la suppression de la photo si nécessaire
    else if (removePhoto) {
      formDataToSend.append('remove_photo', 'true');
    }

    const result = await userService.updateUserProfile(formDataToSend);

    if (result.success) {
      setSuccess('Profil mis à jour avec succès !');
      setEditMode(false);
      // Mettre à jour les informations de l'utilisateur dans le contexte
      updateUser(result.data);
      // Si la photo a été supprimée, mettre à jour l'aperçu immédiatement
      if (removePhoto) {
        setPhotoPreview(null);
        setOriginalPhoto(null);
        setRemovePhoto(false);
      } else {
        initializeFormData();
      }
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const getStatutClass = (statut) => {
    switch (statut) {
      case 'confirme':
        return 'statut-confirme';
      case 'annule':
        return 'statut-annule';
      case 'en_attente':
        return 'statut-en_attente';
      case 'passe':
        return 'statut-passe';
      default:
        return '';
    }
  };

  const getStatutLabel = (statut) => {
    switch (statut) {
      case 'confirme':
        return 'Confirmé';
      case 'annule':
        return 'Annulé';
      case 'en_attente':
        return 'En attente';
      case 'passe':
        return 'Passé';
      default:
        return statut;
    }
  };

  if (loading) {
    return <Loading message="Chargement de vos rendez-vous..." />;
  }

  return (
    <div className="rendezvous-list">
      <h1>Mes rendez-vous</h1>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <div className="card">
            <h2>Mes Informations</h2>

            {editMode ? (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="photo">Photo de profil</label>
                  <div className="photo-upload-container">
                    <div className="photo-preview-container">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Aperçu de la photo de profil"
                          style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            marginRight: '20px'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100px',
                          height: '100px',
                          borderRadius: '50%',
                          backgroundColor: '#e9ecef',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '20px',
                          fontSize: '40px'
                        }}>
                          👤
                        </div>
                      )}
                    </div>
                    <div className="photo-actions">
                      <input
                        type="file"
                        id="photo"
                        name="photo"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => document.getElementById('photo').click()}
                      >
                        {photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
                      </button>
                      {photoPreview && (
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={handleRemovePhoto}
                        >
                          Supprimer la photo
                        </button>
                      )}
                    </div>
                    <small className="form-text text-muted">
                      Formats acceptés: JPG, PNG, GIF. Taille maximale: 5MB
                    </small>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="first_name">Prénom *</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Votre prénom"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="last_name">Nom *</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Votre nom"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Votre email"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Téléphone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Votre numéro de téléphone"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="date_of_birth">Date de naissance</label>
                  <input
                    type="date"
                    id="date_of_birth"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address">Adresse</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Votre adresse"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="city">Ville</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Votre ville"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    setEditMode(false);
                    setPhotoPreview(originalPhoto);
                    setRemovePhoto(false);
                    setFormData({
                      ...formData,
                      photo: null
                    });
                  }}>
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-view">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    backgroundColor: '#e9ecef',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '20px',
                    fontSize: '40px',
                    overflow: 'hidden'
                  }}>
                    {user && user.photo ? (
                      <img
                        src={`${user.photo}?t=${new Date().getTime()}`}
                        alt={`${user.first_name} ${user.last_name}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span>👤</span>
                    )}
                  </div>
                  <div>
                    <p><strong>Prénom:</strong> {user ? user.first_name : ''}</p>
                    <p><strong>Nom:</strong> {user ? user.last_name : ''}</p>
                    <p><strong>Email:</strong> {user ? user.email : ''}</p>
                    <p><strong>Téléphone:</strong> {user ? (user.phone || 'Non spécifié') : ''}</p>
                    <p><strong>Rôle:</strong> {user ? user.role : ''}</p>
                    <p><strong>Date de création:</strong> {user ? new Date(user.created_at).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : ''}</p>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => setEditMode(true)}>
                  Modifier mon profil
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-section">
          <div className="card">
            <h2>Mes Rendez-vous</h2>

            {rendezvous.length === 0 ? (
              <p>Vous n'avez pas encore de rendez-vous.</p>
            ) : (
              <div className="rendezvous-list">
                {rendezvous.map(rdv => (
                  <div key={rdv.id} className="rendezvous-item">
                    <div className="rendezvous-info">
                      <div className="rendezvous-date">
                        📅 {new Date(rdv.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })} à {rdv.heure}
                      </div>
                      <div className="rendezvous-medecin">
                        👨‍⚕️ Dr. {rdv.medecin_nom}
                      </div>
                      {rdv.motif && (
                        <div className="rendezvous-motif">
                          📝 {rdv.motif}
                        </div>
                      )}
                      <span className={`rendezvous-statut ${getStatutClass(rdv.statut)}`}>
                        {getStatutLabel(rdv.statut)}
                      </span>
                    </div>

                    {rdv.statut === 'confirme' || rdv.statut === 'en_attente' ? (
                      <button
                        className="btn btn-danger"
                        onClick={() => handleCancel(rdv.id)}
                        disabled={cancellingId === rdv.id}
                      >
                        {cancellingId === rdv.id ? 'Annulation...' : 'Annuler'}
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RendezvousList;
