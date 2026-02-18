import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMic, FiMicOff, FiVolume2, FiVolumeX, FiX, FiSettings, 
  FiMessageCircle, FiClock, FiMapPin, FiDollarSign, FiCalendar, 
  FiHelpCircle, FiPhone, FiHome, FiMonitor, FiUsers, FiCoffee,
  FiAward, FiShield, FiStar, FiInfo
} from 'react-icons/fi';
import * as THREE from 'three';
import './VoiceAI3D.css';

const VoiceAI3D = ({ isOpen, onClose }) => {
  // Core states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [currentResponse, setCurrentResponse] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState({
    rate: 0.95,
    pitch: 1.0,
    volume: 1.0
  });
  const [statusText, setStatusText] = useState('Tap to speak');

  // Refs
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const sphereRef = useRef(null);
  const particlesRef = useRef(null);
  const frameIdRef = useRef(null);
  const sceneRef = useRef(null);

  // Comprehensive AI Knowledge Base
  const aiKnowledge = useMemo(() => ({
    greetings: {
      keywords: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'hola', 'namaste', 'yo', 'sup', 'whats up', 'howdy'],
      responses: [
        'Hello! Welcome to GameSpot Gaming Center! I\'m your AI assistant. How can I help you today?',
        'Hey there! Great to have you at GameSpot! Ask me about games, booking, prices, or anything else!',
        'Hi! Welcome to the ultimate gaming experience! What would you like to know?',
        'Hello gamer! Ready to level up? I can help you with bookings, game info, pricing and more!'
      ]
    },
    pricing: {
      keywords: ['price', 'cost', 'rate', 'charge', 'fee', 'how much', 'pricing', 'rupees', 'rs', 'money', 'pay', 'expensive', 'cheap', 'affordable'],
      responses: [
        'Our gaming rate is just 80 rupees per hour! This includes access to PS5 consoles and our racing simulator.',
        'Gaming is 80 rupees per hour. We also have packages: 5 hours for 350 rupees, and 10 hours for 650 rupees!',
        'It\'s 80 rupees per hour for all gaming stations. Group discounts available for 4 or more players!',
        'Great value at just 80 rupees per hour! Premium gaming on PS5 with the latest games included.'
      ]
    },
    booking: {
      keywords: ['book', 'reserve', 'reservation', 'booking', 'slot', 'schedule', 'appointment', 'available', 'availability'],
      responses: [
        'Booking is easy! Just click the Book Now button on our website. Select your date, time slot, and preferred device.',
        'You can book online 24/7! Choose from 1 to 5 hour sessions. We have PS5 consoles and a racing simulator available.',
        'To book: Go to our booking page, pick your date, select a time slot, choose PS5 or Simulator, and confirm!',
        'Want to reserve a spot? Use our website to book. You can see real-time availability for all our gaming stations.'
      ]
    },
    games: {
      keywords: ['game', 'games', 'play', 'playing', 'gta', 'fifa', 'cod', 'call of duty', 'spider', 'spiderman', 'god of war', 'nba', 'racing', 'fortnite', 'fc25', 'fc 25', 'elden ring', 'hogwarts'],
      responses: [
        'We have over 50 games! Popular titles include GTA V, FC 25, Call of Duty, Spider-Man 2, God of War Ragnarok, NBA 2K24, and Elden Ring!',
        'Our game library features GTA 5, FIFA/FC 25, COD Modern Warfare 3, Spider-Man 2, God of War, Gran Turismo 7, and many more!',
        'Looking for games? We\'ve got action, sports, racing, adventure! GTA V, FC 25, Spider-Man 2, Hogwarts Legacy, Fortnite, and 45+ more titles!',
        'Top games available: GTA V, FC 25, Call of Duty MW3, Spider-Man 2, God of War Ragnarok, Gran Turismo 7, Elden Ring, NBA 2K24!'
      ]
    },
    timing: {
      keywords: ['time', 'timing', 'hours', 'open', 'close', 'when', 'schedule', 'working hours', 'operational', 'timings'],
      responses: [
        'We\'re open daily from 9 AM to 12 AM (Midnight)! That\'s 15 hours of non-stop gaming every day!',
        'Our hours: 9 AM to 12 AM Midnight, all 7 days a week! Come anytime!',
        'Gaming hours are 9 AM to 12 AM (Midnight), every day including weekends. Come anytime!',
        'Open daily from 9 AM to Midnight! Last booking must end by 12 AM.'
      ]
    },
    location: {
      keywords: ['location', 'address', 'where', 'place', 'direction', 'directions', 'how to reach', 'find', 'located', 'area', 'perumbavoor', 'map'],
      responses: [
        'We\'re located in Perumbavoor, Ernakulam district. Just 5 minutes from the town center!',
        'Find us at GameSpot Gaming Center, Main Road, Perumbavoor, Kerala. Near the KSRTC bus stand!',
        'Our address is GameSpot, Main Road, Perumbavoor, Ernakulam, Kerala 683542. Easy to find!',
        'Located in the heart of Perumbavoor! 5-minute walk from KSRTC bus stand. Google Maps has our exact location.'
      ]
    },
    contact: {
      keywords: ['contact', 'phone', 'call', 'number', 'mobile', 'whatsapp', 'reach', 'talk', 'speak'],
      responses: [
        'Call us at 8075557375! We\'re also available on WhatsApp at the same number.',
        'Reach us at 8075557375. You can call or WhatsApp for quick bookings and queries!',
        'Contact number: 8075557375. Feel free to call for reservations or any questions!',
        'Phone: 8075557375. WhatsApp available too! We respond quickly to all messages.'
      ]
    },
    ps5: {
      keywords: ['ps5', 'playstation', 'playstation 5', 'console', 'sony', 'controller', 'dualsense'],
      responses: [
        'We have 4 PS5 consoles with the latest games! Each setup has a 4K TV and DualSense controllers.',
        'Our PS5 stations feature 55-inch 4K displays, comfortable gaming chairs, and premium DualSense controllers!',
        'PlayStation 5 gaming with 4K graphics, fast SSD loading, and haptic feedback controllers. Pure next-gen!',
        '4 PS5 consoles available! Each with dedicated 4K TV, gaming headset, and the newest game titles.'
      ]
    },
    simulator: {
      keywords: ['simulator', 'racing', 'driving', 'car', 'racing sim', 'wheel', 'pedals', 'steering'],
      responses: [
        'Our racing simulator features a professional steering wheel, pedals, and shifter! Play Gran Turismo 7 and other racers!',
        'Experience realistic racing with our sim setup! Force feedback wheel, racing seat, and triple monitor option!',
        'Racing simulator includes: Logitech G29 wheel, pedals, shifter, racing seat, and 4K display. Pure racing immersion!',
        'Love racing? Our simulator has Gran Turismo 7, F1 23, and Need for Speed. Professional setup with force feedback!'
      ]
    },
    multiplayer: {
      keywords: ['multiplayer', 'friends', 'group', 'together', 'party', 'team', 'split screen', 'coop', 'co-op', 'versus'],
      responses: [
        'Bring your squad! We support multiplayer gaming with multiple PS5s. Perfect for FIFA tournaments and COD battles!',
        'Group gaming is our specialty! Book multiple stations and enjoy split-screen or online multiplayer with friends!',
        'Play together! Many games support co-op and versus modes. FC 25, COD, NBA 2K - all great for groups!',
        'Multiplayer heaven! Book 2-4 consoles and battle your friends in FIFA, COD, or team up in co-op adventures!'
      ]
    },
    food: {
      keywords: ['food', 'snack', 'drink', 'eat', 'hungry', 'thirsty', 'refreshment', 'chips', 'soda', 'coffee', 'beverage'],
      responses: [
        'We have snacks and drinks available! Chips, soft drinks, energy drinks, and more to fuel your gaming!',
        'Hungry? We\'ve got chips, chocolates, soft drinks, and energy drinks at the counter!',
        'Gaming snacks available: chips, cookies, cola, Sprite, Red Bull, and water. Stay refreshed while you play!',
        'Refreshments on site! Grab some snacks and drinks to keep your energy up during long gaming sessions!'
      ]
    },
    payment: {
      keywords: ['payment', 'pay', 'cash', 'upi', 'card', 'gpay', 'google pay', 'paytm', 'online payment', 'credit', 'debit'],
      responses: [
        'We accept cash, UPI (GPay, PhonePe, Paytm), and all debit/credit cards. Pay however you prefer!',
        'Payment options: Cash, Google Pay, PhonePe, Paytm, and card payments. All methods accepted!',
        'Pay by cash, UPI, or card - your choice! Online pre-payment also available through our booking system.',
        'Flexible payments! Cash, UPI apps like GPay and PhonePe, plus Visa/Mastercard accepted.'
      ]
    },
    birthday: {
      keywords: ['birthday', 'party', 'celebration', 'event', 'special', 'occasion', 'celebrate'],
      responses: [
        'Birthday parties are our specialty! We offer special packages with exclusive console time, decorations, and snacks!',
        'Celebrate at GameSpot! Birthday packages include 3-4 hours gaming, decorations, cake space, and group discounts!',
        'Planning a gaming birthday? Book our party package: exclusive access, gaming tournaments, and party setup!',
        'Epic birthday parties! Private gaming area, tournament setup, refreshments, and memorable gaming experiences!'
      ]
    },
    membership: {
      keywords: ['membership', 'member', 'subscription', 'monthly', 'loyalty', 'vip', 'premium', 'plan'],
      responses: [
        'We have membership plans! Silver: 500/month for 10% off. Gold: 1000/month for 20% off plus priority booking!',
        'Become a member! Benefits include discounts, priority booking, free snacks, and exclusive tournament access!',
        'Membership tiers: Silver (500/month), Gold (1000/month), Platinum (2000/month) with increasing perks!',
        'Join our loyalty program! Members get discounts, birthday bonuses, and early access to new games!'
      ]
    },
    tournament: {
      keywords: ['tournament', 'competition', 'esports', 'compete', 'prize', 'winner', 'championship', 'event'],
      responses: [
        'We host monthly tournaments! FIFA, COD, and fighting game competitions with cash prizes and trophies!',
        'Tournament every month! Join our FIFA FC 25 cup, COD battles, or Tekken championships. Prizes await!',
        'Esports at GameSpot! Regular tournaments with prizes up to 5000 rupees. Follow us on Instagram for announcements!',
        'Compete and win! Monthly gaming tournaments in popular titles. Registration opens a week before each event.'
      ]
    },
    safety: {
      keywords: ['safety', 'clean', 'hygiene', 'sanitize', 'covid', 'safe', 'health'],
      responses: [
        'Safety first! We sanitize all controllers and equipment after each session. Clean and hygienic gaming environment!',
        'We maintain strict hygiene! Controllers cleaned after every use, AC environment, and regular deep cleaning.',
        'Your safety matters! Sanitized equipment, spaced seating, good ventilation, and clean facilities guaranteed!',
        'Clean gaming guaranteed! All equipment sanitized, comfortable seating, and well-maintained facilities.'
      ]
    },
    cancellation: {
      keywords: ['cancel', 'cancellation', 'refund', 'reschedule', 'change booking', 'modify'],
      responses: [
        'You can cancel up to 2 hours before your slot for a full refund. Rescheduling is free!',
        'Cancellation policy: Full refund if cancelled 2+ hours ahead. You can also reschedule at no extra cost.',
        'Need to cancel? Do it 2 hours before your slot for full refund. Rescheduling available anytime!',
        'Flexible booking! Cancel with 2 hours notice for refund, or reschedule to any available slot.'
      ]
    },
    recommendation: {
      keywords: ['recommend', 'suggestion', 'suggest', 'best', 'popular', 'favorite', 'trending', 'what should'],
      responses: [
        'Top picks right now: Spider-Man 2 for action, FC 25 for sports, GTA V for open world, God of War for adventure!',
        'I recommend Spider-Man 2 - amazing graphics! Or try our racing simulator for a unique experience!',
        'Popular choices: GTA V never gets old, FC 25 for football fans, COD for shooters, and Spider-Man 2 is a must-play!',
        'Best experience? Try our racing simulator for something different! For PS5, Spider-Man 2 and God of War are incredible!'
      ]
    },
    help: {
      keywords: ['help', 'assist', 'support', 'question', 'info', 'information', 'know', 'tell me', 'what can'],
      responses: [
        'I can help with: bookings, pricing, game info, timings, location, membership, and more! Just ask!',
        'Ask me anything! Booking slots, prices, available games, our location, contact info - I\'ve got all the answers!',
        'I\'m here to help! Questions about games, booking, prices, tournaments, or anything else - fire away!',
        'Your gaming guide! I know about our games, prices, booking process, location, events, and membership plans!'
      ]
    },
    thanks: {
      keywords: ['thank', 'thanks', 'thank you', 'bye', 'goodbye', 'see you', 'later', 'awesome', 'great', 'cool'],
      responses: [
        'You\'re welcome! See you at GameSpot! Game on!',
        'My pleasure! Can\'t wait to see you gaming with us! Have a great day!',
        'Thanks for chatting! Come experience the best gaming in Perumbavoor! Bye!',
        'Anytime! Hope to see you soon at GameSpot! Happy gaming!'
      ]
    },
    default: {
      keywords: [],
      responses: [
        'I\'m not sure about that. Try asking about: booking, prices, games, timing, or location!',
        'Could you rephrase? I can help with gaming sessions, prices, available games, and our facilities!',
        'I didn\'t catch that. Ask me about booking, pricing, games, location, or contact info!',
        'Let me help you better! Ask about: How to book, pricing, game library, timings, or directions.'
      ]
    }
  }), []);

  // Quick action buttons
  const quickActions = useMemo(() => [
    { icon: FiDollarSign, label: 'Pricing', query: 'What are your prices?' },
    { icon: FiClock, label: 'Timings', query: 'What are your opening hours?' },
    { icon: FiMapPin, label: 'Location', query: 'Where are you located?' },
    { icon: FiCalendar, label: 'Booking', query: 'How do I book?' },
    { icon: FiMonitor, label: 'Games', query: 'What games do you have?' },
    { icon: FiPhone, label: 'Contact', query: 'How can I contact you?' }
  ], []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current || !isOpen) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true
    });
    renderer.setSize(280, 280);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // Create main sphere
    const sphereGeometry = new THREE.IcosahedronGeometry(1, 4);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x6366f1,
      emissive: 0x4f46e5,
      emissiveIntensity: 0.3,
      shininess: 100,
      transparent: true,
      opacity: 0.9
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);
    sphereRef.current = sphere;

    // Create particles
    const particleCount = 150;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const radius = 1.5 + Math.random();
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.03,
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.8
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x6366f1, 2, 10);
    pointLight.position.set(3, 3, 3);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0xec4899, 1, 10);
    pointLight2.position.set(-3, -3, 3);
    scene.add(pointLight2);

    // Animation loop
    let time = 0;
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      time += 0.01;

      if (sphereRef.current) {
        // Dynamic scaling based on state
        let scale;
        if (isListening) {
          scale = 1.1 + Math.sin(time * 8) * 0.15;
        } else if (isSpeaking) {
          scale = 1.05 + Math.sin(time * 6) * 0.1;
        } else {
          scale = 1 + Math.sin(time * 2) * 0.03;
        }
        sphereRef.current.scale.setScalar(scale);
        sphereRef.current.rotation.y += 0.005;
        sphereRef.current.rotation.x = Math.sin(time) * 0.1;

        // Color changes based on state
        if (isListening) {
          sphereRef.current.material.color.setHex(0x10b981);
          sphereRef.current.material.emissive.setHex(0x059669);
        } else if (isSpeaking) {
          sphereRef.current.material.color.setHex(0x3b82f6);
          sphereRef.current.material.emissive.setHex(0x2563eb);
        } else {
          sphereRef.current.material.color.setHex(0x6366f1);
          sphereRef.current.material.emissive.setHex(0x4f46e5);
        }
      }

      if (particlesRef.current) {
        particlesRef.current.rotation.y -= 0.002;
        particlesRef.current.rotation.x = Math.sin(time * 0.5) * 0.1;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      renderer.dispose();
      sphereGeometry.dispose();
      sphereMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
    };
  }, [isOpen, isListening, isSpeaking]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-IN';

      recognitionRef.current.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        const text = result[0].transcript;
        setTranscript(text);
        
        if (result.isFinal) {
          processVoiceInput(text);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setStatusText('Tap to speak');
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setStatusText('Try again');
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Process voice input and find best response
  const processVoiceInput = useCallback((input) => {
    const normalizedInput = input.toLowerCase().trim();
    
    // Add to conversation history
    setConversationHistory(prev => [...prev, {
      type: 'user',
      text: input,
      timestamp: new Date()
    }]);

    // Find best matching category
    let bestMatch = null;
    let bestScore = 0;

    for (const [category, data] of Object.entries(aiKnowledge)) {
      if (category === 'default') continue;
      
      let score = 0;
      for (const keyword of data.keywords) {
        if (normalizedInput.includes(keyword.toLowerCase())) {
          score += keyword.length;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = category;
      }
    }

    // Get response
    const responseData = bestMatch ? aiKnowledge[bestMatch] : aiKnowledge.default;
    const response = responseData.responses[Math.floor(Math.random() * responseData.responses.length)];

    setCurrentResponse(response);
    setConversationHistory(prev => [...prev, {
      type: 'ai',
      text: response,
      timestamp: new Date()
    }]);

    speakResponse(response);
  }, [aiKnowledge]);

  // Text-to-speech
  const speakResponse = useCallback((text) => {
    if (isMuted || !text) return;

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceSettings.rate;
    utterance.pitch = voiceSettings.pitch;
    utterance.volume = voiceSettings.volume;

    // Select best voice
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Google UK English Female') ||
      v.name.includes('Google US English') ||
      v.name.includes('Samantha') ||
      v.lang === 'en-GB' ||
      v.lang === 'en-US'
    ) || voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
      utterance.lang = preferredVoice.lang;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setStatusText('Speaking...');
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setStatusText('Tap to speak');
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setStatusText('Tap to speak');
    };

    synthRef.current.speak(utterance);
  }, [isMuted, voiceSettings]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setTranscript('');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        setStatusText('Listening...');
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    }
  }, [isListening]);

  // Handle close
  const handleClose = useCallback(() => {
    synthRef.current.cancel();
    recognitionRef.current?.abort();
    setIsListening(false);
    setIsSpeaking(false);
    onClose();
  }, [onClose]);

  // Format time
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="voice-ai-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="voice-ai-container"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 25 }}
        >
          {/* Header */}
          <div className="voice-ai-header">
            <div className="header-left">
              <FiHome className="header-icon" />
              <div className="header-text">
                <h2>GameSpot AI</h2>
                <span className="header-subtitle">Voice Assistant</span>
              </div>
            </div>
            <div className="header-actions">
              <motion.button 
                className="header-btn"
                onClick={() => setShowSettings(!showSettings)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiSettings />
              </motion.button>
              <motion.button 
                className="header-btn"
                onClick={() => {
                  if (!isMuted) {
                    synthRef.current.cancel();
                    setIsSpeaking(false);
                  }
                  setIsMuted(!isMuted);
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {isMuted ? <FiVolumeX /> : <FiVolume2 />}
              </motion.button>
              <motion.button 
                className="header-btn close-btn"
                onClick={handleClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiX />
              </motion.button>
            </div>
          </div>

          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div 
                className="voice-settings-panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <div className="setting-item">
                  <label>Speed</label>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="1.5" 
                    step="0.1"
                    value={voiceSettings.rate}
                    onChange={(e) => setVoiceSettings(prev => ({
                      ...prev,
                      rate: parseFloat(e.target.value)
                    }))}
                  />
                  <span>{voiceSettings.rate.toFixed(1)}x</span>
                </div>
                <div className="setting-item">
                  <label>Pitch</label>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="1.5" 
                    step="0.1"
                    value={voiceSettings.pitch}
                    onChange={(e) => setVoiceSettings(prev => ({
                      ...prev,
                      pitch: parseFloat(e.target.value)
                    }))}
                  />
                  <span>{voiceSettings.pitch.toFixed(1)}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3D Visualization */}
          <div className="voice-visualization">
            <div className={`canvas-container ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}>
              <canvas ref={canvasRef} />
              <div className="status-ring" />
            </div>
            <motion.p 
              className="status-text"
              key={statusText}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {statusText}
            </motion.p>
          </div>

          {/* Transcript */}
          {transcript && (
            <motion.div 
              className="transcript-box"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <FiMessageCircle className="transcript-icon" />
              <p>{transcript}</p>
            </motion.div>
          )}

          {/* Response */}
          {currentResponse && (
            <motion.div 
              className="response-box"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p>{currentResponse}</p>
            </motion.div>
          )}

          {/* Main Mic Button */}
          <div className="mic-button-container">
            <motion.button
              className={`main-mic-btn ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}
              onClick={toggleListening}
              disabled={isSpeaking}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isListening ? <FiMicOff size={32} /> : <FiMic size={32} />}
              <span className="pulse-ring" />
              <span className="pulse-ring delay-1" />
              <span className="pulse-ring delay-2" />
            </motion.button>
            <p className="mic-hint">
              {isListening ? 'Tap to stop' : 'Tap and speak in English'}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-grid">
            {quickActions.map((action, index) => (
              <motion.button
                key={index}
                className="quick-action-btn"
                onClick={() => {
                  setTranscript(action.query);
                  processVoiceInput(action.query);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <action.icon className="quick-action-icon" />
                <span>{action.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Conversation History */}
          {conversationHistory.length > 0 && (
            <div className="conversation-history">
              <h4>Conversation</h4>
              <div className="history-list">
                {conversationHistory.slice(-6).map((item, index) => (
                  <motion.div
                    key={index}
                    className={`history-item ${item.type}`}
                    initial={{ opacity: 0, x: item.type === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <span className="history-time">{formatTime(item.timestamp)}</span>
                    <p>{item.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VoiceAI3D;
