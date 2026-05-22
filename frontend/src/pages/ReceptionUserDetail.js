import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Alert from '../components/Alert';

const ReceptionUserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [rendezvous, setRendezvous] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'patient'
  });

  useEffect(() => {
    fetchUser();
  }, [id]);

  useEffect(() => {
    if (user) {
      fetchRendezvous();
    }
  }, [user]);

  const fetchRendezvous = async () => {
    try {
      // Récupérer tous les rendez-vous du patient, y compris ceux supprimés (statut "passe")
      const response = await api.get(`/rendezvous/patient/${id}/?include_deleted=true`);
      const allRendezvous = response.data;
      
      // Filtrer pour ne garder que les rendez-vous avec le statut "passé"
      const historyRendezvous = allRendezvous.filter(rdv => 
        rdv.statut === 'passe'
      );
      
      // Trier les rendez-vous par date décroissante
      historyRendezvous.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setRendezvous(historyRendezvous);
    } catch (error) {
      console.error("Erreur lors du chargement des rendez-vous:", error);
    }
  };

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/reception/users/${id}/`);
      setUser(response.data);
      setFormData({
        first_name: response.data.first_name || '',
        last_name: response.data.last_name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        role: response.data.role || 'patient'
      });
    } catch (error) {
      setError("Erreur lors du chargement des informations de l'utilisateur.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Log des données avant l'envoi
      console.log("Données à envoyer:", {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role
      });
      
      const response = await api.put(`/users/reception/users/${id}/`, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role
      });
      
      console.log("Réponse du serveur:", response.data);
      setSuccess("Informations mises à jour avec succès.");
      setIsEditing(false);
      fetchUser();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      console.error("Détails de l'erreur:", error.response?.data);
      console.error("Statut de l'erreur:", error.response?.status);
      
      // Afficher tous les détails de l'erreur
      let errorMessage = "Erreur lors de la mise à jour des informations.";
      if (error.response?.data) {
        if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.non_field_errors) {
          errorMessage = error.response.data.non_field_errors.join(', ');
        } else {
          // Afficher les erreurs de champ
          const fieldErrors = [];
          for (const field in error.response.data) {
            if (Array.isArray(error.response.data[field])) {
              fieldErrors.push(`${field}: ${error.response.data[field].join(', ')}`);
            } else {
              fieldErrors.push(`${field}: ${error.response.data[field]}`);
            }
          }
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join(', ');
          }
        }
      }
      setError(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce patient et tous ses rendez-vous ?")) {
      return;
    }
    try {
      // Récupérer les rendez-vous du patient
      const rendezvousResponse = await api.get(`/rendezvous/?patient=${id}`);
      const rendezvous = rendezvousResponse.data.results || rendezvousResponse.data;
      
      // Supprimer tous les rendez-vous du patient
      for (const rdv of rendezvous) {
        await api.delete(`/rendezvous/${rdv.id}/`);
      }
      
      // Désactiver le patient au lieu de le supprimer
      await api.patch(`/users/reception/users/${id}/`, { visible_for_reception: false, is_active: true });

      // Réinitialiser le nombre total de rendez-vous du patient
      await api.patch(`/users/reception/users/${id}/`, { total_rendezvous_count: 0 });

      // Rediriger vers la liste des patients
      navigate('/reception/users');
    } catch (error) {
      setError("Erreur lors de la suppression des rendez-vous du patient.");
    }
  };

  if (loading) {
    return <div className="text-center mt-5">Chargement...</div>;
  }

  return (
    <div className="reception-user-detail">
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Détails de l'utilisateur</h2>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/reception/users')}
          >
            Retour à la liste
          </button>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        <div className="card">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4>Informations personnelles</h4>
              {!isEditing && (
                <button
                  className="btn btn-primary"
                  onClick={() => setIsEditing(true)}
                >
                  Modifier
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Prénom</label>
                    <input
                      type="text"
                      className="form-control"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Nom</label>
                    <input
                      type="text"
                      className="form-control"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Téléphone</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Rôle</label>
                    <select
                      className="form-control"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      required
                    >
                      <option value="patient">Patient</option>
                      <option value="medecin">Médecin</option>
                      <option value="reception">Réception</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </div>
                </div>
                <div className="d-flex gap-2 mt-4">
                  <button type="submit" className="btn btn-success">
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        first_name: user.first_name || '',
                        last_name: user.last_name || '',
                        email: user.email || '',
                        phone: user.phone || '',
                        role: user.role || 'patient'
                      });
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <div className="row">
                <div className="col-md-6 mb-3">
                  <strong>Prénom:</strong> {user.first_name}
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Nom:</strong> {user.last_name}
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Email:</strong> {user.email}
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Téléphone:</strong> {user.phone || 'Non renseigné'}
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Rôle:</strong>{' '}
                  <span className={`badge bg-${user.role === 'patient' ? 'primary' : user.role === 'medecin' ? 'success' : user.role === 'reception' ? 'info' : 'danger'}`}>
                    {user.role}
                  </span>
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Date de création:</strong>{' '}
                  {new Date(user.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="d-flex gap-2">
            {/* Les boutons d'action rapide peuvent être ajoutés ici si nécessaire */}
          </div>
        </div>

        <div className="card mt-4">
          <div className="card-body">
            <h4>Historique des rendez-vous passés</h4>
            {rendezvous.length === 0 ? (
              <p>Aucun rendez-vous passé pour ce patient.</p>
            ) : (
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Heure</th>
                    <th>Médecin</th>
                    <th>Type</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {rendezvous.map(rdv => (
                    <tr key={rdv.id}>
                      <td>{new Date(rdv.date).toLocaleDateString('fr-FR')}</td>
                      <td>{rdv.heure || new Date(rdv.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</td>
                      <td>{rdv.medecin ? `${rdv.medecin.first_name} ${rdv.medecin.last_name}` : 'Non assigné'}</td>
                      <td>
                        {rdv.type_consultation === 'consultation' ? (
                          <span className="badge bg-info">Consultation</span>
                        ) : rdv.type_consultation === 'suivi' ? (
                          <span className="badge bg-warning">Suivi</span>
                        ) : (
                          <span className="badge bg-secondary">-</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge bg-${
                          rdv.statut === 'confirme' ? 'success' : 
                          rdv.statut === 'annule' ? 'danger' : 
                          rdv.statut === 'en_attente' ? 'warning' : 
                          rdv.statut === 'passe' ? 'secondary' : 'primary'
                        }`}>
                          {rdv.statut === 'confirme' ? 'Confirmé' : 
                           rdv.statut === 'annule' ? 'Annulé' : 
                           rdv.statut === 'en_attente' ? 'En attente' : 
                           rdv.statut === 'passe' ? 'Passé' : rdv.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionUserDetail;
