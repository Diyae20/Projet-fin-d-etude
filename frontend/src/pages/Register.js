import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Alert from '../components/Alert';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
    role: 'patient',
    phone: '',
    date_of_birth: '',
    address: '',
    city: '',
    code_medecin: ''
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Validation des champs du formulaire
  const validateForm = () => {
    const newErrors = {};

    // Validation du code du médecin (si rôle = réception)
    if (formData.role === 'reception' && !formData.code_medecin.trim()) {
      newErrors.code_medecin = "Le code du médecin est requis pour le rôle réception";
    }

    // Validation du nom d'utilisateur
    if (!formData.username.trim()) {
      newErrors.username = "Le nom d'utilisateur est requis";
    } else if (formData.username.length < 3) {
      newErrors.username = "Le nom d'utilisateur doit contenir au moins 3 caractères";
    }

    // Validation de l'email
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
      newErrors.email = 'Veuillez entrer une adresse email valide';
    }

    // Validation du prénom
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Le prénom est requis';
    }

    // Validation du nom
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Le nom est requis';
    }

    // Validation du mot de passe
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
    }

    // Validation de la confirmation du mot de passe
    if (!formData.password_confirm) {
      newErrors.password_confirm = 'Veuillez confirmer votre mot de passe';
    } else if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Les mots de passe ne correspondent pas';
    }

    // Validation du téléphone (si renseigné)
    if (formData.phone && !/^[\d\s\+\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Veuillez entrer un numéro de téléphone valide';
    }

    // Validation de la date de naissance (si renseignée)
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      const maxAge = 150; // Âge maximum plausible

      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const finalAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;

      if (finalAge > maxAge) {
        newErrors.date_of_birth = 'Veuillez entrer une date de naissance valide';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Effacer l'erreur pour ce champ spécifique lorsque l'utilisateur commence à taper
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);

    // Valider le formulaire avant l'envoi
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log("Tentative d'inscription avec les données:", formData);
      const result = await register(formData);
      console.log("Résultat de l'inscription:", result);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        console.error("Erreur d'inscription:", result.error);
        // Gérer les erreurs de l'API qui peuvent être des objets
        if (typeof result.error === 'object' && result.error !== null) {
          // Si l'erreur est un objet, extraire le message d'erreur
          if (result.error.detail) {
            setErrors({ general: result.error.detail });
          } else if (result.error.non_field_errors) {
            setErrors({ general: result.error.non_field_errors.join(', ') });
          } else {
            // Extraire les erreurs de champ
            const newErrors = {};
            for (const key in result.error) {
              if (Array.isArray(result.error[key])) {
                newErrors[key] = result.error[key].join(', ');
              } else {
                newErrors[key] = result.error[key];
              }
            }
            setErrors(newErrors);
          }
        } else {
          setErrors({ general: result.error || "Une erreur est survenue lors de l'inscription. Veuillez réessayer." });
        }
      }
    } catch (error) {
      console.error("Exception lors de l'inscription:", error);
      setErrors({ general: "Une erreur est survenue lors de l'inscription. Veuillez réessayer." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register">
      <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <h2>Inscription</h2>
        <p className="text-muted" style={{ marginBottom: '20px' }}>
          Créez votre compte pour accéder à nos services de prise de rendez-vous médicaux.
        </p>

        {success && (
          <Alert 
            type="success" 
            message="Inscription réussie ! Vous allez être redirigé vers la page de connexion." 
          />
        )}

        {errors.general && (
          <Alert 
            type="error" 
            message={errors.general} 
            onClose={() => setErrors({...errors, general: ''})} 
          />
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Nom d'utilisateur *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? 'is-invalid' : ''}
            />
            {errors.username && <div className="invalid-feedback">{errors.username}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'is-invalid' : ''}
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="first_name">Prénom *</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className={errors.first_name ? 'is-invalid' : ''}
            />
            {errors.first_name && <div className="invalid-feedback">{errors.first_name}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="last_name">Nom *</label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className={errors.last_name ? 'is-invalid' : ''}
            />
            {errors.last_name && <div className="invalid-feedback">{errors.last_name}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'is-invalid' : ''}
            />
            {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            <small className="form-text text-muted">
              Le mot de passe doit contenir au moins 8 caractères, dont une majuscule, une minuscule et un chiffre.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="password_confirm">Confirmer le mot de passe *</label>
            <input
              type="password"
              id="password_confirm"
              name="password_confirm"
              value={formData.password_confirm}
              onChange={handleChange}
              className={errors.password_confirm ? 'is-invalid' : ''}
            />
            {errors.password_confirm && <div className="invalid-feedback">{errors.password_confirm}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="role">Rôle *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={errors.role ? 'is-invalid' : ''}
            >
              <option value="patient">Patient</option>
              <option value="medecin">Médecin</option>
              <option value="reception">Réception</option>
            </select>
            {errors.role && <div className="invalid-feedback">{errors.role}</div>}
          </div>
          {formData.role === 'reception' && (
            <div className="form-group">
              <label htmlFor="code_medecin">Code du médecin *</label>
              <input
                type="text"
                id="code_medecin"
                name="code_medecin"
                value={formData.code_medecin}
                onChange={handleChange}
                className={errors.code_medecin ? 'is-invalid' : ''}
                placeholder="Entrez le code de votre médecin"
                required
              />
              {errors.code_medecin && <div className="invalid-feedback">{errors.code_medecin}</div>}
            </div>
          )}


          <div className="form-group">
            <label htmlFor="phone">Téléphone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={errors.phone ? 'is-invalid' : ''}
            />
            {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="date_of_birth">Date de naissance</label>
            <input
              type="date"
              id="date_of_birth"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              className={errors.date_of_birth ? 'is-invalid' : ''}
            />
            {errors.date_of_birth && <div className="invalid-feedback">{errors.date_of_birth}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="address">Adresse</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="city">Ville</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Inscription...' : "S'inscrire"}
          </button>
        </form>

        <p style={{ marginTop: '15px', textAlign: 'center' }}>
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
