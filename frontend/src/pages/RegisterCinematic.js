
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginScene3D from '../components/LoginScene3D';
import './RegisterCinematic.css';

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

  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1);
  const TOTAL_STEPS = 3;

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState('success');
  const [toastMessage, setToastMessage] = useState('');
  const cursorGlowRef = useRef(null);

  // Step data
  const STEPS = [
    { title: 'Créez votre compte.', lead: 'Dites-nous qui vous êtes.', btnLabel: 'Continuer' },
    { title: 'Vos coordonnées.', lead: 'Pour mieux vous localiser et vous contacter.', btnLabel: 'Continuer' },
    { title: 'Sécurisez votre compte.', lead: 'Choisissez un mot de passe solide.', btnLabel: 'Créer mon compte' },
  ];

  // Curseur lumineux
  useEffect(() => {
    const cursorGlow = cursorGlowRef.current;
    if (!cursorGlow) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let curX = mouseX;
    let curY = mouseY;
    let animId;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onMouseLeave = () => { cursorGlow.style.opacity = '0'; };
    const onMouseEnter = () => { cursorGlow.style.opacity = '1'; };

    function follow() {
      curX += (mouseX - curX) * 0.12;
      curY += (mouseY - curY) * 0.12;
      cursorGlow.style.transform = 'translate3d(' + curX + 'px, ' + curY + 'px, 0)';
      animId = requestAnimationFrame(follow);
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);
    follow();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
    };
  }, []);

  // Max date for date_of_birth
  useEffect(() => {
    const dobInput = document.getElementById('date_of_birth');
    if (dobInput) {
      dobInput.max = new Date().toISOString().split('T')[0];
    }
  }, [currentStep]);

  // Shake animation
  const shakeElement = useCallback((el) => {
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  }, []);

  // Toast
  const showToast = useCallback((type, message) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 5000);
  }, []);

  // Username validation regex
  const USERNAME_RE = /^[a-zA-Z0-9_]{3,}$/;

  // Password strength
  const calcStrength = (val) => {
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/\d/.test(val)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val)) score++;
    return score;
  };

  const STRENGTH_LABELS = ['', 'Trop faible', 'Faible', 'Correct', 'Solide'];
  const STRENGTH_COLORS = ['', 's1', 's2', 's3', 's4'];

  const passwordStrength = calcStrength(formData.password);

  // Password rules check
  const pwdRules = [
    { rule: 'length', label: 'Au moins 8 caractères', ok: formData.password.length >= 8 },
    { rule: 'upper', label: 'Une majuscule', ok: /[A-Z]/.test(formData.password) },
    { rule: 'number', label: 'Un chiffre', ok: /\d/.test(formData.password) },
    { rule: 'special', label: 'Un caractère spécial (!@#$…)', ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) },
  ];

  // Password match
  const passwordsMatch = formData.password_confirm.length > 0 && formData.password === formData.password_confirm;
  const passwordsMismatch = formData.password_confirm.length > 0 && formData.password !== formData.password_confirm;

  // Username check
  const usernameOk = formData.username.length > 0 && USERNAME_RE.test(formData.username);
  const usernameInvalid = formData.username.length > 0 && !USERNAME_RE.test(formData.username);

  // Validation des champs du formulaire (identique à l'original)
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
      const maxAge = 150;
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

  // Validation par étape
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      // Code médecin (si réception)
      if (formData.role === 'reception' && !formData.code_medecin.trim()) {
        newErrors.code_medecin = "Le code du médecin est requis pour le rôle réception";
      }
      // Prénom
      if (!formData.first_name.trim()) {
        newErrors.first_name = 'Le prénom est requis';
      }
      // Nom
      if (!formData.last_name.trim()) {
        newErrors.last_name = 'Le nom est requis';
      }
      // Username
      if (!formData.username.trim()) {
        newErrors.username = "Le nom d'utilisateur est requis";
      } else if (formData.username.length < 3) {
        newErrors.username = "Le nom d'utilisateur doit contenir au moins 3 caractères";
      }
      // Email
      if (!formData.email.trim()) {
        newErrors.email = "L'email est requis";
      } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
        newErrors.email = 'Veuillez entrer une adresse email valide';
      }
    }

    if (step === 2) {
      // Téléphone (optionnel mais format)
      if (formData.phone && !/^[\d\s\+\-\(\)]+$/.test(formData.phone)) {
        newErrors.phone = 'Veuillez entrer un numéro de téléphone valide';
      }
      // Date de naissance (optionnelle mais cohérente)
      if (formData.date_of_birth) {
        const birthDate = new Date(formData.date_of_birth);
        const today = new Date();
        const maxAge = 150;
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const finalAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
        if (finalAge > maxAge) {
          newErrors.date_of_birth = 'Veuillez entrer une date de naissance valide';
        }
      }
    }

    if (step === 3) {
      // Mot de passe
      if (!formData.password) {
        newErrors.password = 'Le mot de passe est requis';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
      }
      // Confirmation
      if (!formData.password_confirm) {
        newErrors.password_confirm = 'Veuillez confirmer votre mot de passe';
      } else if (formData.password !== formData.password_confirm) {
        newErrors.password_confirm = 'Les mots de passe ne correspondent pas';
      }
    }

    setErrors(prev => ({ ...prev, ...newErrors }));

    // Clear errors for fields that are valid
    const stepFields = step === 1
      ? ['code_medecin', 'first_name', 'last_name', 'username', 'email']
      : step === 2
        ? ['phone', 'date_of_birth']
        : ['password', 'password_confirm'];

    stepFields.forEach(field => {
      if (!newErrors[field]) {
        setErrors(prev => {
          const updated = { ...prev };
          delete updated[field];
          return updated;
        });
      }
    });

    // Shake invalid fields
    if (Object.keys(newErrors).length > 0) {
      Object.keys(newErrors).forEach(field => {
        const wrap = document.getElementById(field + 'Wrap');
        if (wrap) shakeElement(wrap);
      });
    }

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

  const handleRoleChange = (role) => {
    setFormData({
      ...formData,
      role,
      code_medecin: role !== 'reception' ? '' : formData.code_medecin
    });
    if (errors.code_medecin) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated.code_medecin;
        return updated;
      });
    }
  };

  // Navigation entre étapes
  const goToStep = (target) => {
    if (target < 1 || target > TOTAL_STEPS) return;
    setCurrentStep(target);
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;

    if (currentStep < TOTAL_STEPS) {
      goToStep(currentStep + 1);
    } else {
      // Soumission finale
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) goToStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setSuccess(false);

    // Valider le formulaire complet avant l'envoi
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
        showToast('success', 'Compte créé avec succès ! Redirection vers votre espace…');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        console.error("Erreur d'inscription:", result.error);
        // Gérer les erreurs de l'API qui peuvent être des objets
        if (typeof result.error === 'object' && result.error !== null) {
          if (result.error.detail) {
            setErrors({ general: result.error.detail });
            showToast('error', result.error.detail);
          } else if (result.error.non_field_errors) {
            const msg = result.error.non_field_errors.join(', ');
            setErrors({ general: msg });
            showToast('error', msg);
          } else {
            const newErrors = {};
            for (const key in result.error) {
              if (Array.isArray(result.error[key])) {
                newErrors[key] = result.error[key].join(', ');
              } else {
                newErrors[key] = result.error[key];
              }
            }
            setErrors(newErrors);
            showToast('error', Object.values(newErrors).join(', '));
          }
        } else {
          const msg = result.error || "Une erreur est survenue lors de l'inscription. Veuillez réessayer.";
          setErrors({ general: msg });
          showToast('error', msg);
        }
      }
    } catch (error) {
      console.error("Exception lors de l'inscription:", error);
      const msg = "Une erreur est survenue lors de l'inscription. Veuillez réessayer.";
      setErrors({ general: msg });
      showToast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Stepper fill percentage
  const stepperPct = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;

  return (
    <div className="register-cinematic">
      {/* Curseur lumineux */}
      <div className="cursor-glow" ref={cursorGlowRef} aria-hidden="true"></div>

      {/* Grain cinematographique */}
      <div className="film-grain" aria-hidden="true"></div>

      {/* Vignette */}
      <div className="vignette" aria-hidden="true"></div>

      <main className="stage">

        {/* ====== Panneau gauche : scene 3D ====== */}
        <section className="scene-panel" aria-label="Atmosphere visuelle">
          <LoginScene3D />

          <div className="aurora aurora-1" aria-hidden="true"></div>
          <div className="aurora aurora-2" aria-hidden="true"></div>
          <div className="aurora aurora-3" aria-hidden="true"></div>



          <article className="scene-caption">
            <p className="overline">
              <span className="overline-dot" aria-hidden="true"></span>
              Rejoignez la communauté de soins
            </p>
            <h1 className="scene-title">
              Prenez soin de<br />
              ce qui <em>compte vraiment.</em>
            </h1>
            <p className="scene-subtitle">
              Créez votre espace en quelques instants et accédez
              à un suivi médical fluide, centré sur vous.
            </p>

            {/* Indicateur d'avancement côté scène */}
            <div className="side-steps" aria-hidden="true">
              <div className={'side-step' + (currentStep === 1 ? ' is-active' : '') + (currentStep > 1 ? ' is-done' : '')} data-step="1">
                <span className="ss-num">01</span>
                <div className="ss-info">
                  <span className="ss-label">Votre profil</span>
                  <span className="ss-desc">Identité & rôle</span>
                </div>
              </div>
              <div className="side-step-line"></div>
              <div className={'side-step' + (currentStep === 2 ? ' is-active' : '') + (currentStep > 2 ? ' is-done' : '')} data-step="2">
                <span className="ss-num">02</span>
                <div className="ss-info">
                  <span className="ss-label">Coordonnées</span>
                  <span className="ss-desc">Contact & adresse</span>
                </div>
              </div>
              <div className="side-step-line"></div>
              <div className={'side-step' + (currentStep === 3 ? ' is-active' : '') + (currentStep > 3 ? ' is-done' : '')} data-step="3">
                <span className="ss-num">03</span>
                <div className="ss-info">
                  <span className="ss-label">Sécurité</span>
                  <span className="ss-desc">Mot de passe</span>
                </div>
              </div>
            </div>

            <ul className="scene-features" role="list">
              <li><i className="fa-solid fa-shield-heart"></i><span>Données chiffrées de bout en bout</span></li>
              <li><i className="fa-solid fa-calendar-check"></i><span>Synchronisation en temps réel</span></li>
              <li><i className="fa-solid fa-user-doctor"></i><span>Conçu avec des praticiens</span></li>
            </ul>
          </article>

          <footer className="scene-footer">
            <span>© 2025 Sereon Health</span>
            <span className="separator" aria-hidden="true">•</span>
            <a href="#">Mentions légales</a>
            <span className="separator" aria-hidden="true">•</span>
            <a href="#">Confidentialité</a>
          </footer>
        </section>

        {/* ====== Panneau droit : formulaire multi-étapes ====== */}
        <section className="form-panel" aria-label="Créer votre compte">

          <div className="form-wrap">



            {/* Lien connexion */}
            <p className="signup-link">
              Déjà inscrit ? <Link to="/">Se connecter</Link>
            </p>

            {/* En-tête formulaire */}
            <header className="form-header">
              <h2 className="form-title" id="stepTitle">{STEPS[currentStep - 1].title}</h2>
              <p className="form-lead" id="stepLead">{STEPS[currentStep - 1].lead}</p>
            </header>

            {/* Stepper horizontal */}
            <nav className="stepper" aria-label="Étapes d'inscription">
              <div className="stepper-track" aria-hidden="true">
                <div className="stepper-fill" style={{ width: stepperPct + '%' }}></div>
              </div>
              <ol className="stepper-list">
                <li className={'step-item' + (currentStep === 1 ? ' is-active' : '') + (currentStep > 1 ? ' is-done' : '')} data-step="1">
                  <button type="button" className="step-btn" aria-label="Étape 1 : Profil">
                    <span className="step-circle">
                      <i className="fa-solid fa-user step-icon"></i>
                      <i className="fa-solid fa-check step-check"></i>
                    </span>
                  </button>
                  <span className="step-label">Profil</span>
                </li>
                <li className={'step-item' + (currentStep === 2 ? ' is-active' : '') + (currentStep > 2 ? ' is-done' : '')} data-step="2">
                  <button type="button" className="step-btn" aria-label="Étape 2 : Coordonnées">
                    <span className="step-circle">
                      <i className="fa-solid fa-location-dot step-icon"></i>
                      <i className="fa-solid fa-check step-check"></i>
                    </span>
                  </button>
                  <span className="step-label">Coordonnées</span>
                </li>
                <li className={'step-item' + (currentStep === 3 ? ' is-active' : '') + (currentStep > 3 ? ' is-done' : '')} data-step="3">
                  <button type="button" className="step-btn" aria-label="Étape 3 : Sécurité">
                    <span className="step-circle">
                      <i className="fa-solid fa-lock step-icon"></i>
                      <i className="fa-solid fa-check step-check"></i>
                    </span>
                  </button>
                  <span className="step-label">Sécurité</span>
                </li>
              </ol>
            </nav>

            <form className="register-form" id="registerForm" noValidate onSubmit={(e) => { e.preventDefault(); handleNext(); }}>

              {/* ========= ÉTAPE 1 : Profil & identité ========= */}
              <fieldset className={'step-panel' + (currentStep === 1 ? ' is-active' : ' is-hidden')} data-panel="1">
                <legend className="sr-only">Étape 1 — Votre profil</legend>

                {/* Choix de rôle */}
                <div className="field field--full">
                  <label className="field-label">Vous êtes…</label>
                  <div className="role-switch" id="roleSwitch" role="group" aria-label="Rôle">
                    <label className={'role-card' + (formData.role === 'patient' ? ' is-active' : '')} data-role="patient">
                      <input type="radio" name="role" value="patient" checked={formData.role === 'patient'} onChange={() => handleRoleChange('patient')} hidden />
                      <span className="role-card-icon"><i className="fa-regular fa-user"></i></span>
                      <span className="role-card-title">Patient</span>
                      <span className="role-card-desc">Gérez vos rendez-vous & suivi</span>
                      <span className="role-card-check" aria-hidden="true"><i className="fa-solid fa-check"></i></span>
                    </label>
                    <label className={'role-card' + (formData.role === 'medecin' ? ' is-active' : '')} data-role="medecin">
                      <input type="radio" name="role" value="medecin" checked={formData.role === 'medecin'} onChange={() => handleRoleChange('medecin')} hidden />
                      <span className="role-card-icon"><i className="fa-solid fa-user-doctor"></i></span>
                      <span className="role-card-title">Médecin</span>
                      <span className="role-card-desc">Consultations & suivi patients</span>
                      <span className="role-card-check" aria-hidden="true"><i className="fa-solid fa-check"></i></span>
                    </label>
                    <label className={'role-card' + (formData.role === 'reception' ? ' is-active' : '')} data-role="reception">
                      <input type="radio" name="role" value="reception" checked={formData.role === 'reception'} onChange={() => handleRoleChange('reception')} hidden />
                      <span className="role-card-icon"><i className="fa-solid fa-stethoscope"></i></span>
                      <span className="role-card-title">Réception</span>
                      <span className="role-card-desc">Accueil & gestion du cabinet</span>
                      <span className="role-card-check" aria-hidden="true"><i className="fa-solid fa-check"></i></span>
                    </label>
                  </div>
                </div>

                {/* Code médecin — conditionnel (rôle réception) */}
                {formData.role === 'reception' && (
                  <div className="field field--full code-medecin-field">
                    <label htmlFor="code_medecin" className="field-label">
                      Code médecin <span className="required" aria-hidden="true">*</span>
                    </label>
                    <div className={'input-wrap' + (errors.code_medecin ? ' shake' : '')} id="code_medecinWrap">
                      <i className="fa-solid fa-id-badge input-icon" aria-hidden="true"></i>
                      <input
                        type="text"
                        id="code_medecin"
                        name="code_medecin"
                        autoComplete="off"
                        placeholder="Ex : MED-2024-XXXXX"
                        value={formData.code_medecin}
                        onChange={handleChange}
                        required
                      />
                      <span className="input-underline" aria-hidden="true"></span>
                    </div>
                    {errors.code_medecin && <span className="field-error is-visible">{errors.code_medecin}</span>}
                  </div>
                )}

                {/* Nom / Prénom */}
                <div className="fields-row">
                  <div className="field">
                    <label htmlFor="first_name" className="field-label">
                      Prénom <span className="required" aria-hidden="true">*</span>
                    </label>
                    <div className={'input-wrap' + (errors.first_name ? ' shake' : '')} id="first_nameWrap">
                      <i className="fa-regular fa-id-card input-icon" aria-hidden="true"></i>
                      <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        autoComplete="given-name"
                        placeholder="Marie"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                      />
                      <span className="input-underline" aria-hidden="true"></span>
                    </div>
                    {errors.first_name && <span className="field-error is-visible">{errors.first_name}</span>}
                  </div>
                  <div className="field">
                    <label htmlFor="last_name" className="field-label">
                      Nom <span className="required" aria-hidden="true">*</span>
                    </label>
                    <div className={'input-wrap' + (errors.last_name ? ' shake' : '')} id="last_nameWrap">
                      <i className="fa-regular fa-id-card input-icon" aria-hidden="true"></i>
                      <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        autoComplete="family-name"
                        placeholder="Dupont"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                      />
                      <span className="input-underline" aria-hidden="true"></span>
                    </div>
                    {errors.last_name && <span className="field-error is-visible">{errors.last_name}</span>}
                  </div>
                </div>

                {/* Nom d'utilisateur */}
                <div className="field field--full">
                  <label htmlFor="username" className="field-label">
                    Nom d'utilisateur <span className="required" aria-hidden="true">*</span>
                  </label>
                  <div className={'input-wrap' + (errors.username ? ' shake' : '')} id="usernameWrap">
                    <i className="fa-solid fa-at input-icon" aria-hidden="true"></i>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      autoComplete="username"
                      placeholder="marie_dupont"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                    <span className={'username-check' + (usernameOk ? ' is-ok' : '') + (usernameInvalid ? ' is-invalid' : '')} id="usernameCheck" aria-hidden="true">
                      {usernameOk && <i className="fa-solid fa-circle-check"></i>}
                      {usernameInvalid && <i className="fa-solid fa-circle-xmark"></i>}
                    </span>
                    <span className="input-underline" aria-hidden="true"></span>
                  </div>
                  <span className="field-hint">Minimum 3 caractères, lettres, chiffres et _ uniquement.</span>
                  {errors.username && <span className="field-error is-visible">{errors.username}</span>}
                </div>

                {/* Email */}
                <div className="field field--full">
                  <label htmlFor="email" className="field-label">
                    Adresse e-mail <span className="required" aria-hidden="true">*</span>
                  </label>
                  <div className={'input-wrap' + (errors.email ? ' shake' : '')} id="emailWrap">
                    <i className="fa-regular fa-envelope input-icon" aria-hidden="true"></i>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      autoComplete="email"
                      placeholder="marie@exemple.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                    <span className="input-underline" aria-hidden="true"></span>
                  </div>
                  {errors.email && <span className="field-error is-visible">{errors.email}</span>}
                </div>
              </fieldset>

              {/* ========= ÉTAPE 2 : Coordonnées ========= */}
              <fieldset className={'step-panel' + (currentStep === 2 ? ' is-active' : ' is-hidden')} data-panel="2">
                <legend className="sr-only">Étape 2 — Coordonnées</legend>

                {/* Téléphone */}
                <div className="field field--full">
                  <label htmlFor="phone" className="field-label">Téléphone</label>
                  <div className={'input-wrap' + (errors.phone ? ' shake' : '')} id="phoneWrap">
                    <i className="fa-solid fa-phone input-icon" aria-hidden="true"></i>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      autoComplete="tel"
                      placeholder="+33 6 12 34 56 78"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                    <span className="input-underline" aria-hidden="true"></span>
                  </div>
                  {errors.phone && <span className="field-error is-visible">{errors.phone}</span>}
                </div>

                {/* Date de naissance */}
                <div className="field field--full">
                  <label htmlFor="date_of_birth" className="field-label">Date de naissance</label>
                  <div className={'input-wrap' + (errors.date_of_birth ? ' shake' : '')} id="date_of_birthWrap">
                    <i className="fa-solid fa-cake-candles input-icon" aria-hidden="true"></i>
                    <input
                      type="date"
                      id="date_of_birth"
                      name="date_of_birth"
                      autoComplete="bday"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                    />
                    <span className="input-underline" aria-hidden="true"></span>
                  </div>
                  {errors.date_of_birth && <span className="field-error is-visible">{errors.date_of_birth}</span>}
                </div>

                {/* Adresse */}
                <div className="field field--full">
                  <label htmlFor="address" className="field-label">Adresse</label>
                  <div className={'input-wrap' + (errors.address ? ' shake' : '')} id="addressWrap">
                    <i className="fa-solid fa-house input-icon" aria-hidden="true"></i>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      autoComplete="street-address"
                      placeholder="12 rue des Lilas"
                      value={formData.address}
                      onChange={handleChange}
                    />
                    <span className="input-underline" aria-hidden="true"></span>
                  </div>
                  {errors.address && <span className="field-error is-visible">{errors.address}</span>}
                </div>

                {/* Ville */}
                <div className="field field--full">
                  <label htmlFor="city" className="field-label">Ville</label>
                  <div className={'input-wrap' + (errors.city ? ' shake' : '')} id="cityWrap">
                    <i className="fa-solid fa-location-dot input-icon" aria-hidden="true"></i>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      autoComplete="address-level2"
                      placeholder="Paris"
                      value={formData.city}
                      onChange={handleChange}
                    />
                    <span className="input-underline" aria-hidden="true"></span>
                  </div>
                  {errors.city && <span className="field-error is-visible">{errors.city}</span>}
                </div>
              </fieldset>

              {/* ========= ÉTAPE 3 : Mot de passe ========= */}
              <fieldset className={'step-panel' + (currentStep === 3 ? ' is-active' : ' is-hidden')} data-panel="3">
                <legend className="sr-only">Étape 3 — Sécurité</legend>

                {/* Mot de passe */}
                <div className="field field--full">
                  <label htmlFor="password" className="field-label">
                    Mot de passe <span className="required" aria-hidden="true">*</span>
                  </label>
                  <div className={'input-wrap' + (errors.password ? ' shake' : '')} id="passwordWrap">
                    <i className="fa-solid fa-lock input-icon" aria-hidden="true"></i>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      autoComplete="new-password"
                      placeholder="••••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="toggle-pwd"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      <i className={showPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'}></i>
                    </button>
                    <span className="input-underline" aria-hidden="true"></span>
                  </div>

                  {/* Barre de force du mot de passe */}
                  <div className="strength-bar" aria-hidden="true">
                    {[1, 2, 3, 4].map(seg => (
                      <div
                        key={seg}
                        className={'strength-seg' + (seg <= passwordStrength ? ' ' + STRENGTH_COLORS[passwordStrength] : '')}
                        data-seg={seg}
                      ></div>
                    ))}
                  </div>
                  <span className="strength-label">{formData.password ? STRENGTH_LABELS[passwordStrength] : ''}</span>
                  {errors.password && <span className="field-error is-visible">{errors.password}</span>}
                </div>

                {/* Règles de sécurité */}
                <ul className="pwd-rules" aria-live="polite">
                  {pwdRules.map(r => (
                    <li key={r.rule} className={'pwd-rule' + (r.ok ? ' is-ok' : '')}>
                      <i className="fa-solid fa-circle-check"></i>
                      <span>{r.label}</span>
                    </li>
                  ))}
                </ul>

                {/* Confirmation */}
                <div className="field field--full">
                  <label htmlFor="password_confirm" className="field-label">
                    Confirmer le mot de passe <span className="required" aria-hidden="true">*</span>
                  </label>
                  <div className={'input-wrap' + (errors.password_confirm ? ' shake' : '')} id="password_confirmWrap">
                    <i className="fa-solid fa-lock input-icon" aria-hidden="true"></i>
                    <input
                      type={showPasswordConfirm ? 'text' : 'password'}
                      id="password_confirm"
                      name="password_confirm"
                      autoComplete="new-password"
                      placeholder="••••••••••"
                      value={formData.password_confirm}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="toggle-pwd"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      aria-label={showPasswordConfirm ? 'Masquer la confirmation' : 'Afficher la confirmation'}
                    >
                      <i className={showPasswordConfirm ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'}></i>
                    </button>
                    <span className={'match-icon' + (passwordsMatch ? ' is-ok' : '') + (passwordsMismatch ? ' is-invalid' : '')} aria-hidden="true">
                      {passwordsMatch && <i className="fa-solid fa-circle-check"></i>}
                      {passwordsMismatch && <i className="fa-solid fa-circle-xmark"></i>}
                    </span>
                    <span className="input-underline" aria-hidden="true"></span>
                  </div>
                  {errors.password_confirm && <span className="field-error is-visible">{errors.password_confirm}</span>}
                </div>

                {/* CGU */}
                <div className="field field--full cgu-field">
                  <label className="checkbox">
                    <input type="checkbox" id="cgu" name="cgu" required />
                    <span className="checkbox-box" aria-hidden="true"><i className="fa-solid fa-check"></i></span>
                    <span>J'accepte les <a href="#" className="link-teal">Conditions d'utilisation</a> et la <a href="#" className="link-teal">Politique de confidentialité</a></span>
                  </label>
                  {errors.general && <span className="field-error is-visible">{errors.general}</span>}
                </div>
              </fieldset>

              {/* ========= Navigation stepper ========= */}
              <div className="step-nav">
                {currentStep > 1 && (
                  <button type="button" className="btn-secondary" onClick={handlePrev}>
                    <i className="fa-solid fa-arrow-left"></i>
                    <span>Précédent</span>
                  </button>
                )}
                <button
                  type="submit"
                  className={'btn-primary' + (loading ? ' is-loading' : '')}
                  disabled={loading}
                >
                  <span className="btn-label">{STEPS[currentStep - 1].btnLabel}</span>
                  <span className="btn-icon" aria-hidden="true"><i className="fa-solid fa-arrow-right"></i></span>
                  <span className="btn-loader" aria-hidden="true"></span>
                </button>
              </div>

              {/* Toast */}
              <div
                className={'form-toast' + (toastVisible ? ' is-visible' : '') + ' ' + (toastType === 'error' ? 'form-toast-error' : 'form-toast-success')}
                role="status"
                aria-live="polite"
              >
                <i className={toastType === 'error' ? 'fa-solid fa-circle-xmark' : 'fa-solid fa-circle-check'}></i>
                <span>{toastMessage}</span>
              </div>

            </form>

            {/* Numéro d'étape discret */}
            <p className="step-counter" aria-live="polite">
              Étape <span>{currentStep}</span> sur {TOTAL_STEPS}
            </p>

          </div>
        </section>
      </main>
    </div>
  );
};

export default Register;
