import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Alert from '../components/Alert';

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
    filterUsers();
  }, [users, filter, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/reception/users/');
      console.log('Réponse de l\'API:', response.data);
      setUsers(Array.isArray(response.data) ? response.data : []);
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
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      await api.delete(`/users/reception/users/${userId}/`);
      setUsers(users.filter(user => user.id !== userId));
    } catch (error) {
      setError("Erreur lors de la suppression de l'utilisateur.");
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
