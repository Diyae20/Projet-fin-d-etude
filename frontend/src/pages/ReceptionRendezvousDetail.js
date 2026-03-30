import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Alert from '../components/Alert';

const ReceptionRendezvousDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rendezvous, setRendezvous] = useState(null);
  const [patients, setPatients] = useState([]);
  const [medecins, setMedecins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    patient: '',
    medecin: '',
    date: '',
    heure: '',
    statut: 'en_attente',
    notes: ''
  });

  useEffect(() => {
    fetchRendezvous();
    fetchPatients();
    fetchMedecins();
  }, [id]);

  const fetchRendezvous = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/reception/rendezvous/${id}/`);
      console.log("Réponse de l'API rendezvous détail:", response.data);
      setRendezvous(response.data);
      setFormData({
        patient: response.data.patient?.id || '',
        medecin: response.data.medecin?.id || '',
        date: response.data.date || '',
        heure: response.data.heure || '',
        statut: response.data.statut || 'en_attente',
        notes: response.data.notes || ''
      });
    } catch (error) {
      console.error('Erreur lors du chargement du rendez-vous:', error);
      setError("Erreur lors du chargement des informations du rendez-vous.");
    } finally {
      setLoading(false);
    }
  };

  const isPatientAssigned = () => {
    return rendezvous && rendezvous.patient && rendezvous.patient.id;
  };

  const fetchPatients = async () => {
    try {
      const response = await api.get('/users/reception/users/');
      const patientsData = response.data.results || response.data;
      // Filtrer pour ne garder que les patients
      const patientsList = Array.isArray(patientsData)
        ? patientsData.filter(user => user.role === 'patient')
        : [];
      setPatients(patientsList);
    } catch (error) {
      console.error("Erreur lors du chargement des patients:", error);
    }
  };

  const fetchMedecins = async () => {
    try {
      const response = await api.get('/users/reception/medecins/');
      const medecinsData = response.data.results || response.data;
      setMedecins(Array.isArray(medecinsData) ? medecinsData : []);
    } catch (error) {
      console.error("Erreur lors du chargement des médecins:", error);
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
      await api.put(`/users/reception/rendezvous/${id}/`, formData);
      setSuccess("Informations mises à jour avec succès.");
      setIsEditing(false);
      fetchRendezvous();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rendez-vous:', error);
      setError("Erreur lors de la mise à jour des informations.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")) {
      return;
    }
    try {
      await api.delete(`/users/reception/rendezvous/${id}/`);
      navigate('/reception/rendezvous');
    } catch (error) {
      setError("Erreur lors de la suppression du rendez-vous.");
    }
  };

  const getStatutBadgeClass = (statut) => {
    switch (statut) {
      case 'en_attente':
        return 'warning';
      case 'confirme':
        return 'success';
      case 'annule':
        return 'danger';
      case 'passe':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return <div className="text-center mt-5">Chargement...</div>;
  }

  return (
    <div className="reception-rendezvous-detail">
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Détails du rendez-vous</h2>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/reception/rendezvous')}
          >
            Retour à la liste
          </button>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        <div className="card">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4>Informations du rendez-vous</h4>
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
                    <label className="form-label">Patient</label>
                    <select
                      className="form-control"
                      name="patient"
                      value={formData.patient}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Sélectionner un patient</option>
                      {patients.map(patient => (
                        <option key={patient.id} value={patient.id}>
                          {`${patient.first_name} ${patient.last_name}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    {isPatientAssigned() ? (
                      <div>
                        <label className="form-label">Médecin:</label> {rendezvous.medecin ? `${rendezvous.medecin.first_name} ${rendezvous.medecin.last_name}` : 'N/A'}
                      </div>
                    ) : (
                      <>
                        <label className="form-label">Médecin</label>
                        <select
                          className="form-control"
                          name="medecin"
                          value={formData.medecin}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Sélectionner un médecin</option>
                          {medecins.map(medecin => (
                            <option key={medecin.id} value={medecin.id}>
                              {medecin.nom_complet}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Heure</label>
                    <input
                      type="time"
                      className="form-control"
                      name="heure"
                      value={formData.heure}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Statut</label>
                    <select
                      className="form-control"
                      name="statut"
                      value={formData.statut}
                      onChange={handleChange}
                      required
                    >
                      <option value="en_attente">En attente</option>
                      <option value="confirme">Confirmé</option>
                      <option value="annule">Annulé</option>
                      <option value="passe">Passé</option>
                    </select>
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      name="notes"
                      value={formData.notes}
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
                      fetchRendezvous();
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <div className="row">
                <div className="col-md-6 mb-3">
                  <strong>Patient:</strong> {rendezvous.patient ?
                    `${rendezvous.patient.first_name} ${rendezvous.patient.last_name}` :
                    'N/A'}
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Médecin:</strong> {rendezvous.medecin ?
                    `${rendezvous.medecin.first_name} ${rendezvous.medecin.last_name}` :
                    'N/A'}
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Date:</strong> {rendezvous.date || 'N/A'}
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Heure:</strong> {rendezvous.heure || 'N/A'}
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Statut:</strong> <span className={`badge bg-${getStatutBadgeClass(rendezvous.statut)}`}>{rendezvous.statut}</span>
                </div>
                <div className="col-md-12 mb-3">
                  <strong>Notes:</strong> {rendezvous.notes || 'N/A'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionRendezvousDetail;
