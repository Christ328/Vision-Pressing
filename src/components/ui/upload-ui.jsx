// src/components/ui/upload-ui.jsx
import * as React from 'react';
import { X, ArrowDownCircle, CheckCircle, XCircle } from 'lucide-react';

export const UploadCard = ({
  status,
  progress,
  title,
  description,
  primaryButtonText,
  onPrimaryButtonClick,
  secondaryButtonText,
  onSecondaryButtonClick,
  onClose
}) => {
  const renderIcon = () => {
    switch (status) {
      case 'uploading':
        return <ArrowDownCircle size={40} color="var(--gold)" />;
      case 'success':
        return <CheckCircle size={40} color="var(--emerald, #10b981)" />;
      case 'error':
        return <XCircle size={40} color="#ef4444" />;
      default:
        return null;
    }
  };

  return (
    <div className="upload-card">
      <div className="upload-header">
        <button onClick={onClose} aria-label="Fermer"><X size={18} /></button>
      </div>
      <div className="upload-body">
        <div className="upload-icon-wrap">{renderIcon()}</div>
        <div className="upload-content">
          <h3>{title}</h3>
          <p>{description}</p>
          
          {status === 'uploading' && (
            <div className="upload-progress">
              <div className="progress-info">
                <span>{progress}%</span>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
              <button className="upload-btn-first" onClick={onPrimaryButtonClick}>
                {primaryButtonText}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {(status === 'success' || status === 'error') && (
        <div className="upload-actions">
          <button className="upload-btn-first" onClick={onPrimaryButtonClick}>
            {primaryButtonText}
          </button>
          {secondaryButtonText && (
            <button className="upload-btn-second" onClick={onSecondaryButtonClick}>
              {secondaryButtonText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
