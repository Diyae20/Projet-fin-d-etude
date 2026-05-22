import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Alert from '../components/Alert';
import './ReceptionUserList.css';

const ReceptionUserList = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('patient');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [filter, searchTerm]);

  useEffect(() => {
    filterUsers();
  }, [users, filter, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Utiliser la vue qui retourne uniquement les patients qui ont pris un rendez-vous
      const usersResponse = await api.get('/users/reception/patients-with-rendezvous/');
      console.log('Réponse de l\'API users:', usersResponse.data);
      
      const usersData = usersResponse.data.results || usersResponse.data;
      const patients = [];

      if (Array.isArray(usersData)) {
        usersData.forEach(user => {
          if (user.role === 'patient' && user.visible_for_reception) {
            patients.push({
              ...user,
              medecin: user.medecin || null
            });
          }
        });
      }

      console.log('Patients:', patients);
      setUsers(patients);
    } catch (error) {
      if (error.response && error.response.status === 403) {
        setError('Accès non autorisé. Vous devez être connecté en tant que réception.');
      } else {
        setError('Erreur lors du chargement des utilisateurs.');
      }
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (filter !== 'all') {
      filtered = filtered.filter(user => user.role === filter);
    }

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir désactiver ce patient ? Son compte restera actif pour qu\'il puisse se connecter.')) {
      return;
    }

    try {
      // Récupérer les rendez-vous du patient
      const rendezvousResponse = await api.get(`/rendezvous/?patient=${userId}`);
      const rendezvous = rendezvousResponse.data.results || rendezvousResponse.data;
      
      // Supprimer tous les rendez-vous du patient
      for (const rdv of rendezvous) {
        await api.delete(`/rendezvous/${rdv.id}/`);
      }
      
      // Désactiver le patient et le dissocier du médecin
      console.log(`Désactivation du patient ${userId}`);
      const updateData = { visible_for_reception: false, is_active: true, medecin: null };
      console.log(`Données de mise à jour:`, updateData);
      const updateResponse = await api.patch(`/users/reception/users/${userId}/`, updateData);
      console.log(`Réponse de la mise à jour:`, updateResponse.data);
      console.log(`État visible_for_reception après mise à jour:`, updateResponse.data.visible_for_reception);
      console.log(`État medecin après mise à jour:`, updateResponse.data.medecin);
      // Forcer le rechargement de la page pour mettre à jour la liste
      console.log(`Rechargement de la page`);
      setTimeout(() => {
        window.location.href = window.location.href;
      }, 500);
    } catch (error) {
      console.error("Erreur lors de la désactivation du patient:", error);
      console.error("Détails de l'erreur:", error.response);
      setError("Erreur lors de la désactivation du patient.");
    }
  };

  if (loading) {
    return <div className="text-center mt-5">Chargement...</div>;
  }

  return (
    <div className="reception-user-list">
      <div className="container mt-4">
        <h2>Gestion des Patients</h2>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <div className="row mb-4">
          <div className="col-md-6">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-6">
            <select
              className="form-control"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="patient">Patients</option>
            </select>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead className="table-dark">
                  <tr>
                    <th style={{padding: '15px', minWidth: '150px'}}>Nom</th>
                    <th style={{padding: '15px', minWidth: '200px'}}>Email</th>
                    <th style={{padding: '15px', minWidth: '100px'}}>Rôle</th>
                    <th style={{padding: '15px', minWidth: '120px'}}>Téléphone</th>
                    <th style={{padding: '15px', minWidth: '150px'}}>Médecin associé</th>
                    <th style={{padding: '15px', minWidth: '120px'}}>Date de création</th>
                    <th style={{padding: '15px', minWidth: '150px'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} style={{verticalAlign: 'middle'}}>
                      <td style={{padding: '12px 15px'}}>
                        <div style={{fontWeight: '500'}}>{user.first_name} {user.last_name}</div>
                      </td>
                      <td style={{padding: '12px 15px'}}>{user.email}</td>
                      <td style={{padding: '12px 15px'}}>
                        <span className={`badge bg-${user.role === 'patient' ? 'primary' : user.role === 'medecin' ? 'success' : 'info'}`} style={{fontSize: '0.85em', padding: '6px 12px'}}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{padding: '12px 15px'}}>{user.phone || '-'}</td>
                      <td style={{padding: '12px 15px'}}>
                        {user.medecin ? (
                          <div style={{fontWeight: '500'}}>{user.medecin.first_name} {user.medecin.last_name}</div>
                        ) : (
                          <span style={{color: '#999'}}>-</span>
                        )}
                      </td>
                      <td style={{padding: '12px 15px'}}>{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                      <td style={{padding: '12px 15px'}}>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-info"
                            onClick={() => navigate(`/reception/users/${user.id}`)}
                            style={{minWidth: '60px'}}
                          >
                            Voir
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(user.id)}
                            style={{minWidth: '60px'}}
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <button
          className="btn btn-secondary mt-3"
          onClick={() => navigate('/reception/dashboard')}
        >
          Retour au tableau de bord
        </button>
      </div>
    </div>
  );
};

export default ReceptionUserList;
