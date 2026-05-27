import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginScene3D from '../components/LoginScene3D';
import './LoginCinematic.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeRole, setActiveRole] = useState('patient');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState('success');
  const [toastMessage, setToastMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const cursorGlowRef = useRef(null);
  const formRef = useRef(null);

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

  // Validation
  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = "Le nom d'utilisateur est requis";
    }
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
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
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Shake animation
  const shakeElement = (el) => {
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  };

  const showToast = (type, message) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username.trim()) {
      shakeElement(document.getElementById('usernameWrap'));
      setErrors({ ...errors, username: "Le nom d'utilisateur est requis" });
      return;
    }
    if (!formData.password) {
      shakeElement(document.getElementById('passwordWrap'));
      setErrors({ ...errors, password: 'Le mot de passe est requis' });
      return;
    }

    setLoading(true);

    try {
      const result = await login(formData.username, formData.password);
      if (result.success) {
        showToast('success', 'Connexion reussie. Preparation de votre espace...');
        setTimeout(() => {
          if (result.user.role === 'medecin') {
            navigate('/dashboard/medecin');
          } else if (result.user.role === 'reception') {
            navigate('/reception/dashboard');
          } else if (result.user.role === 'patient') {
            navigate('/medecins');
          } else {
            navigate('/medecins');
          }
        }, 1200);
      } else {
        showToast('error', result.error || 'Erreur de connexion');
        setErrors({ general: result.error });
      }
    } catch (error) {
      showToast('error', 'Une erreur est survenue lors de la connexion. Veuillez reessayer.');
      setErrors({ general: 'Une erreur est survenue lors de la connexion. Veuillez reessayer.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-cinematic">
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
              Gestion de rendez-vous medicaux
            </p>
            <h1 className="scene-title">
              Le soin commence<br />
              par un <em>moment</em> bien choisi.
            </h1>
            <p className="scene-subtitle">
              Une interface pensee pour les soignants et les patients,
              ou chaque rendez-vous trouve sa juste place.
            </p>

            <ul className="scene-features" role="list">
              <li><i className="fa-solid fa-shield-heart"></i><span>Donnees chiffrees de bout en bout</span></li>
              <li><i className="fa-solid fa-calendar-check"></i><span>Synchronisation en temps reel</span></li>
              <li><i className="fa-solid fa-user-doctor"></i><span>Concu avec des praticiens</span></li>
            </ul>
          </article>


        </section>

        {/* ====== Panneau droit : formulaire ====== */}
        <section className="form-panel" aria-label="Connexion a votre compte">

          <div className="form-wrap">

            <div className="form-top">
              <p className="signup-link">
                Nouveau ici ? <Link to="/register">Creer un compte</Link>
              </p>
            </div>

            <header className="form-header">
              <h2 className="form-title">Bon retour parmi nous.</h2>
              <p className="form-lead">Connectez-vous pour retrouver vos rendez-vous, vos praticiens et votre suivi.</p>
            </header>

            <form className="login-form" id="loginForm" onSubmit={handleSubmit} noValidate ref={formRef}>

              <div className="field">
                <label htmlFor="username">Nom d'utilisateur</label>
                <div className={'input-wrap' + (errors.username ? ' shake' : '')} id="usernameWrap">
                  <i className="fa-regular fa-user input-icon" aria-hidden="true"></i>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    autoComplete="username"
                    placeholder="votre nom d'utilisateur"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                  <span className="input-underline" aria-hidden="true"></span>
                </div>
                {errors.username && <div className="field-error">{errors.username}</div>}
              </div>

              <div className="field">
                <div className="label-row">
                  <label htmlFor="password">Mot de passe</label>
                  <Link to="/reset-password" className="forgot">Oublie ?</Link>
                </div>
                <div className={'input-wrap' + (errors.password ? ' shake' : '')} id="passwordWrap">
                  <i className="fa-solid fa-lock input-icon" aria-hidden="true"></i>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
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
                {errors.password && <div className="field-error">{errors.password}</div>}
              </div>

              <div className="row-between">
                <label className="checkbox">
                  <input type="checkbox" id="remember" />
                  <span className="checkbox-box" aria-hidden="true">
                    <i className="fa-solid fa-check"></i>
                  </span>
                  <span>Se souvenir de moi</span>
                </label>
                <span className="secured">
                  <i className="fa-solid fa-shield-halved"></i>
                  Connexion securisee
                </span>
              </div>

              <button
                type="submit"
                className={'btn-primary' + (loading ? ' is-loading' : '')}
                disabled={loading}
              >
                <span className="btn-label">{loading ? 'Connexion...' : 'Se connecter'}</span>
                <span className="btn-icon" aria-hidden="true">
                  <i className="fa-solid fa-arrow-right"></i>
                </span>
                <span className="btn-loader" aria-hidden="true"></span>
              </button>

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

          </div>
        </section>
      </main>
    </div>
  );
};

export default Login;
