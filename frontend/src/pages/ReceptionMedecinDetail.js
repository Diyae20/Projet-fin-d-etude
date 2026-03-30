import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Alert from '../components/Alert';

const ReceptionMedecinDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medecin, setMedecin] = useState(null);
  const [specialites, setSpecialites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    specialite: '',
    bio: '',
    adresse_cabinet: '',
    telephone: '',
    ville: '',
    duree_consultation: 30,
    max_patients_par_jour: 10
  });

  useEffect(() => {
    fetchMedecin();
    fetchSpecialites();
  }, [id]);

  const fetchMedecin = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/reception/medecins/${id}/`);
      console.log("Réponse de l'API médecin détail:", response.data);
      console.log("Clés de l'objet médecin:", Object.keys(response.data));

      // Les données du médecin sont directement dans l'objet racine
      const medecinData = response.data;

      setMedecin(medecinData);
      setFormData({
        first_name: medecinData.prenom || '',
        last_name: medecinData.nom || '',
        email: medecinData.email || '',
        specialite: medecinData.specialite?.id || '',
        bio: medecinData.bio || '',
        adresse_cabinet: medecinData.adresse_cabinet || '',
        telephone: medecinData.telephone || '',
        ville: medecinData.ville || '',
        duree_consultation: medecinData.duree_consultation || 30,
        max_patients_par_jour: medecinData.max_patients_par_jour || 10
      });
    } catch (error) {
      console.error('Erreur lors du chargement du médecin:', error);
      setError("Erreur lors du chargement des informations du médecin.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialites = async () => {
    try {
      const response = await api.get('/medecins/specialites/');
      setSpecialites(response.data.results || response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des spécialités:", error);
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
      await api.put(`/users/reception/medecins/${id}/`, formData);
      setSuccess("Informations mises à jour avec succès.");
      setIsEditing(false);
      fetchMedecin();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError("Erreur lors de la mise à jour des informations.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce médecin ?")) {
      return;
    }
    try {
      await api.delete(`/users/reception/medecins/${id}/`);
      navigate('/reception/medecins');
    } catch (error) {
      setError("Erreur lors de la suppression du médecin.");
    }
  };

  if (loading) {
    return <div className="text-center mt-5">Chargement...</div>;
  }

  return (
    <div className="reception-medecin-detail">
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Détails du médecin</h2>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/reception/medecins')}
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
                <h5 className="mb-3">Informations personnelles</h5>
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
                </div>

                <h5 className="mb-3 mt-4">Informations professionnelles</h5>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Spécialité</label>
                    <select
                      className="form-control"
                      name="specialite"
                      value={formData.specialite}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Sélectionner une spécialité</option>
                      {specialites.map(spec => (
                        <option key={spec.id} value={spec.id}>
                          {spec.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Téléphone du cabinet</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Adresse du cabinet</label>
                    <textarea
                      className="form-control"
                      name="adresse_cabinet"
                      value={formData.adresse_cabinet}
                      onChange={handleChange}
                      rows="3"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Ville</label>
                    <input
                      type="text"
                      className="form-control"
                      name="ville"
                      value={formData.ville}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Durée de consultation (minutes)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="duree_consultation"
                      value={formData.duree_consultation}
                      onChange={handleChange}
                      min="5"
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Max patients par jour</label>
                    <input
                      type="number"
                      className="form-control"
                      name="max_patients_par_jour"
                      value={formData.max_patients_par_jour}
                      onChange={handleChange}
                      min="1"
                      required
                    />
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Biographie</label>
                    <textarea
                      className="form-control"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows="4"
                    />
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
                      fetchMedecin();
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <div className="row">
                <div className="col-md-6 mb-3">
                  <strong>Nom complet:</strong> {medecin.nom_complet || 'Non renseigné'}
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Email:</strong> {medecin.email || 'Non renseigné'}
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Spécialité:</strong>{' '}
                  {medecin.specialite ? (
                    <span className="badge bg-primary">
                      {typeof medecin.specialite === 'object' ? medecin.specialite.nom : medecin.specialite}
                    </span>
                  ) : (
                    <span style={{color: '#999'}}>Non spécifié</span>
                  )}
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Téléphone du cabinet:</strong> {medecin.telephone || 'Non renseigné'}
                </div>
                <div className="col-md-12 mb-3">
                  <strong>Adresse du cabinet:</strong> {medecin.adresse_cabinet || 'Non renseigné'}
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Ville:</strong> {medecin.ville || 'Non renseigné'}
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Durée de consultation:</strong> {medecin.duree_consultation} minutes
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Max patients par jour:</strong> {medecin.max_patients_par_jour}
                </div>
                <div className="col-md-12 mb-3">
                  <strong>Biographie:</strong> {medecin.bio || 'Non renseigné'}
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Date de création:</strong>{' '}
                  {new Date(medecin.created_at).toLocaleDateString('fr-FR')}
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Dernière mise à jour:</strong>{' '}
                  {new Date(medecin.updated_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <button
            className="btn btn-danger"
            onClick={handleDelete}
          >
            Supprimer le médecin
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceptionMedecinDetail;
