import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { medecinService } from '../services/medecinService';
import { rendezvousService } from '../services/rendezvousService';
import Loading from '../components/Loading';
import Alert from '../components/Alert';

// Composant Calendrier pour la sélection de date
const Calendar = ({ selectedDate, onDateChange, availableDates, disponibilitesParJour }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState(null);

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelectedDate = (date) => {
    return selectedDate && 
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
  };

  const isAvailableDate = (date) => {
    if (!availableDates || availableDates.length === 0) return false;

    return availableDates.some(availableDate => {
      const availDate = new Date(availableDate);
      return (
        date.getDate() === availDate.getDate() &&
        date.getMonth() === availDate.getMonth() &&
        date.getFullYear() === availDate.getFullYear()
      );
    });
  };

  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDateDisponibilite = (date) => {
    const dateStr = formatDateForAPI(date);
    
    if (!disponibilitesParJour) return 'disponible';
    
    const disponibilite = disponibilitesParJour[dateStr];
    
    if (!disponibilite) return 'disponible'; // Vert par défaut
    
    return disponibilite.niveau_disponibilite; // disponible, presque_complet, complet
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateClick = (date) => {
    if (isPastDate(date) || !isAvailableDate(date)) return;
    onDateChange(date);
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);

    const days = [];

    // En-tête du calendrier avec les noms des jours
    dayNames.forEach((day, index) => {
      days.push(
        <div 
          key={`day-name-${index}`} 
          className={`calendar-day-name ${index === 0 ? 'sunday' : ''}`}
        >
          {day}
        </div>
      );
    });

    // Jours vides avant le premier jour du mois
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isTodayDate = isToday(date);
      const isSelected = isSelectedDate(date);
      const isAvailable = isAvailableDate(date);
      const isPast = isPastDate(date);
      const isSunday = date.getDay() === 0;
      const isHovered = hoveredDate && 
        date.getDate() === hoveredDate.getDate() &&
        date.getMonth() === hoveredDate.getMonth() &&
        date.getFullYear() === hoveredDate.getFullYear();
        const disponibilite = getDateDisponibilite(date);

      days.push(
        <div 
          key={day} 
          className={`calendar-day
            ${isTodayDate ? 'today' : ''}
            ${isSelected ? 'selected' : ''}
            ${isAvailable ? 'available' : ''}
            ${isPast ? 'past' : ''}
            ${isSunday ? 'sunday' : ''}
            ${isHovered && disponibilite !== 'complet' ? 'hover' : ''}
            ${disponibilite === 'complet' ? 'complet' : ''}
            ${disponibilite === 'presque_complet' ? 'presque-complet' : ''}`}
          onClick={() => handleDateClick(date)}
          onMouseEnter={() => setHoveredDate(date)}
          onMouseLeave={() => setHoveredDate(null)}
        >
          <div className="calendar-day-number">{day}</div>
          {isSunday ? (
            <div className="calendar-day-message">Ce jour est fermé</div>
          ) : isAvailable && (
            <div className="calendar-day-indicator">✓</div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button 
          className="btn btn-outline-secondary" 
          onClick={goToPreviousMonth}
        >
          ← Mois précédent
        </button>
        <h3>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button 
          className="btn btn-outline-secondary" 
          onClick={goToNextMonth}
        >
          Mois suivant →
        </button>
      </div>

      <div className="calendar-navigation" style={{ marginTop: '10px', marginBottom: '20px' }}>
        <button 
          className="btn btn-secondary" 
          onClick={goToToday}
        >
          Aujourd'hui
        </button>
      </div>

      <div className="calendar-grid">
        {renderCalendar()}
      </div>

      <div className="calendar-legend" style={{ marginTop: '20px' }}>
        <div className="legend-item">
          <div className="legend-color available"></div>
          <span>Disponible</span>
        </div>
        <div className="legend-item">
          <div className="legend-color presque-complet"></div>
          <span>Presque complet</span>
        </div>
        <div className="legend-item">
          <div className="legend-color complet"></div>
          <span>Complet</span>
        </div>
        <div className="legend-item">
          <div className="legend-color selected"></div>
          <span>Sélectionné</span>
        </div>
        <div className="legend-item">
          <div className="legend-color past"></div>
          <span>Passé</span>
        </div>
      </div>
    </div>
  );
};

const MedecinDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medecin, setMedecin] = useState(null);
  const [creneaux, setCreneaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedCreneau, setSelectedCreneau] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [availableDates, setAvailableDates] = useState([]);
  const [dateComplete, setDateComplete] = useState(false);
  const [messageDate, setMessageDate] = useState('');
  const [disponibilitesParJour, setDisponibilitesParJour] = useState({});

  useEffect(() => {
    fetchMedecinDetail();
  }, [id]);

  useEffect(() => {
    if (selectedDate) {
      fetchCreneauxDisponibles();
    }
  }, [selectedDate]);

  const fetchMedecinDetail = async () => {
    setLoading(true);
    setError('');

    const result = await medecinService.getMedecinDetail(id);

    if (result.success) {
      setMedecin(result.data);
      // Initialiser les dates disponibles avec les 30 prochains jours
      const dates = [];
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date.toISOString());
      }
      setAvailableDates(dates);
      // Récupérer les disponibilités par jour
      fetchDisponibilitesParJour();
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const fetchDisponibilitesParJour = async () => {
    const result = await rendezvousService.getMedecinDisponibiliteParJour(id);
    if (result.success) {
      setDisponibilitesParJour(result.data.disponibilites || {});
    }
  };

  const fetchCreneauxDisponibles = async () => {
    if (!selectedDate) return;

    // Ne pas récupérer les créneaux pour les dimanches
    if (selectedDate.getDay() === 0) {
      setCreneaux([]);
      setDateComplete(true);
      setMessageDate('Ce jour est fermé');
      return;
    }

    const formattedDate = formatDateForAPI(selectedDate);
    const result = await rendezvousService.getCreneauxDisponibles(id, formattedDate);

    if (result.success) {
      setCreneaux(result.data.creneaux || []);
      setDateComplete(result.data.date_complete || false);
      setMessageDate(result.data.message || '');
    } else {
      setError(result.error);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedCreneau('');
    setCreneaux([]);
  };

  const formatDateForAPI = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleCreneauSelect = (heure) => {
    setSelectedCreneau(heure);
  };

  const handleBooking = async () => {
    // Validation des champs
    const newErrors = {};

    if (!selectedDate) {
      newErrors.date = 'Veuillez sélectionner une date';
    }

    if (!selectedCreneau) {
      newErrors.creneau = 'Veuillez sélectionner un créneau';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setBookingLoading(true);
    setError('');
    setErrors({});

    const formattedDate = formatDateForAPI(selectedDate);
    const result = await rendezvousService.createRendezvous({
      medecin_id: id,
      date: formattedDate,
      heure: selectedCreneau
    });

    if (result.success) {
      setSuccess('Rendez-vous créé avec succès !');
      setSelectedCreneau('');
      fetchCreneauxDisponibles();
    } else {
      setError(result.error);
    }

    setBookingLoading(false);
  };

  if (loading) {
    return <Loading message="Chargement des informations du médecin..." />;
  }

  if (!medecin) {
    return (
      <div className="card">
        <Alert type="error" message="Médecin non trouvé" />
      </div>
    );
  }

  return (
    <div className="medecin-detail">
      <button 
        className="btn btn-secondary" 
        onClick={() => navigate(-1)}
        style={{ marginBottom: '20px' }}
      >
        ← Retour
      </button>

      <div className="card">
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
            {medecin.photo ? (
              <img 
                src={`${medecin.photo}?t=${new Date().getTime()}`} 
                alt={`${medecin.nom_complet}`} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span>👨‍⚕️</span>
            )}
          </div>
          <div>
            <h1 style={{ marginBottom: '5px' }}>{medecin.nom_complet}</h1>
            <p className="medecin-specialite" style={{ fontSize: '18px' }}>
              {medecin.specialite?.nom || 'Non spécifié'}
            </p>
          </div>
        </div>

        {medecin.bio && (
          <div style={{ marginTop: '20px' }}>
            <h3>À propos</h3>
            <p>{medecin.bio}</p>
          </div>
        )}

        <div style={{ marginTop: '20px' }}>
          <h3>Informations pratiques</h3>
          {medecin.adresse_cabinet && (
            <p>🏥 {medecin.adresse_cabinet}</p>
          )}
          {medecin.ville && (
            <p>📍 {medecin.ville}</p>
          )}
          {medecin.telephone && (
            <p>📞 {medecin.telephone}</p>
          )}
          <p>⏱️ Durée moyenne de consultation : {medecin.duree_consultation} minutes</p>
        </div>

        {medecin.experience && (
          <div style={{ marginTop: '20px' }}>
            <h3>Expérience</h3>
            <p>{medecin.experience} ans d'expérience</p>
          </div>
        )}

        {medecin.diplomes && medecin.diplomes.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3>Diplômes</h3>
            <ul>
              {medecin.diplomes.map((diplome, index) => (
                <li key={index}>{diplome}</li>
              ))}
            </ul>
          </div>
        )}

        {medecin.langues && medecin.langues.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3>Langues parlées</h3>
            <p>{medecin.langues.join(', ')}</p>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Prendre rendez-vous</h2>
        <p className="text-muted" style={{ marginBottom: '20px' }}>
          Sélectionnez une date et un créneau pour prendre rendez-vous avec le Dr. {medecin.nom}.
        </p>
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        <div className="form-group">
          <label htmlFor="date">Date</label>
          <Calendar 
            selectedDate={selectedDate} 
            onDateChange={handleDateChange} 
            availableDates={availableDates}
            disponibilitesParJour={disponibilitesParJour} 
          />
          {errors.date && <div className="invalid-feedback">{errors.date}</div>}
        </div>

        {selectedDate && creneaux.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3>Créneaux disponibles</h3>
            <div className="creneau-list">
              {creneaux.map((creneau, index) => (
                <button
                  key={index}
                  className={`creneau-btn ${selectedCreneau === creneau.heure ? 'selected' : ''}`}
                  onClick={() => handleCreneauSelect(creneau.heure)}
                  disabled={!creneau.disponible}
                >
                  {creneau.heure}
                </button>
              ))}
            </div>
            {errors.creneau && <div className="invalid-feedback" style={{ display: 'block' }}>{errors.creneau}</div>}
          </div>
        )}

        {selectedDate && creneaux.length === 0 && (
          <div style={{ marginTop: '20px' }}>
            {dateComplete ? (
              <>
                <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
                  {messageDate}
                </div>

              </>
            ) : (
              <p>
                Aucun créneau disponible pour cette date. Veuillez choisir une autre date.
              </p>
            )}
          </div>
        )}



        {selectedCreneau && (
          <button
            className="btn btn-primary"
            onClick={handleBooking}
            disabled={bookingLoading}
            style={{ marginTop: '20px' }}
          >
            {bookingLoading ? 'Création en cours...' : 'Confirmer le rendez-vous'}
          </button>
        )}
      </div>
    </div>
  );
};

export default MedecinDetail;
