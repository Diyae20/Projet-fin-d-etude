import React, { useState, useEffect, useCallback, useRef } from 'react';
import { rendezvousService } from '../services/rendezvousService';
import { useAuth } from '../contexts/AuthContext';

// Fonction pour créer un son d'alerte urgent avec le Web Audio API
const playUrgentAlarm = () => {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let isPlaying = true;

  const playBeep = (time, freq, duration) => {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(freq, time);
    gainNode.gain.setValueAtTime(0.3, time);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);
    oscillator.start(time);
    oscillator.stop(time + duration);
  };

  const scheduleAlarm = () => {
    if (!isPlaying) return;
    const now = audioCtx.currentTime;
    // Pattern urgent: deux bips courts avertis suivis d'un bip long
    for (let i = 0; i < 3; i++) {
      playBeep(now + i * 0.6, 880, 0.15);   // bip court aigu
      playBeep(now + i * 0.6 + 0.2, 880, 0.15); // bip court aigu
    }
    // Bip long grave
    playBeep(now + 1.8, 660, 0.4);

    // Replanifier après 2.5 secondes
    setTimeout(() => {
      if (isPlaying) scheduleAlarm();
    }, 2500);
  };

  scheduleAlarm();

  return {
    stop: () => {
      isPlaying = false;
      audioCtx.close();
    }
  };
};

const UrgentNotificationAlert = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const alarmRef = useRef(null);
  const prevAlertRef = useRef(false);

  // Vérifier si l'utilisateur a le droit de voir les notifications urgentes
  const canViewNotifications = user && (user.role === 'reception' || user.role === 'admin');

  const stopAlarm = useCallback(() => {
    if (alarmRef.current) {
      alarmRef.current.stop();
      alarmRef.current = null;
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!canViewNotifications) return;
    const result = await rendezvousService.getNotificationsUrgentes();
    if (result.success) {
      const notifs = result.data.notifications || [];
      setNotifications(notifs);

      const nonAcquittees = notifs.filter(n => !n.acquitte);
      if (nonAcquittees.length > 0) {
        if (!currentNotification || !nonAcquittees.find(n => n.id === currentNotification.id)) {
          setCurrentNotification(nonAcquittees[0]);
        }
        setShowAlert(true);
        setIsFlashing(true);
      } else {
        setShowAlert(false);
        setIsFlashing(false);
        setCurrentNotification(null);
      }
    }
  }, [currentNotification, canViewNotifications]);

  // Gérer le son d'alarme
  useEffect(() => {
    if (showAlert && !prevAlertRef.current) {
      // L'alerte vient d'apparaître -> démarrer le son
      stopAlarm();
      alarmRef.current = playUrgentAlarm();
    } else if (!showAlert && prevAlertRef.current) {
      // L'alerte vient de disparaître -> arrêter le son
      stopAlarm();
    }
    prevAlertRef.current = showAlert;
  }, [showAlert, stopAlarm]);

  // Nettoyer le son au démontage du composant
  useEffect(() => {
    return () => stopAlarm();
  }, [stopAlarm]);

  // Arrêter l'alarme quand l'utilisateur n'a plus les droits
  useEffect(() => {
    if (!canViewNotifications) {
      stopAlarm();
      setShowAlert(false);
      setIsFlashing(false);
      setCurrentNotification(null);
      setNotifications([]);
    }
  }, [canViewNotifications, stopAlarm]);

  useEffect(() => {
    if (!canViewNotifications) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 3000);
    return () => clearInterval(interval);
  }, [fetchNotifications, canViewNotifications]);

  // Ne rien rendre si l'utilisateur n'a pas les droits
  if (!canViewNotifications) return null;

  const handleAcquitter = async (id) => {
    stopAlarm();
    await rendezvousService.acquitterNotification(id);
    setCurrentNotification(null);
    setShowAlert(false);
    setIsFlashing(false);
    setTimeout(fetchNotifications, 500);
  };

  const handleAcquitterAll = async () => {
    stopAlarm();
    await rendezvousService.acquitterAllNotifications();
    setCurrentNotification(null);
    setShowAlert(false);
    setIsFlashing(false);
    setNotifications([]);
    setTimeout(fetchNotifications, 500);
  };

  if (!showAlert || !currentNotification) return null;

  const rdv = currentNotification.rendezvous;

  return (
    <>
      {isFlashing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(220, 53, 69, 0.15)',
          zIndex: 9998,
          pointerEvents: 'none',
          animation: 'urgentFlash 1s ease-in-out infinite'
        }} />
      )}

      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        animation: 'urgentSlideDown 0.5s ease-out',
      }}>
        <div style={{
          backgroundColor: '#dc3545',
          color: 'white',
          padding: '15px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          boxShadow: '0 4px 20px rgba(220, 53, 69, 0.5)',
          animation: 'urgentPulse 1.5s ease-in-out infinite',
          border: '3px solid #ff0000',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, minWidth: '300px' }}>
            <div style={{
              fontSize: '40px',
              animation: 'urgentShake 0.5s ease-in-out infinite',
            }}>
              &#x1F6A8;
            </div>
            <div>
              <div style={{
                fontSize: '22px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}>
                RENDEZ-VOUS URGENT
              </div>
              <div style={{ fontSize: '14px', marginTop: '5px', opacity: 0.9 }}>
                {rdv ? (
                  <>
                    <strong>Patient:</strong> {rdv.patient ? `${rdv.patient.first_name} ${rdv.patient.last_name}` : 'N/A'}
                    {' | '}
                    <strong>Medecin:</strong> {rdv.medecin ? `Dr. ${rdv.medecin.first_name} ${rdv.medecin.last_name}` : 'N/A'}
                    {' | '}
                    <strong>Date:</strong> {rdv.date ? new Date(rdv.date).toLocaleDateString('fr-FR') : 'N/A'}
                    {' | '}
                    <strong>Heure:</strong> {rdv.heure || 'N/A'}
                  </>
                ) : (
                  currentNotification.message
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {notifications.filter(n => !n.acquitte).length > 1 && (
              <button
                onClick={handleAcquitterAll}
                style={{
                  backgroundColor: 'white',
                  color: '#dc3545',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '5px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Tout acquitter ({notifications.filter(n => !n.acquitte).length})
              </button>
            )}
            <button
              onClick={() => handleAcquitter(currentNotification.id)}
              style={{
                backgroundColor: 'white',
                color: '#dc3545',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '5px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '15px',
                animation: 'urgentBtnPulse 1s ease-in-out infinite',
              }}
            >
              ACQUITTER
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes urgentFlash {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        @keyframes urgentSlideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        @keyframes urgentPulse {
          0%, 100% { 
            box-shadow: 0 4px 20px rgba(220, 53, 69, 0.5);
            border-color: #ff0000;
          }
          50% { 
            box-shadow: 0 4px 40px rgba(220, 53, 69, 0.9);
            border-color: #ff4444;
          }
        }
        @keyframes urgentShake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        @keyframes urgentBtnPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </>
  );
};

export default UrgentNotificationAlert;
