import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { medecinService } from '../services/medecinService';
import Alert from '../components/Alert';
import './SuggestionsConfig.css';

const SuggestionsConfig = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [medecinProfile, setMedecinProfile] = useState(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState({
    vert: [],
    jaune: [],
    rouge: []
  });

  // Suggestions pré-définies pour chaque type de bouton
  const suggestionsPredefinies = {
    vert: [
      { id: 'v1', text: 'Consultation', description: 'Consultation dentaire générale' }
    ],
    jaune: [
      { id: 'j1', text: 'Suivi post-traitement', description: 'Après un traitement (plombage, couronne, extraction), le patient a mal ou des sensations inhabituelles qui ne sont pas urgentes mais nécessitent un contrôle' },
      { id: 'j2', text: 'Ajustement d\'appareil', description: 'Le patient a un appareil dentaire (orthodontie, prothèse) qui gêne ou blesse légèrement' },
      { id: 'j3', text: 'Douleur légère à modérée', description: 'Le patient ressent une douleur supportable qui n\'empêche pas ses activités quotidiennes' },
      { id: 'j4', text: 'Question sur un traitement en cours', description: 'Le patient a des interrogations sur son traitement ou des effets secondaires mineurs' },
      { id: 'j5', text: 'Sensibilité dentaire', description: 'Sensibilité au chaud/froid ou sucré qui apparaît progressivement' },
      { id: 'j6', text: 'Petite complication', description: 'Une petite fissure, un écaillage de plombage qui ne cause pas de douleur intense' },
      { id: 'j7', text: 'Sensibilité dentaire', description: 'Douleur légère lors de la consommation d\'aliments chauds/froids ou sucrés' },
      { id: 'j8', text: 'Gêne après traitement', description: 'Sensation d\'inconfort après un plombage, couronne ou dévitalisation' },
      { id: 'j9', text: 'Petite fracture', description: 'Une petite partie de la dent s\'est cassée mais sans douleur intense' },
      { id: 'j10', text: 'Plombage décollé', description: 'Un plombage est parti mais sans douleur intense' },
      { id: 'j11', text: 'Gencives qui saignent légèrement', description: 'Saignement mineur lors du brossage' },
      { id: 'j12', text: 'Mauvaise haleine persistante', description: 'Problème d\'halitose qui incommode le patient' },
      { id: 'j13', text: 'Petit kyste ou aphte', description: 'Légère gêne mais pas de douleur intense' },
      { id: 'j14', text: 'Question sur un médicament', description: 'Le patient a des questions sur les médicaments prescrits' },
      { id: 'j15', text: 'Douleur légère à la mâchoire', description: 'Légère tension ou douleur à la mâchoire, peut-être liée à l\'articulation' }
    ],
    rouge: [
      { id: 'r1', text: 'Douleur intense et insupportable', description: 'Douleur aiguë qui empêche le patient de dormir ou de vaquer à ses activités normales' },
      { id: 'r2', text: 'Traumatisme dentaire', description: 'Dent cassée, arrachée ou déplacée suite à un choc' },
      { id: 'r3', text: 'Infection avancée', description: 'Gonflement important du visage, fièvre, douleur pulsatile, signes d\'abcès' },
      { id: 'r4', text: 'Saignement important', description: 'Saignement qui ne s\'arrête pas après une extraction ou un traumatisme' },
      { id: 'r5', text: 'Réaction allergique sévère', description: 'Gonflement des lèvres, de la langue, difficulté à respirer suite à un traitement ou médicament' },
      { id: 'r6', text: 'Douleur accompagnée de fièvre', description: 'Douleur dentaire avec fièvre élevée, signe d\'une infection qui se propage' },
      { id: 'r7', text: 'Dent cassée avec nerf exposé', description: 'Fracture importante avec douleur vive' },
      { id: 'r8', text: 'Abcès dentaire', description: 'Infection purulente avec gonflement du visage' },
      { id: 'r9', text: 'Hémorragie importante', description: 'Saignement continu qui ne s\'arrête pas après une extraction' },
      { id: 'r10', text: 'Gonflement important du visage', description: 'Œdème significatif qui peut affecter la respiration ou la déglutition' },
      { id: 'r11', text: 'Fièvre élevée avec douleur dentaire', description: 'Signe d\'infection qui se propage' },
      { id: 'r12', text: 'Couronne ou bridge tombé', description: 'Prothèse qui est tombée avec douleur intense' },
      { id: 'r13', text: 'Douleur irradiante', description: 'Douleur qui se propage à l\'oreille, au cou ou à la tête' },
      { id: 'r14', text: 'Difficulté à ouvrir la bouche', description: 'Trismus important empêchant d\'ouvrir la bouche normalement' },
      { id: 'r15', text: 'Perte de sensation', description: 'Engourdissement ou perte de sensibilité après un traitement' }
    ]
  };

  useEffect(() => {
    fetchMedecinProfile();
  }, []);

  const fetchMedecinProfile = async () => {
    setLoading(true);
    setError('');

    const result = await medecinService.getMedecinProfile();

    if (result.success) {
      setMedecinProfile(result.data);
      // Charger les suggestions déjà sélectionnées si elles existent
      if (result.data.suggestions_config) {
        // S'assurer que toutes les clés nécessaires sont présentes
        setSelectedSuggestions({
          vert: result.data.suggestions_config.vert || [],
          jaune: result.data.suggestions_config.jaune || [],
          rouge: result.data.suggestions_config.rouge || []
        });
      }
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleSuggestionToggle = (boutonType, suggestionId) => {
    setSelectedSuggestions(prev => {
      const boutonSuggestions = [...prev[boutonType]];
      const index = boutonSuggestions.indexOf(suggestionId);

      if (index > -1) {
        // Si la suggestion est déjà sélectionnée, la retirer
        boutonSuggestions.splice(index, 1);
      } else {
        // Sinon, l'ajouter
        boutonSuggestions.push(suggestionId);
      }

      return {
        ...prev,
        [boutonType]: boutonSuggestions
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Vérifier qu'au moins une suggestion est sélectionnée pour au moins un bouton
    const hasAnySelection = Object.values(selectedSuggestions).some(suggestions => suggestions.length > 0);

    if (!hasAnySelection) {
      setError('Veuillez sélectionner au moins une suggestion pour au moins un bouton.');
      setLoading(false);
      return;
    }

    // Préparer les données à envoyer
    const formDataToSend = new FormData();
    formDataToSend.append('suggestions_config', JSON.stringify(selectedSuggestions));

    const result = await medecinService.updateMedecinProfile(formDataToSend);

    if (result.success) {
      setSuccess('Suggestions configurées avec succès !');
      setTimeout(() => {
        navigate('/dashboard/medecin');
      }, 2000);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  if (loading && !medecinProfile) {
    return <div className="text-center mt-5">Chargement...</div>;
  }

  return (
    <div className="suggestions-config">
      <div className="container mt-4">
        <div className="page-header mb-4">
          <h1 className="page-title">Configuration des Suggestions Pré-définies</h1>
          <p className="page-description">
            Sélectionnez les suggestions que vous souhaitez activer pour chaque type de bouton.
            Ces suggestions seront affichées aux patients lors de la gestion de leurs rendez-vous.
          </p>
          <button 
            type="button" 
            className="btn btn-secondary btn-back" 
            onClick={() => navigate('/dashboard/medecin')}
          >
            ← Retour au Tableau de bord - Médecin
          </button>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        <form onSubmit={handleSubmit}>
          <div className="suggestions-container">
            {/* Bouton VERT - Consultation */}
            <div className="suggestion-section vert-section">
              <div className="section-header">
                <div className="section-icon">✓</div>
                <div>
                  <h3 className="section-title">Bouton VERT - Consultation</h3>
                  <p className="section-description">Ce bouton est utilisé pour les consultations dentaires générales</p>
                </div>
              </div>
              <div className="section-content">
                <div className="suggestions-grid">
                  {suggestionsPredefinies.vert.map(suggestion => (
                    <div 
                      key={suggestion.id} 
                      className={`suggestion-card ${selectedSuggestions.vert.includes(suggestion.id) ? 'selected' : ''}`}
                      onClick={() => handleSuggestionToggle('vert', suggestion.id)}
                    >
                      <div className="suggestion-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedSuggestions.vert.includes(suggestion.id)}
                          onChange={() => handleSuggestionToggle('vert', suggestion.id)}
                        />
                      </div>
                      <div className="suggestion-content">
                        <h4 className="suggestion-title">{suggestion.text}</h4>
                        <p className="suggestion-description">{suggestion.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bouton JAUNE - Suivi */}
            <div className="suggestion-section jaune-section">
              <div className="section-header">
                <div className="section-icon">⚠</div>
                <div>
                  <h3 className="section-title">Bouton JAUNE - Suivi</h3>
                  <p className="section-description">Ce bouton est utilisé pour les situations non urgentes nécessitant un suivi</p>
                </div>
              </div>
              <div className="section-content">
                <div className="suggestions-grid">
                  {suggestionsPredefinies.jaune.map(suggestion => (
                    <div 
                      key={suggestion.id} 
                      className={`suggestion-card ${selectedSuggestions.jaune.includes(suggestion.id) ? 'selected' : ''}`}
                      onClick={() => handleSuggestionToggle('jaune', suggestion.id)}
                    >
                      <div className="suggestion-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedSuggestions.jaune.includes(suggestion.id)}
                          onChange={() => handleSuggestionToggle('jaune', suggestion.id)}
                        />
                      </div>
                      <div className="suggestion-content">
                        <h4 className="suggestion-title">{suggestion.text}</h4>
                        <p className="suggestion-description">{suggestion.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bouton ROUGE - Urgence */}
            <div className="suggestion-section rouge-section">
              <div className="section-header">
                <div className="section-icon">!</div>
                <div>
                  <h3 className="section-title">Bouton ROUGE - Urgence</h3>
                  <p className="section-description">Ce bouton est utilisé pour les situations d'urgence dentaire</p>
                </div>
              </div>
              <div className="section-content">
                <div className="suggestions-grid">
                  {suggestionsPredefinies.rouge.map(suggestion => (
                    <div 
                      key={suggestion.id} 
                      className={`suggestion-card ${selectedSuggestions.rouge.includes(suggestion.id) ? 'selected' : ''}`}
                      onClick={() => handleSuggestionToggle('rouge', suggestion.id)}
                    >
                      <div className="suggestion-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedSuggestions.rouge.includes(suggestion.id)}
                          onChange={() => handleSuggestionToggle('rouge', suggestion.id)}
                        />
                      </div>
                      <div className="suggestion-content">
                        <h4 className="suggestion-title">{suggestion.text}</h4>
                        <p className="suggestion-description">{suggestion.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Confirmer les choix'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuggestionsConfig;
