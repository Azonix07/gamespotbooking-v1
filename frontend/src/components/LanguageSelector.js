import React from 'react';
import './LanguageSelector.css';

const LanguageSelector = ({ isOpen, onClose, onSelectEnglish, onSelectMalayalam }) => {
  if (!isOpen) return null;

  return (
    <div className="language-selector-overlay">
      <div className="language-selector-modal">
        {/* Close Button */}
        <button className="close-selector-btn" onClick={onClose}>
          ✕
        </button>

        {/* Header */}
        <div className="selector-header">
          <div className="header-icon">🌐</div>
          <h2>Select Your Language</h2>
          <p>Choose your preferred language for Voice AI</p>
        </div>

        {/* Language Options */}
        <div className="language-options">
          {/* English Option */}
          <button 
            className="language-card english"
            onClick={onSelectEnglish}
          >
            <div className="card-icon">🇬🇧</div>
            <div className="card-content">
              <h3>English</h3>
              <p>Chat in English with AI</p>
              <div className="card-features">
                <span>✓ Natural Voice</span>
                <span>✓ Fast Recognition</span>
              </div>
            </div>
            <div className="card-arrow">→</div>
          </button>

          {/* Malayalam Option */}
          <button 
            className="language-card malayalam"
            onClick={onSelectMalayalam}
          >
            <div className="card-icon">🇮🇳</div>
            <div className="card-content">
              <h3>മലയാളം (Malayalam)</h3>
              <p>മലയാളത്തിൽ AI-യുമായി സംസാരിക്കുക</p>
              <div className="card-features">
                <span>✓ സ്വാഭാവിക ശബ്ദം</span>
                <span>✓ ഫാസ്റ്റ് തിരിച്ചറിയൽ</span>
              </div>
            </div>
            <div className="card-arrow">→</div>
          </button>
        </div>

        {/* Footer */}
        <div className="selector-footer">
          <p>💡 You can change language anytime by reopening Voice AI</p>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;
