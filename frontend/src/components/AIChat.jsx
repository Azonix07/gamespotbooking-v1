import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, FiSend, FiMic, FiVolume2, FiVolumeX, 
  FiCalendar, FiClock, FiMonitor, FiUsers,
  FiHelpCircle, FiGlobe, FiCpu, FiActivity,
  FiChevronRight, FiStar, FiInfo
} from 'react-icons/fi';
import { sendAIMessage, clearAISession } from '../services/ai-api';
import { malayalamUI, englishUI } from '../translations/malayalam';
import '../styles/AIChat.css';

// AI personality configuration
const AI_CONFIG = {
  name: "GameBot",
  avatar: "🤖",
  capabilities: ["booking", "availability", "pricing", "recommendations"]
};

const AIChat = ({ onClose }) => {
  // Core state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [context, setContext] = useState({});
  
  // UI state
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  // Voice state
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  
  // Language state
  const [language, setLanguage] = useState('en');
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const initializedRef = useRef(false);
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input after loading
  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading]);

  // Initialize on mount
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      initializeChat();
      initializeVoice();
    }
    
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (synthesisRef.current) synthesisRef.current.cancel();
    };
  }, []);

  // Update voice language
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === 'ml' ? 'ml-IN' : 'en-US';
    }
  }, [language]);

  // Initialize voice recognition
  const initializeVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language === 'ml' ? 'ml-IN' : 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const isFinal = event.results[0].isFinal;
        
        if (isFinal) {
          handleVoiceInput(transcript);
        } else {
          setInput(transcript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setListening(false);
      };

      recognitionRef.current.onend = () => setListening(false);
    }

    synthesisRef.current = window.speechSynthesis;
  };

  // Initialize chat with smart greeting
  const initializeChat = async () => {
    setLoading(true);
    try {
      const response = await sendAIMessage('hi', null, { preferred_language: language });
      setSessionId(response.session_id);
      setContext(response.context || {});
      
      setMessages([{
        type: 'ai',
        text: response.reply,
        action: response.action,
        data: response.data,
        buttons: response.buttons || response.smart_suggestions || [],
        timestamp: new Date()
      }]);
    } catch (error) {
      setMessages([{
        type: 'error',
        text: '❌ Unable to connect. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Handle voice input
  const handleVoiceInput = async (transcript) => {
    setInput('');
    await handleSendMessage(transcript);
  };

  // Start/stop listening
  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    } else {
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
      try {
        recognitionRef.current?.start();
        setListening(true);
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  };

  // Text-to-speech
  const speakText = (text) => {
    if (!voiceEnabled || !synthesisRef.current || !text) return;

    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/[•#]/g, '')
      .replace(/[🎮🏎️📅⏰💰✅❌💡👥⏱️📋🌅🌞🌆📍🔄😔✨👋🙏💫🌟😊🚀💪🎯👍🤖]/g, '')
      .replace(/\n+/g, ', ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 0.9;
    utterance.volume = 1.0;
    utterance.lang = language === 'ml' ? 'ml-IN' : 'en-US';

    const voices = synthesisRef.current.getVoices();
    const preferredVoice = voices.find(v => 
      v.lang.startsWith(language === 'ml' ? 'ml' : 'en-US') &&
      (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Alex'))
    ) || voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) utterance.voice = preferredVoice;

    synthesisRef.current.speak(utterance);
  };

  // Send message
  const handleSendMessage = async (msg = input, isQuickAction = false) => {
    if (!msg.trim()) return;

    const userMessage = {
      type: 'user',
      text: msg,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setShowSuggestions(false);
    setLoading(true);

    try {
      const contextWithLanguage = {
        ...context,
        preferred_language: language
      };

      const response = await sendAIMessage(msg, sessionId, contextWithLanguage);
      
      setSessionId(response.session_id);
      setContext(response.context || {});

      const aiMessage = {
        type: 'ai',
        text: response.reply,
        action: response.action,
        data: response.data,
        buttons: response.buttons || response.smart_suggestions || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Speak response if voice enabled
      if (voiceEnabled && response.reply) {
        speakText(response.reply);
      }

      // Handle booking success
      if (response.action === 'booking_success') {
        setTimeout(() => onClose(), 4000);
      }

      // Show suggestions after response
      setTimeout(() => setShowSuggestions(true), 500);

    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'error',
        text: language === 'en'
          ? '❌ Connection error. Please try again.'
          : '❌ കണക്ഷൻ പിശക്. വീണ്ടും ശ്രമിക്കുക.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle close
  const handleClose = async () => {
    if (sessionId) {
      try {
        await clearAISession(sessionId);
      } catch (error) {
        console.error('Failed to clear session:', error);
      }
    }
    onClose();
  };

  // Format timestamp
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Render message content with formatting
  const renderMessageContent = (text) => {
    if (!text) return null;
    
    return text.split('\n').map((line, i) => {
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return (
        <span key={i} dangerouslySetInnerHTML={{ __html: formattedLine }} />
      );
    }).reduce((acc, elem, i) => {
      if (i === 0) return [elem];
      return [...acc, <br key={`br-${i}`} />, elem];
    }, []);
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="ai-chat-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div 
          className="ai-chat-container"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Background Effects */}
          <div className="chat-bg-effects">
            <div className="bg-gradient"></div>
            <div className="bg-pattern"></div>
          </div>

          {/* Header */}
          <header className="ai-chat-header">
            <div className="header-left">
              <div className="ai-avatar">
                <div className="avatar-glow"></div>
                <div className="avatar-inner">
                  <FiCpu className="avatar-icon" />
                </div>
                <span className="status-indicator"></span>
              </div>
              <div className="header-info">
                <h3 className="header-title">
                  {AI_CONFIG.name}
                  <span className="ai-badge">
                    <FiStar className="badge-icon" />
                    AI
                  </span>
                </h3>
                <p className="header-status">
                  {loading ? (
                    <span className="status-typing">
                      <FiActivity className="typing-icon" />
                      Thinking...
                    </span>
                  ) : listening ? (
                    <span className="status-listening">
                      <span className="pulse-ring"></span>
                      Listening...
                    </span>
                  ) : (
                    <span className="status-online">
                      <span className="online-dot"></span>
                      Online • Ready to help
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="header-actions">
              <button 
                className="header-btn language-btn"
                onClick={() => setLanguage(l => l === 'en' ? 'ml' : 'en')}
                title={language === 'en' ? 'Switch to Malayalam' : 'Switch to English'}
              >
                <FiGlobe className="btn-icon" />
                <span className="btn-label">{language === 'en' ? 'EN' : 'മല'}</span>
              </button>
              
              {voiceSupported && (
                <button 
                  className={`header-btn voice-toggle-btn ${voiceEnabled ? 'active' : ''}`}
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
                >
                  {voiceEnabled ? <FiVolume2 /> : <FiVolumeX />}
                </button>
              )}
              
              <button 
                className="header-btn close-btn"
                onClick={handleClose}
                aria-label="Close chat"
              >
                <FiX />
              </button>
            </div>
          </header>

          {/* Messages Area */}
          <main className="ai-chat-messages" ref={chatContainerRef}>
            {/* Welcome Card */}
            {messages.length <= 1 && (
              <motion.div 
                className="welcome-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="welcome-header">
                  <span className="welcome-emoji">🎮</span>
                  <div>
                    <h4>Welcome to GameSpot AI</h4>
                    <p>Your intelligent booking assistant</p>
                  </div>
                </div>
                <div className="welcome-features">
                  <div className="feature-item">
                    <FiCalendar className="feature-icon" />
                    <span>Book gaming sessions</span>
                  </div>
                  <div className="feature-item">
                    <FiClock className="feature-icon" />
                    <span>Check availability</span>
                  </div>
                  <div className="feature-item">
                    <FiInfo className="feature-icon" />
                    <span>Get pricing info</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Messages */}
            <div className="messages-list">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  className={`message-wrapper ${msg.type}`}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                >
                  {msg.type === 'ai' && (
                    <div className="message-avatar ai-msg-avatar">
                      <FiCpu />
                    </div>
                  )}
                  
                  <div className={`message-bubble ${msg.type}`}>
                    <div className="message-content">
                      {renderMessageContent(msg.text)}
                    </div>
                    
                    {/* AI Quick Buttons */}
                    {msg.type === 'ai' && msg.buttons && msg.buttons.length > 0 && idx === messages.length - 1 && (
                      <motion.div 
                        className="message-quick-actions"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        {msg.buttons.slice(0, 4).map((button, btnIdx) => (
                          <button
                            key={btnIdx}
                            className="quick-action-btn"
                            onClick={() => handleSendMessage(button, true)}
                            disabled={loading}
                          >
                            <FiChevronRight className="btn-arrow" />
                            {button}
                          </button>
                        ))}
                      </motion.div>
                    )}
                    
                    <span className="message-timestamp">{formatTime(msg.timestamp)}</span>
                  </div>
                  
                  {msg.type === 'user' && (
                    <div className="message-avatar user-msg-avatar">
                      <FiUsers />
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {loading && (
                <motion.div
                  className="message-wrapper ai"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="message-avatar ai-msg-avatar">
                    <FiCpu />
                  </div>
                  <div className="message-bubble ai typing-bubble">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            
            <div ref={messagesEndRef} />
          </main>

          {/* Smart Suggestions */}
          {/* Input Area */}
          <footer className="ai-chat-input-area">
            <div className="input-wrapper">
              {/* Voice Button */}
              {voiceSupported && (
                <button
                  className={`input-action-btn voice-input-btn ${listening ? 'listening' : ''}`}
                  onClick={toggleListening}
                  disabled={loading}
                  title={listening ? 'Stop listening' : 'Start voice input'}
                >
                  {listening ? (
                    <div className="voice-waves">
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  ) : (
                    <FiMic />
                  )}
                </button>
              )}
              
              {/* Text Input */}
              <div className="input-field-wrapper">
                <input
                  ref={inputRef}
                  type="text"
                  className="chat-input-field"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    listening 
                      ? "🎤 Listening..." 
                      : loading 
                        ? "Please wait..." 
                        : language === 'en' 
                          ? "Type your message..." 
                          : "നിങ്ങളുടെ സന്ദേശം ടൈപ്പ് ചെയ്യുക..."
                  }
                  disabled={loading || listening}
                />
              </div>
              
              {/* Send Button */}
              <button
                className={`input-action-btn send-input-btn ${input.trim() ? 'active' : ''}`}
                onClick={() => handleSendMessage()}
                disabled={loading || !input.trim()}
              >
                <FiSend />
              </button>
            </div>
            
            {/* Footer Hint */}
            <div className="input-footer-hint">
              <span className="hint-text">
                {language === 'en' 
                  ? '💡 Try: "Book PS5 for tomorrow evening" or "Show available slots"'
                  : '💡 ശ്രമിക്കുക: "നാളെ വൈകുന്നേരം PS5 ബുക്ക് ചെയ്യുക"'}
              </span>
            </div>
          </footer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIChat;
