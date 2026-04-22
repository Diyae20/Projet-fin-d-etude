import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { medecinService } from '../services/medecinService';
import { rendezvousService } from '../services/rendezvousService';
import Loading from '../components/Loading';
import Alert from '../components/Alert';

const MedecinDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [medecinProfile, setMedecinProfile] = useState(null);
  const [specialites, setSpecialites] = useState([]);
  const [rendezvous, setRendezvous] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    specialite: '',
    bio: '',
    adresse_cabinet: '',
    telephone: '',
    ville: '',
    duree_consultation: 30,
    max_patients_par_jour: 10,
    photo: null
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [originalPhoto, setOriginalPhoto] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [showSuggestionsWarning, setShowSuggestionsWarning] = useState(false);

  useEffect(() => {
    fetchMedecinProfile();
    fetchSpecialites();
    fetchRendezvous();
  }, []);

  const fetchMedecinProfile = async () => {
    setLoading(true);
    setError('');

    const result = await medecinService.getMedecinProfile();

    if (result.success) {
      setMedecinProfile(result.data);
      setFormData({
        specialite: result.data.specialite?.nom || '',
        bio: result.data.bio || '',
        adresse_cabinet: result.data.adresse_cabinet || '',
        telephone: result.data.telephone || '',
        ville: result.data.ville || '',
        duree_consultation: result.data.duree_consultation || 30,
        max_patients_par_jour: result.data.max_patients_par_jour || 10,
        photo: null
      });
      // Afficher la photo de profil actuelle
      if (result.data.user?.photo) {
        // Ajouter un horodatage pour éviter le cache du navigateur
        const photoUrl = `${result.data.user.photo}?t=${new Date().getTime()}`;
        setPhotoPreview(photoUrl);
        setOriginalPhoto(photoUrl);
      } else {
        setPhotoPreview(null);
        setOriginalPhoto(null);
      }
      setRemovePhoto(false);

      // Vérifier si le médecin a configuré les suggestions pour au moins un bouton
      const suggestionsConfig = result.data.suggestions_config;
      if (suggestionsConfig) {
        const hasVertSuggestions = suggestionsConfig.vert && suggestionsConfig.vert.length > 0;
        const hasJauneSuggestions = suggestionsConfig.jaune && suggestionsConfig.jaune.length > 0;
        const hasRougeSuggestions = suggestionsConfig.rouge && suggestionsConfig.rouge.length > 0;

        // Ne plus afficher l'avertissement si au moins une suggestion est configurée
        if (hasVertSuggestions || hasJauneSuggestions || hasRougeSuggestions) {
          setShowSuggestionsWarning(false);
        } else {
          // Si aucune suggestion n'est configurée, afficher l'avertissement
          setShowSuggestionsWarning(true);
        }
      } else {
        // Si pas de configuration de suggestions, afficher l'avertissement
        setShowSuggestionsWarning(true);
      }
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const fetchSpecialites = async () => {
    const result = await medecinService.getSpecialites();

    if (result.success) {
      // S'assurer que specialites est un tableau
      const specialitesArray = Array.isArray(result.data) ? result.data : [];
      setSpecialites(specialitesArray);
    } else {
      setError(result.error);
    }
  };

  const fetchRendezvous = async () => {
    const result = await rendezvousService.getMedecinRendezvous();

    if (result.success) {
      setRendezvous(result.data.results || result.data);
    } else {
      setError(result.error);
    }
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
    formDataToSend.append('specialite_nom', formData.specialite);
    formDataToSend.append('bio', formData.bio);
    formDataToSend.append('adresse_cabinet', formData.adresse_cabinet);
    formDataToSend.append('telephone', formData.telephone);
    formDataToSend.append('ville', formData.ville);
    formDataToSend.append('duree_consultation', formData.duree_consultation);
    formDataToSend.append('max_patients_par_jour', formData.max_patients_par_jour);

    // Journaliser pour le débogage
    console.log('removePhoto:', removePhoto);
    console.log('formData.photo:', formData.photo);
    console.log('originalPhoto:', originalPhoto);
    console.log('photoPreview:', photoPreview);

    // Ajouter la photo si elle a été modifiée
    if (formData.photo) {
      formDataToSend.append('photo', formData.photo);
    }
    // Marquer la suppression de la photo si nécessaire
    else if (removePhoto) {
      formDataToSend.append('remove_photo', 'true');
      console.log('Ajout du paramètre remove_photo: true');
    }

    const result = await medecinService.updateMedecinProfile(formDataToSend);

    console.log('Résultat de la mise à jour:', result);

    if (result.success) {
      console.log('Données du profil mis à jour:', result.data);
      setSuccess('Profil mis à jour avec succès !');
      setEditMode(false);
      // Si la photo a été supprimée, mettre à jour l'aperçu immédiatement
      if (removePhoto) {
        // Mettre à jour le profil pour supprimer la photo de l'affichage
        setMedecinProfile(prev => {
          if (prev && prev.user) {
            return {
              ...prev,
              user: {
                ...prev.user,
                photo: null
              }
            };
          }
          return prev;
        });
        setPhotoPreview(null);
        setOriginalPhoto(null);
        setRemovePhoto(false);
      } else {
        fetchMedecinProfile();
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

  const handleUpdateStatut = async (id, nouveauStatut) => {
    const result = await rendezvousService.updateRendezvousStatut(id, { statut: nouveauStatut });

    if (result.success) {
      setSuccess('Statut du rendez-vous mis à jour avec succès !');
      fetchRendezvous();
    } else {
      setError(result.error);
    }
  };

  if (loading && !medecinProfile) {
    return <Loading message="Chargement de votre tableau de bord..." />;
  }

  return (
    <div className="medecin-dashboard">
      {!editMode && <h1>Tableau de bord - Médecin</h1>}
      
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {showSuggestionsWarning && !editMode && (
        <div style={{
          marginBottom: '20px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          padding: '20px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            zIndex: '0'
          }}></div>
          <div style={{ position: 'relative', zIndex: '1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: '1', paddingRight: '15px' }}>
                <h4 style={{ 
                  marginTop: '0', 
                  marginBottom: '15px',
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>⚙️</span>
                  Configuration des suggestions requise
                </h4>
                <p style={{ marginBottom: '12px', fontSize: '1rem', lineHeight: '1.5' }}>
                  Vous n'avez pas encore configuré les suggestions pour tous les boutons (vert, jaune et rouge). 
                  Pour que ces boutons s'affichent pour vos patients, vous devez configurer au moins une suggestion pour chaque bouton.
                </p>
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '15px',
                  flexWrap: 'wrap'
                }}>
                  <button
                    className="btn btn-light"
                    onClick={() => navigate('/dashboard/medecin/suggestions')}
                    style={{
                      fontWeight: '500',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      border: 'none'
                    }}
                  >
                    Configurer les suggestions
                  </button>
                  <button 
                    className="btn btn-outline-light"
                    onClick={() => {
                      setShowSuggestionsWarning(false);
                    }}
                    style={{
                      borderRadius: '8px',
                      padding: '8px 16px',
                      borderColor: 'rgba(255, 255, 255, 0.5)'
                    }}
                  >
                    Ignorer ce message
                  </button>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowSuggestionsWarning(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0',
                  lineHeight: '1',
                  opacity: '0.7',
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={(e) => e.target.style.opacity = '1'}
                onMouseOut={(e) => e.target.style.opacity = '0.7'}
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <div className="card">
            <h2>Mon Profil</h2>

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
                          👨‍⚕️
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
                  <label htmlFor="specialite">Spécialité *</label>
                  <input
                    type="text"
                    id="specialite"
                    name="specialite"
                    value={formData.specialite}
                    onChange={handleInputChange}
                    required
                    placeholder="Votre spécialité médicale"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bio">Biographie / Présentation</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Décrivez votre parcours et vos domaines d'expertise..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="adresse_cabinet">Adresse du cabinet</label>
                  <textarea
                    id="adresse_cabinet"
                    name="adresse_cabinet"
                    value={formData.adresse_cabinet}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Adresse complète de votre cabinet..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="telephone">Téléphone du cabinet</label>
                  <input
                    type="tel"
                    id="telephone"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleInputChange}
                    placeholder="Numéro de téléphone de votre cabinet..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ville">Ville</label>
                  <input
                    type="text"
                    id="ville"
                    name="ville"
                    value={formData.ville}
                    onChange={handleInputChange}
                    placeholder="Ville où vous exercez..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="duree_consultation">Durée moyenne de consultation (minutes)</label>
                  <input
                    type="number"
                    id="duree_consultation"
                    name="duree_consultation"
                    value={formData.duree_consultation}
                    onChange={handleInputChange}
                    min="5"
                    max="120"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="max_patients_par_jour">Nombre maximum de patients par jour</label>
                  <input
                    type="number"
                    id="max_patients_par_jour"
                    name="max_patients_par_jour"
                    value={formData.max_patients_par_jour}
                    onChange={handleInputChange}
                    min="1"
                    max="50"
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
                <div className="profile-photo-container">
                  {photoPreview ? (
                    <img 
                      src={photoPreview} 
                      alt="Photo de profil" 
                      style={{ 
                        width: '100px', 
                        height: '100px', 
                        borderRadius: '50%', 
                        objectFit: 'cover' 
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
                      fontSize: '40px'
                    }}>
                      👨‍⚕️
                    </div>
                  )}
                </div>
                <div className="profile-info">
                  <p><strong>Spécialité:</strong> {medecinProfile?.specialite?.nom || 'Non spécifié'}</p>
                  {medecinProfile?.bio && <p><strong>Biographie:</strong> {medecinProfile.bio}</p>}
                  {medecinProfile?.adresse_cabinet && <p><strong>Adresse du cabinet:</strong> {medecinProfile.adresse_cabinet}</p>}
                  {medecinProfile?.telephone && <p><strong>Téléphone du cabinet:</strong> {medecinProfile.telephone}</p>}
                  {medecinProfile?.ville && <p><strong>Ville:</strong> {medecinProfile.ville}</p>}
                  <p><strong>Durée de consultation:</strong> {medecinProfile?.duree_consultation || 30} minutes</p>
                  <p><strong>Nombre maximum de patients par jour:</strong> {medecinProfile?.max_patients_par_jour || 10}</p>
                </div>
                <button className="btn btn-primary" onClick={() => setEditMode(true)}>
                  Modifier mon profil
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/dashboard/medecin/suggestions')}
                >
                  Suggestions pré-définies
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/dashboard/medecin/patients')}
                >
                  Voir mes patients
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
                      <div className="rendezvous-patient">
                        👤 {rdv.patient ? `${rdv.patient.first_name || ''} ${rdv.patient.last_name || ''}` : 'N/A'}
                        {rdv.type_consultation === 'consultation' && rdv.priorite === 'basse' && (
                          <div style={{fontSize: '0.85em', color: '#666', marginTop: '4px'}}>
                            📋 Consultation
                          </div>
                        )}
                      </div>
                      <span className={`rendezvous-statut ${getStatutClass(rdv.statut)}`}>
                        {getStatutLabel(rdv.statut)}
                      </span>
                    </div>

                    
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

export default MedecinDashboard;
