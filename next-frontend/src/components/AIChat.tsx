'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '@/styles/AIChat.css';
import { FiX, FiSend, FiMic, FiVolume2, FiVolumeX,
  FiCalendar, FiClock, FiInfo,
  FiGlobe, FiCpu, FiActivity,
  FiChevronRight, FiStar, FiUsers, FiExternalLink
} from 'react-icons/fi';
import { sendAIMessage, clearAISession } from '@/services/ai-api';
import { malayalamUI, englishUI } from '@/translations/malayalam';
import { useRouter } from 'next/navigation';

const AI_CONFIG = { name: "GameBot", avatar: "🤖", capabilities: ["booking", "availability", "pricing", "recommendations"] };

// Map button labels to page paths for navigation
const PAGE_NAV_MAP: Record<string, string> = {
  'contact page': '/contact',
  'games page': '/games',
  'membership page': '/membership',
  'rental page': '/rental',
  'college setup page': '/college-setup',
  'offers page': '/get-offers',
  'feedback page': '/feedback',
  'invite page': '/invite',
  'profile page': '/profile',
  'updates page': '/updates',
  'faq page': '/faq',
  'booking page': '/booking',
  'book now': '/booking',
  'full game list': '/games',
};

interface ChatMessage {
  type: 'user' | 'ai' | 'error';
  text: string;
  action?: string;
  data?: any;
  buttons?: string[];
  timestamp: Date;
}

const AIChat = ({ onClose }: { onClose: () => void }) => {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [context, setContext] = useState<any>({});
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [language, setLanguage] = useState('en');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (!loading && inputRef.current) inputRef.current.focus(); }, [loading]);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      initializeChat();
      initializeVoice();
    }

    // Lock body scroll while chat is open (prevents iOS Safari scroll-behind)
    const scrollY = window.scrollY;
    const body = document.body;
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.overflow = 'hidden';

    return () => {
      // Restore body scroll position
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.overflow = '';
      window.scrollTo(0, scrollY);

      if (recognitionRef.current) recognitionRef.current.stop();
      if (synthesisRef.current) synthesisRef.current.cancel();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (recognitionRef.current) recognitionRef.current.lang = language === 'ml' ? 'ml-IN' : 'en-US';
  }, [language]);

  const initializeVoice = () => {
    if (typeof window === 'undefined') return;
    try {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        setVoiceSupported(true);
        recognitionRef.current = new SR();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = language === 'ml' ? 'ml-IN' : 'en-US';
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (event.results[0].isFinal) handleVoiceInput(transcript);
          else setInput(transcript);
        };
        recognitionRef.current.onerror = () => setListening(false);
        recognitionRef.current.onend = () => setListening(false);
      }
      synthesisRef.current = window.speechSynthesis || null;
    } catch {
      // Voice APIs not available
    }
  };

  const initializeChat = async () => {
    setLoading(true);
    try {
      const response = await sendAIMessage('hi', null, { preferred_language: language });
      setSessionId(response.session_id);
      setContext(response.context || {});
      setMessages([{ type: 'ai', text: response.reply, action: response.action, data: response.data, buttons: response.buttons || response.smart_suggestions || [], timestamp: new Date() }]);
    } catch {
      setMessages([{ type: 'error', text: '❌ Unable to connect. Please try again.', timestamp: new Date() }]);
    } finally { setLoading(false); }
  };

  const handleVoiceInput = async (transcript: string) => { setInput(''); await handleSendMessage(transcript); };

  const toggleListening = () => {
    if (listening) { recognitionRef.current?.stop(); setListening(false); }
    else {
      if (synthesisRef.current) synthesisRef.current.cancel();
      try { recognitionRef.current?.start(); setListening(true); } catch {}
    }
  };

  const speakText = (text: string) => {
    if (!voiceEnabled || !synthesisRef.current || !text) return;
    const cleanText = text.replace(/\*\*/g, '').replace(/[•#]/g, '').replace(/[🎮🏎️📅⏰💰✅❌💡👥⏱️📋🌅🌞🌆📍🔄😔✨👋🙏💫🌟😊🚀💪🎯👍🤖]/g, '').replace(/\n+/g, ', ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95; utterance.pitch = 0.9; utterance.volume = 1.0;
    utterance.lang = language === 'ml' ? 'ml-IN' : 'en-US';
    const voices = synthesisRef.current.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith(language === 'ml' ? 'ml' : 'en-US') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Alex'))) || voices.find(v => v.lang.startsWith('en'));
    if (preferredVoice) utterance.voice = preferredVoice;
    synthesisRef.current.speak(utterance);
  };

  const handleSendMessage = async (msg: string = input, isQuickAction = false) => {
    if (!msg.trim()) return;
    setMessages(prev => [...prev, { type: 'user', text: msg, timestamp: new Date() }]);
    setInput(''); setShowSuggestions(false); setLoading(true);
    try {
      const response = await sendAIMessage(msg, sessionId, { ...context, preferred_language: language });
      setSessionId(response.session_id); setContext(response.context || {});
      const aiMessage: ChatMessage = { type: 'ai', text: response.reply, action: response.action, data: response.data, buttons: response.buttons || response.smart_suggestions || [], timestamp: new Date() };
      setMessages(prev => [...prev, aiMessage]);
      if (voiceEnabled && response.reply) speakText(response.reply);
      if (response.action === 'booking_success') setTimeout(() => onClose(), 4000);
      setTimeout(() => setShowSuggestions(true), 500);
    } catch {
      setMessages(prev => [...prev, { type: 'error', text: language === 'en' ? '❌ Connection error. Please try again.' : '❌ കണക്ഷൻ പിശക്. വീണ്ടും ശ്രമിക്കുക.', timestamp: new Date() }]);
    } finally { setLoading(false); }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } };

  // Check if a button label maps to a page navigation
  const getNavPath = (buttonLabel: string): string | null => {
    const cleaned = buttonLabel.replace(/[🎮🏎️💰📅❓⏱️📞📦🎓⭐🎁💬👥👤📰📋🎲🎰🅿️]/g, '').trim().toLowerCase();
    for (const [key, path] of Object.entries(PAGE_NAV_MAP)) {
      if (cleaned.includes(key) || cleaned === key) return path;
    }
    return null;
  };

  const handleButtonClick = (buttonLabel: string) => {
    const navPath = getNavPath(buttonLabel);
    if (navPath) {
      onClose();
      router.push(navPath);
    } else {
      handleSendMessage(buttonLabel, true);
    }
  };

  const handleClose = async () => {
    if (sessionId) { try { await clearAISession(sessionId); } catch {} }
    onClose();
  };

  const formatTime = (date: Date) => new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const renderMessageContent = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return <span key={i} dangerouslySetInnerHTML={{ __html: formattedLine }} />;
    }).reduce<React.ReactNode[]>((acc, elem, i) => {
      if (i === 0) return [elem];
      return [...acc, <br key={`br-${i}`} />, elem];
    }, []);
  };

  return (
    <AnimatePresence>
      <motion.div className="ai-chat-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose}>
        <motion.div className="ai-chat-container" initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()}>
          <div className="chat-bg-effects"><div className="bg-gradient"></div><div className="bg-pattern"></div></div>

          {/* Header */}
          <header className="ai-chat-header">
            <div className="header-left">
              <div className="ai-avatar"><div className="avatar-glow"></div><div className="avatar-inner"><FiCpu className="avatar-icon" /></div><span className="status-indicator"></span></div>
              <div className="header-info">
                <h3 className="header-title">{AI_CONFIG.name}<span className="ai-badge"><FiStar className="badge-icon" />AI</span></h3>
                <p className="header-status">
                  {loading ? <span className="status-typing"><FiActivity className="typing-icon" />Thinking...</span>
                    : listening ? <span className="status-listening"><span className="pulse-ring"></span>Listening...</span>
                    : <span className="status-online"><span className="online-dot"></span>Online • Ready to help</span>}
                </p>
              </div>
            </div>
            <div className="header-actions">
              <button className="header-btn language-btn" onClick={() => setLanguage(l => l === 'en' ? 'ml' : 'en')} title={language === 'en' ? 'Switch to Malayalam' : 'Switch to English'}>
                <FiGlobe className="btn-icon" /><span className="btn-label">{language === 'en' ? 'EN' : 'മല'}</span>
              </button>
              {voiceSupported && (
                <button className={`header-btn voice-toggle-btn ${voiceEnabled ? 'active' : ''}`} onClick={() => setVoiceEnabled(!voiceEnabled)} title={voiceEnabled ? 'Disable voice' : 'Enable voice'}>
                  {voiceEnabled ? <FiVolume2 /> : <FiVolumeX />}
                </button>
              )}
              <button className="header-btn close-btn" onClick={handleClose} aria-label="Close chat"><FiX /></button>
            </div>
          </header>

          {/* Messages */}
          <main className="ai-chat-messages" ref={chatContainerRef}>
            {messages.length <= 1 && (
              <motion.div className="welcome-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div className="welcome-header"><span className="welcome-emoji">🎮</span><div><h4>Welcome to GameSpot AI</h4><p>Your intelligent booking assistant</p></div></div>
                <div className="welcome-features">
                  <div className="feature-item"><FiCalendar className="feature-icon" /><span>Book gaming sessions</span></div>
                  <div className="feature-item"><FiClock className="feature-icon" /><span>Check availability</span></div>
                  <div className="feature-item"><FiInfo className="feature-icon" /><span>Get pricing info</span></div>
                </div>
              </motion.div>
            )}

            <div className="messages-list">
              {messages.map((msg, idx) => (
                <motion.div key={idx} className={`message-wrapper ${msg.type}`} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.3, delay: 0.05 }}>
                  {msg.type === 'ai' && <div className="message-avatar ai-msg-avatar"><FiCpu /></div>}
                  <div className={`message-bubble ${msg.type}`}>
                    <div className="message-content">{renderMessageContent(msg.text)}</div>
                    {msg.type === 'ai' && msg.buttons && msg.buttons.length > 0 && idx === messages.length - 1 && (
                      <motion.div className="message-quick-actions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        {msg.buttons.slice(0, 6).map((button, btnIdx) => {
                          const isNavBtn = !!getNavPath(button);
                          return (
                            <button key={btnIdx} className={`quick-action-btn${isNavBtn ? ' nav-btn' : ''}`} onClick={() => handleButtonClick(button)} disabled={loading}>
                              {isNavBtn ? <FiExternalLink className="btn-arrow" /> : <FiChevronRight className="btn-arrow" />}{button}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                    <span className="message-timestamp">{formatTime(msg.timestamp)}</span>
                  </div>
                  {msg.type === 'user' && <div className="message-avatar user-msg-avatar"><FiUsers /></div>}
                </motion.div>
              ))}

              {loading && (
                <motion.div className="message-wrapper ai" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="message-avatar ai-msg-avatar"><FiCpu /></div>
                  <div className="message-bubble ai typing-bubble">
                    <div className="typing-indicator"><span></span><span></span><span></span></div>
                  </div>
                </motion.div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </main>

          {/* Input */}
          <footer className="ai-chat-input-area">
            <div className="input-wrapper">
              {voiceSupported && (
                <button className={`input-action-btn voice-input-btn ${listening ? 'listening' : ''}`} onClick={toggleListening} disabled={loading} title={listening ? 'Stop listening' : 'Start voice input'}>
                  {listening ? <div className="voice-waves"><span></span><span></span><span></span><span></span></div> : <FiMic />}
                </button>
              )}
              <div className="input-field-wrapper">
                <input ref={inputRef} type="text" className="chat-input-field" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress}
                  placeholder={listening ? "🎤 Listening..." : loading ? "Please wait..." : language === 'en' ? "Type your message..." : "നിങ്ങളുടെ സന്ദേശം ടൈപ്പ് ചെയ്യുക..."}
                  disabled={loading || listening} />
              </div>
              <button className={`input-action-btn send-input-btn ${input.trim() ? 'active' : ''}`} onClick={() => handleSendMessage()} disabled={loading || !input.trim()}><FiSend /></button>
            </div>
            <div className="input-footer-hint">
              <span className="hint-text">{language === 'en' ? '💡 Try: "Book PS5 for tomorrow evening" or "Show available slots"' : '💡 ശ്രമിക്കുക: "നാളെ വൈകുന്നേരം PS5 ബുക്ക് ചെയ്യുക"'}</span>
            </div>
          </footer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIChat;
