import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { medecinService } from '../services/medecinService';
import Loading from '../components/Loading';
import Alert from '../components/Alert';

const MedecinList = () => {
  const [medecins, setMedecins] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    specialite: '',
    ville: '',
    search: '',
    nom: '',
    prenom: ''
  });
  const [advancedFilters, setAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState('nom');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    fetchMedecins();
    fetchSpecialites();
  }, [filters, sortBy, sortOrder]);

  const fetchMedecins = async () => {
    setLoading(true);
    setError('');

    const result = await medecinService.getMedecins(filters);

    if (result.success) {
      // L'API retourne un objet avec pagination (results et count) ou un tableau direct
      let medecinsData = result.data.results || result.data;
      // S'assurer que c'est un tableau
      medecinsData = Array.isArray(medecinsData) ? medecinsData : [];

      // Trier les médecins
      medecinsData = sortMedecins(medecinsData, sortBy, sortOrder);

      setMedecins(medecinsData);
    } else {
      setError(result.error);
      setMedecins([]);
    }

    setLoading(false);
  };

  const sortMedecins = (medecins, sortBy, sortOrder) => {
    return [...medecins].sort((a, b) => {
      let valueA, valueB;

      switch (sortBy) {
        case 'nom':
          valueA = a.nom || '';
          valueB = b.nom || '';
          break;
        case 'specialite':
          valueA = a.specialite?.nom || '';
          valueB = b.specialite?.nom || '';
          break;
        case 'ville':
          valueA = a.ville || '';
          valueB = b.ville || '';
          break;
        default:
          valueA = a.nom || '';
          valueB = b.nom || '';
      }

      if (sortOrder === 'asc') {
        return valueA.localeCompare(valueB);
      } else {
        return valueB.localeCompare(valueA);
      }
    });
  };

  const fetchSpecialites = async () => {
    const result = await medecinService.getSpecialites();
    if (result.success) {
      // L'API peut retourner un objet avec pagination ou un tableau direct
      const specialitesData = result.data.results || result.data;
      // S'assurer que c'est un tableau
      setSpecialites(Array.isArray(specialitesData) ? specialitesData : []);
    } else {
      setSpecialites([]);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const toggleAdvancedFilters = () => {
    setAdvancedFilters(!advancedFilters);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const resetFilters = () => {
    setFilters({
      specialite: '',
      ville: '',
      search: '',
      nom: '',
      prenom: ''
    });
    setSortBy('nom');
    setSortOrder('asc');
  };

  return (
    <div className="medecin-list">
      <h1>Trouver un médecin</h1>
      <p className="text-muted" style={{ marginBottom: '20px' }}>
        Recherchez un médecin par spécialité, ville ou nom pour prendre rendez-vous.
      </p>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="form-group">
          <label htmlFor="search">Rechercher</label>
          <input
            type="text"
            id="search"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Nom du médecin ou spécialité"
          />
        </div>

        <div className="form-group">
          <label htmlFor="specialite">Spécialité</label>
          <select
            id="specialite"
            name="specialite"
            value={filters.specialite}
            onChange={handleFilterChange}
          >
            <option value="">Toutes les spécialités</option>
            {specialites.map(specialite => (
              <option key={specialite.id} value={specialite.id}>
                {specialite.nom}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="ville">Ville</label>
          <input
            type="text"
            id="ville"
            name="ville"
            value={filters.ville}
            onChange={handleFilterChange}
            placeholder="Ville"
          />
        </div>

        <div className="form-group">
          <button 
            className="btn btn-secondary" 
            onClick={toggleAdvancedFilters}
            style={{ marginRight: '10px' }}
          >
            {advancedFilters ? 'Masquer les filtres avancés' : 'Afficher les filtres avancés'}
          </button>
          <button 
            className="btn btn-outline-secondary" 
            onClick={resetFilters}
          >
            Réinitialiser les filtres
          </button>
        </div>

        {advancedFilters && (
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <h3>Filtres avancés</h3>
            <div className="form-group">
              <label htmlFor="nom">Nom</label>
              <input
                type="text"
                id="nom"
                name="nom"
                value={filters.nom}
                onChange={handleFilterChange}
                placeholder="Nom du médecin"
              />
            </div>

            <div className="form-group">
              <label htmlFor="prenom">Prénom</label>
              <input
                type="text"
                id="prenom"
                name="prenom"
                value={filters.prenom}
                onChange={handleFilterChange}
                placeholder="Prénom du médecin"
              />
            </div>
          </div>
        )}

        <div className="form-group" style={{ marginTop: '20px' }}>
          <label htmlFor="sortBy">Trier par</label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <select
              id="sortBy"
              name="sortBy"
              value={sortBy}
              onChange={handleSortChange}
              style={{ marginRight: '10px', flex: 1 }}
            >
              <option value="nom">Nom</option>
              <option value="specialite">Spécialité</option>
              <option value="ville">Ville</option>
            </select>
            <button 
              className="btn btn-outline-secondary" 
              onClick={toggleSortOrder}
            >
              {sortOrder === 'asc' ? '↑ Croissant' : '↓ Décroissant'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <Loading message="Chargement des médecins..." />
      ) : (
        <div className="medecin-grid">
          {medecins.length === 0 ? (
            <div className="card">
              <p>Aucun médecin trouvé.</p>
            </div>
          ) : (
            medecins.map(medecin => (
              <div key={medecin.id} className="medecin-card">
                <div className="medecin-info">
                  <h3 className="medecin-name">
                    <Link to={`/medecins/${medecin.id}`}>
                      {medecin.nom_complet}
                    </Link>
                  </h3>
                  <p className="medecin-specialite">{medecin.specialite || 'Non spécifié'}</p>
                  {medecin.ville && (
                    <p className="medecin-details">📍 {medecin.ville}</p>
                  )}
                  {medecin.adresse_cabinet && (
                    <p className="medecin-details">🏥 {medecin.adresse_cabinet}</p>
                  )}
                </div>
                <Link 
                  to={`/medecins/${medecin.id}`} 
                  className="btn btn-primary"
                >
                  Voir disponibilités
                </Link>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MedecinList;
