import React, { useState, useEffect } from 'react';
import { getTheme, updateTheme } from '../services/api';
import '../styles/ThemeSelector.css';

const ThemeSelector = () => {
  const [currentTheme, setCurrentTheme] = useState('theme-purple');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const themes = [
    { 
      id: 'theme-purple', 
      name: 'Purple', 
      icon: '💜',
      colors: ['#6366f1', '#a855f7', '#8b5cf6']
    },
    { 
      id: 'theme-blue', 
      name: 'Blue', 
      icon: '💙',
      colors: ['#3b82f6', '#60a5fa', '#2563eb']
    },
    { 
      id: 'theme-green', 
      name: 'Green', 
      icon: '💚',
      colors: ['#10b981', '#34d399', '#059669']
    },
    { 
      id: 'theme-red', 
      name: 'Red', 
      icon: '❤️',
      colors: ['#ef4444', '#f87171', '#dc2626']
    },
    { 
      id: 'theme-dark', 
      name: 'Dark', 
      icon: '🖤',
      colors: ['#1f2937', '#374151', '#111827']
    },
    {
      id: 'theme-black-orange',
      name: 'Black & Orange',
      icon: '🟧',
      colors: ['#0b0b0b', '#f97316', '#f59e0b']
    },
    { 
      id: 'theme-light', 
      name: 'Light', 
      icon: '🤍',
      colors: ['#f3f4f6', '#e5e7eb', '#d1d5db']
    }
  ];

  useEffect(() => {
    // Prefer locally stored theme first for immediate UX
    const stored = localStorage.getItem('siteTheme');
    if (stored) {
      setCurrentTheme(stored);
      document.body.className = stored;
    }
    // Default to black-orange theme if nothing stored
    if (!stored) {
      setCurrentTheme('theme-black-orange');
      document.body.className = 'theme-black-orange';
    }
    loadCurrentTheme();
  }, []);

  const loadCurrentTheme = async () => {
    try {
      const response = await getTheme();
      setCurrentTheme(response.theme);
    } catch (err) {
      console.error('Error loading theme:', err);
    }
  };

  const handleThemeChange = async (themeId) => {
    setSaving(true);
    setMessage('');

    try {
      await updateTheme(themeId);
      setCurrentTheme(themeId);
      
      // Apply theme to body immediately
      document.body.className = themeId;
      
      // Store in localStorage for persistence
      localStorage.setItem('siteTheme', themeId);
      
      setMessage('✅ Theme updated successfully! Changes applied site-wide.');
      
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error updating theme:', err);
      // If backend rejects unknown theme, still apply locally for immediate effect
      if (String(err.message).toLowerCase().includes('invalid theme')) {
        setCurrentTheme(themeId);
        document.body.className = themeId;
        localStorage.setItem('siteTheme', themeId);
        setMessage('⚠️ Applied locally. Backend validation pending.');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Error updating theme: ' + err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="theme-selector-container">
      <div className="theme-selector-header">
        <h3>🎨 Website Theme</h3>
        <p>Choose a color theme for the entire website</p>
      </div>

      {message && (
        <div className={`theme-message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="themes-grid">
        {themes.map((theme) => (
          <button
            key={theme.id}
            className={`theme-card ${currentTheme === theme.id ? 'active' : ''}`}
            onClick={() => handleThemeChange(theme.id)}
            disabled={saving}
          >
            <div className="theme-icon">{theme.icon}</div>
            <div className="theme-name">{theme.name}</div>
            <div className="theme-preview">
              {theme.colors.map((color, index) => (
                <div
                  key={index}
                  className="color-dot"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            {currentTheme === theme.id && (
              <div className="theme-check">✓ Active</div>
            )}
          </button>
        ))}
      </div>

      <div className="theme-selector-info">
        <p>💡 <strong>Note:</strong> Theme changes apply to all pages immediately and persist across sessions.</p>
      </div>
    </div>
  );
};

export default ThemeSelector;
