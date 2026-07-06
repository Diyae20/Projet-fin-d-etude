import React from 'react';

const Alert = ({ type, message, onClose }) => {
  if (!message) return null;
  
  // Si message est un objet, le convertir en chaîne
  const displayMessage = typeof message === 'object' ? JSON.stringify(message) : message;

  return (
    <div className={`alert alert-${type}`}>
      {displayMessage}
      {onClose && (
        <button 
          onClick={onClose} 
          style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;
