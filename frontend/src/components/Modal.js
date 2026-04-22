
import React from 'react';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, children, showCloseButton = true }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>
          {showCloseButton && <button className="modal-close" onClick={onClose}>&times;</button>}
        </div>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
