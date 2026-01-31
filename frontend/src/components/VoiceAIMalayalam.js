import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMic, FiMicOff, FiVolume2, FiVolumeX, FiX, FiSettings, FiMessageCircle, FiClock, FiMapPin, FiDollarSign, FiCalendar, FiHelpCircle, FiPhone, FiHome } from 'react-icons/fi';
import * as THREE from 'three';
import './VoiceAIMalayalam.css';

const VoiceAIMalayalam = ({ isOpen, onClose }) => {
  // State management
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [currentResponse, setCurrentResponse] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState({
    rate: 0.9,
    pitch: 1.0,
    volume: 1.0
  });
  const [visualizerData, setVisualizerData] = useState(new Array(32).fill(0));
  const [statusText, setStatusText] = useState('ടാപ്പ് ചെയ്ത് സംസാരിക്കുക');

  // Refs
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const sphereRef = useRef(null);
  const particlesRef = useRef(null);
  const frameIdRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  // Comprehensive Malayalam AI Knowledge Base
  // Each response has 'ml' (Malayalam text for display) and 'speech' (English/phonetic for TTS)
  const aiKnowledge = useMemo(() => ({
    // Greetings
    greetings: {
      keywords: ['ഹായ്', 'ഹലോ', 'നമസ്കാരം', 'സുപ്രഭാതം', 'ശുഭദിനം', 'എന്താ', 'hi', 'hello', 'hai', 'namaskaram'],
      responses: [
        {
          ml: 'നമസ്കാരം! ഗെയിംസ്പോട്ട് ഗെയിമിംഗ് സെന്ററിലേക്ക് സ്വാഗതം! ഞാൻ നിങ്ങളുടെ എ ഐ അസിസ്റ്റന്റാണ്. എന്താണ് നിങ്ങൾക്ക് അറിയേണ്ടത്?',
          speech: 'Namaskaram! GameSpot Gaming Center-ilekku swaagatham! Njan ningalude AI assistant aanu. Enthaanu ningalkku ariyendath?'
        },
        {
          ml: 'ഹലോ! ഗെയിംസ്പോട്ടിലേക്ക് സ്വാഗതം! ബുക്കിംഗ്, വില, ഗെയിമുകൾ, സമയം എന്നിവയെക്കുറിച്ച് ചോദിക്കാം.',
          speech: 'Hello! GameSpot-ilekku swaagatham! Booking, vila, games, samayam ennivaye kurichu chodikkaam.'
        },
        {
          ml: 'നമസ്കാരം സുഹൃത്തേ! ഗെയിമിംഗ് ലോകത്തേക്ക് സ്വാഗതം! എങ്ങനെ സഹായിക്കാം?',
          speech: 'Namaskaram suhruthe! Gaming lokathekku swaagatham! Engane sahaayikkaam?'
        }
      ]
    },

    // Pricing
    pricing: {
      keywords: ['വില', 'rate', 'charge', 'ചാർജ്', 'എത്ര', 'പൈസ', 'രൂപ', 'cost', 'price', 'fee', 'കാശ്', 'പണം', 'മണിക്കൂർ വില'],
      responses: [
        'ഗെയിംസ്പോട്ടിൽ ഒരു മണിക്കൂർ ഗെയിമിംഗിന് എൺപത് രൂപ മാത്രം! PS5, Racing Simulator എല്ലാം ഒരേ വിലയ്ക്ക്. കൂടുതൽ മണിക്കൂർ കളിച്ചാൽ സ്പെഷ്യൽ ഓഫറുകൾ ലഭിക്കും.',
        'മണിക്കൂറിന് വെറും എൺപത് രൂപ! അഞ്ച് മണിക്കൂർ പാക്കേജിന് മുന്നൂറ്റമ്പത് രൂപ മാത്രം. വീക്കെൻഡ് സ്പെഷ്യൽ ഓഫറുകളും ഉണ്ട്.',
        'ഞങ്ങളുടെ വില വളരെ കുറവാണ്. ഒരു മണിക്കൂർ എൺപത് രൂപ. ഗ്രൂപ്പ് ബുക്കിംഗിന് പ്രത്യേക ഡിസ്കൗണ്ട് ലഭിക്കും.'
      ]
    },

    // Booking
    booking: {
      keywords: ['ബുക്ക്', 'book', 'reserve', 'appointment', 'slot', 'reservation', 'booking', 'ബുക്കിംഗ്', 'റിസർവ്', 'അപ്പോയിന്റ്മെന്റ്'],
      responses: [
        'ബുക്കിംഗ് വളരെ എളുപ്പമാണ്! വെബ്സൈറ്റിൽ Book Now ബട്ടൺ ക്ലിക്ക് ചെയ്യുക. തീയതി, സമയം, ഉപകരണം തിരഞ്ഞെടുക്കുക. ഓൺലൈനായി പേയ്മെന്റ് ചെയ്യാം.',
        'ഓൺലൈൻ ബുക്കിംഗ് ഇപ്പോൾ ലഭ്യമാണ്. ഒരു മണിക്കൂർ മുതൽ അഞ്ച് മണിക്കൂർ വരെ ബുക്ക് ചെയ്യാം. അഡ്വാൻസ് ബുക്കിംഗിന് പ്രത്യേക ഓഫർ!',
        'ബുക്കിംഗ് പേജിൽ നിങ്ങൾക്ക് ഇഷ്ടമുള്ള PS5 അല്ലെങ്കിൽ Simulator തിരഞ്ഞെടുക്കാം. തത്സമയം ലഭ്യത കാണാം.'
      ]
    },

    // Games
    games: {
      keywords: ['ഗെയിം', 'game', 'games', 'കളി', 'play', 'GTA', 'FIFA', 'COD', 'Spider', 'God of War', 'കളിക്കുക', 'ഏത് ഗെയിം', 'ഗെയിമുകൾ'],
      responses: [
        'ഞങ്ങളുടെ ഗെയിം ലൈബ്രറിയിൽ അമ്പതിലധികം ഗെയിമുകൾ! GTA 5, FC 25, Call of Duty, Spider-Man 2, God of War Ragnarok, Hogwarts Legacy, Elden Ring, Fortnite എന്നിവ ഉൾപ്പെടെ.',
        'ജനപ്രിയ ഗെയിമുകൾ: GTA V, FIFA, Call of Duty Modern Warfare, Spider-Man 2, God of War, Mortal Kombat, NBA 2K, Need for Speed. പുതിയ ഗെയിമുകൾ എല്ലാ മാസവും ചേർക്കുന്നു!',
        'Racing ഇഷ്ടമാണെങ്കിൽ Gran Turismo, Need for Speed ഉണ്ട്. Action ഇഷ്ടമാണെങ്കിൽ GTA, COD ഉണ്ട്. Sports ഇഷ്ടമാണെങ്കിൽ FIFA, NBA 2K ഉണ്ട്!'
      ]
    },

    // Timing/Hours
    timing: {
      keywords: ['സമയം', 'time', 'timing', 'hour', 'open', 'close', 'എപ്പോൾ', 'തുറക്കും', 'അടയ്ക്കും', 'working', 'പ്രവർത്തന സമയം', 'മണി'],
      responses: [
        'ഗെയിംസ്പോട്ട് പ്രവർത്തന സമയം: തിങ്കൾ മുതൽ വെള്ളി വരെ ഉച്ചയ്ക്ക് രണ്ട് മണി മുതൽ രാത്രി പത്ത് മണി വരെ. ശനി, ഞായർ ദിവസങ്ങളിൽ രാവിലെ പത്ത് മണി മുതൽ രാത്രി പത്ത് മണി വരെ.',
        'വീക്ക് ഡേയ്സ്: 2 PM മുതൽ 10 PM വരെ. വീക്കെൻഡ്: 10 AM മുതൽ 10 PM വരെ. ഹോളിഡേകളിൽ പ്രത്യേക സമയം ഉണ്ടാകും.',
        'ഞങ്ങൾ എല്ലാ ദിവസവും തുറന്നിരിക്കും. സ്കൂൾ അവധി ദിവസങ്ങളിൽ രാവിലെ മുതൽ തുറക്കും!'
      ]
    },

    // Location
    location: {
      keywords: ['സ്ഥലം', 'location', 'address', 'where', 'എവിടെ', 'വിലാസം', 'place', 'reach', 'direction', 'map', 'perumbavoor', 'പെരുമ്പാവൂർ'],
      responses: [
        'ഗെയിംസ്പോട്ട് പെരുമ്പാവൂരിൽ സ്ഥിതി ചെയ്യുന്നു. പെരുമ്പാവൂർ ടൗൺ സെന്ററിൽ നിന്ന് അഞ്ച് മിനിറ്റ് ദൂരം. Google Maps-ൽ GameSpot Perumbavoor എന്ന് സെർച്ച് ചെയ്യൂ.',
        'വിലാസം: ഗെയിംസ്പോട്ട് ഗെയിമിംഗ് സെന്റർ, മെയിൻ റോഡ്, പെരുമ്പാവൂർ, എറണാകുളം ജില്ല, കേരളം. ബസ് സ്റ്റാൻഡിന് അടുത്താണ്.',
        'എളുപ്പത്തിൽ കണ്ടെത്താം! പെരുമ്പാവൂർ KSRTC ബസ് സ്റ്റാൻഡിൽ നിന്ന് നടന്ന് അഞ്ച് മിനിറ്റ്. പാർക്കിംഗ് സൗകര്യവും ഉണ്ട്.'
      ]
    },

    // PS5
    ps5: {
      keywords: ['PS5', 'playstation', 'പ്ലേസ്റ്റേഷൻ', 'sony', 'console', 'കൺസോൾ', 'controller'],
      responses: [
        'ഞങ്ങളുടെ കൈവശം ആറ് PS5 കൺസോളുകൾ ഉണ്ട്! എല്ലാം ഒറിജിനൽ DualSense കൺട്രോളറുകളോടെ. 4K HDR ടിവികളിൽ കളിക്കാം.',
        'PS5 Digital Edition ഉം Disc Edition ഉം ലഭ്യം. ഓരോ സെറ്റപ്പിലും രണ്ട് കൺട്രോളറുകൾ. ഏറ്റവും പുതിയ ഗെയിമുകൾ എല്ലാം ഉണ്ട്.',
        'PS5-യിൽ Haptic Feedback, Adaptive Triggers എന്നിവ അനുഭവിക്കാം. ശരിക്കും ഗെയിമിംഗ് അനുഭവം!'
      ]
    },

    // Simulator
    simulator: {
      keywords: ['simulator', 'racing', 'car', 'drive', 'wheel', 'സിമുലേറ്റർ', 'റേസിംഗ്', 'കാർ', 'ഡ്രൈവിംഗ്', 'steering'],
      responses: [
        'ഞങ്ങളുടെ Racing Simulator പ്രൊഫഷണൽ ഗ്രേഡാണ്! Logitech G923 Steering Wheel, Pedals, Racing Seat എന്നിവയോടെ. Gran Turismo, Assetto Corsa കളിക്കാം.',
        'റേസിംഗ് സിമുലേറ്റർ ശരിക്കും കാർ ഓടിക്കുന്ന അനുഭവം തരും! Force Feedback Steering, Triple Monitor Setup. VR-ഉം ലഭ്യം!',
        'Simulator-ൽ F1, Rally, Street Racing എല്ലാം കളിക്കാം. തുടക്കക്കാർക്കും പ്രൊഫഷണലുകൾക്കും അനുയോജ്യം.'
      ]
    },

    // Multiplayer
    multiplayer: {
      keywords: ['multiplayer', 'friends', 'group', 'team', 'together', 'കൂട്ടുകാർ', 'ഗ്രൂപ്പ്', 'ടീം', 'ഒരുമിച്ച്', 'multi'],
      responses: [
        'കൂട്ടുകാരോടൊപ്പം കളിക്കാൻ പറ്റിയ സ്ഥലം! ആറ് PS5-ഉം ഒരേ സമയം ബുക്ക് ചെയ്യാം. FIFA, COD, Mortal Kombat ടൂർണമെന്റ് നടത്താം.',
        'ഗ്രൂപ്പ് ബുക്കിംഗിന് സ്പെഷ്യൽ ഡിസ്കൗണ്ട്! നാല് പേർക്ക് മുകളിൽ ബുക്ക് ചെയ്താൽ പത്ത് ശതമാനം കുറവ്.',
        'Split Screen, LAN Party, Online Multiplayer എല്ലാം സപ്പോർട്ട് ചെയ്യുന്നു. പാർട്ടികൾക്ക് പ്രത്യേക ഏരിയ ഉണ്ട്.'
      ]
    },

    // Food & Snacks
    food: {
      keywords: ['food', 'snack', 'drink', 'eat', 'ഭക്ഷണം', 'സ്നാക്ക്', 'കഴിക്കാൻ', 'കുടിക്കാൻ', 'chips', 'cola', 'juice'],
      responses: [
        'ഗെയിമിംഗിനിടെ വിശക്കുമ്പോൾ ഞങ്ങളുടെ Snack Bar-ൽ നിന്ന് ചിപ്സ്, ബിസ്കറ്റ്, സോഫ്റ്റ് ഡ്രിങ്ക്സ്, ജ്യൂസ് എന്നിവ ലഭിക്കും.',
        'Snacks Menu: Lays, Kurkure, Oreo, Coke, Pepsi, Red Bull, Sprite, Fanta, Frooti എന്നിവ ലഭ്യം. വില MRP മാത്രം!',
        'കളിക്കുമ്പോൾ Energy Drinks വേണോ? Red Bull, Monster Energy ഉണ്ട്. Hot Beverages-ഉം ഉടൻ വരുന്നു!'
      ]
    },

    // Payment
    payment: {
      keywords: ['payment', 'pay', 'cash', 'UPI', 'card', 'GPay', 'PhonePe', 'പേയ്മെന്റ്', 'പണം', 'കാർഡ്', 'ഓൺലൈൻ'],
      responses: [
        'എല്ലാ പേയ്മെന്റ് രീതികളും സ്വീകരിക്കുന്നു! Cash, UPI, GPay, PhonePe, Paytm, Credit Card, Debit Card എല്ലാം പറ്റും.',
        'ഓൺലൈൻ ബുക്കിംഗിന് UPI, Card Payment. Walk-in-ന് Cash-ഉം UPI-ഉം. Invoice എല്ലാവർക്കും ലഭിക്കും.',
        'GPay, PhonePe-യിൽ ഇൻസ്റ്റന്റ് പേയ്മെന്റ്. No hidden charges, No booking fee!'
      ]
    },

    // Birthday & Events
    events: {
      keywords: ['birthday', 'party', 'event', 'celebration', 'ബർത്ത്ഡേ', 'പാർട്ടി', 'ആഘോഷം', 'celebrate', 'corporate'],
      responses: [
        'Birthday Party-കൾക്ക് ഗെയിംസ്പോട്ട് Perfect! Decorations, Gaming Tournament, Cake Cutting Space എല്ലാം arrange ചെയ്യാം.',
        'Corporate Events, Team Building Activities-ഉം നടത്താം. Projector, Sound System available. Custom packages ഉണ്ട്.',
        'ബർത്ത്ഡേ സ്പെഷ്യൽ: Birthday Boy/Girl-ന് ഒരു മണിക്കൂർ Free! പത്ത് പേർക്ക് മുകളിൽ ഗ്രൂപ്പ് ബുക്കിംഗിന് ഇരുപത് ശതമാനം കുറവ്.'
      ]
    },

    // Membership
    membership: {
      keywords: ['membership', 'member', 'subscription', 'മെമ്പർഷിപ്പ്', 'subscribe', 'loyalty', 'points'],
      responses: [
        'ഗെയിംസ്പോട്ട് Membership Plans: Silver - 499 രൂപ/മാസം, Gold - 999 രൂപ/മാസം, Platinum - 1999 രൂപ/മാസം. ഓരോന്നിനും പ്രത്യേക ആനുകൂല്യങ്ങൾ!',
        'Silver Member: 5 മണിക്കൂർ Free + 10% Discount. Gold Member: 12 മണിക്കൂർ Free + 15% Discount + Priority Booking. Platinum: 25 മണിക്കൂർ Free + 20% Discount + VIP Access.',
        'Loyalty Points System: ഓരോ 100 രൂപയ്ക്കും 10 Points. 500 Points = 1 Hour Free Gaming!'
      ]
    },

    // Cancellation
    cancellation: {
      keywords: ['cancel', 'refund', 'കാൻസൽ', 'റീഫണ്ട്', 'reschedule', 'change', 'മാറ്റം'],
      responses: [
        'ബുക്കിംഗ് 24 മണിക്കൂർ മുമ്പ് Cancel ചെയ്താൽ Full Refund ലഭിക്കും. 12 മണിക്കൂർ മുമ്പാണെങ്കിൽ 50% Refund.',
        'Reschedule എപ്പോൾ വേണമെങ്കിലും ചെയ്യാം, Free of cost! വെബ്സൈറ്റിൽ My Bookings-ൽ പോയി Change Date ക്ലിക്ക് ചെയ്യുക.',
        'Emergency Cancel-ന് 8075557375-ൽ call ചെയ്യുക. ഞങ്ങൾ help ചെയ്യാം!'
      ]
    },

    // Contact
    contact: {
      keywords: ['contact', 'phone', 'call', 'number', 'ഫോൺ', 'നമ്പർ', 'വിളിക്കുക', 'കോൺടാക്ട്', 'reach', 'enquiry'],
      responses: [
        'ഞങ്ങളെ വിളിക്കൂ: 8075557375. WhatsApp-ഉം ഇതേ നമ്പറിൽ Available. Email: info@gamespot.com',
        'Contact: Phone - 8075557375, WhatsApp - 8075557375, Instagram - @gamespot_perumbavoor',
        'ഏത് സഹായത്തിനും 8075557375-ൽ വിളിക്കുക. രാവിലെ 10 മുതൽ രാത്രി 10 വരെ Available.'
      ]
    },

    // Safety & Rules
    safety: {
      keywords: ['rules', 'safety', 'guidelines', 'നിയമം', 'സുരക്ഷ', 'rule', 'regulation'],
      responses: [
        'Safety First! എല്ലാ Equipment-ഉം ഓരോ Session കഴിഞ്ഞ് Sanitize ചെയ്യുന്നു. AC-യുള്ള Clean Environment.',
        'Rules: Food കൺസോൾ Area-യിൽ കഴിക്കരുത്, Equipment ശ്രദ്ധയോടെ handle ചെയ്യുക, Time Limit Respect ചെയ്യുക.',
        'Age Limit: 18-ൽ താഴെയുള്ളവർക്ക് Guardian Consent വേണം. Violent Games-ന് Age Verification ഉണ്ട്.'
      ]
    },

    // VR
    vr: {
      keywords: ['VR', 'virtual reality', 'വെർച്വൽ', 'headset', 'immersive', 'metaverse'],
      responses: [
        'VR Gaming ഗെയിംസ്പോട്ടിൽ ലഭ്യം! Meta Quest 3, PSVR2 രണ്ടും ഉണ്ട്. Beat Saber, Half-Life Alyx, Resident Evil 4 VR കളിക്കാം.',
        'VR Experience: 30 മിനിറ്റ് - 100 രൂപ, 1 മണിക്കൂർ - 150 രൂപ. First-timers-ന് Tutorial Free!',
        'Virtual Reality-യിൽ Horror Games, Racing, Adventure എല്ലാം Try ചെയ്യാം. Motion Sickness-നെക്കുറിച്ച് Worry വേണ്ട, ഞങ്ങൾ Guide ചെയ്യാം!'
      ]
    },

    // Tournaments
    tournaments: {
      keywords: ['tournament', 'competition', 'ടൂർണമെന്റ്', 'compete', 'prize', 'championship', 'esports', 'മത്സരം'],
      responses: [
        'Monthly Tournaments: FIFA Cup, COD Championship, Tekken Battle. Registration Free! Cash Prizes up to 10,000 രൂപ!',
        'അടുത്ത Tournament: FC 25 Cup - January 15. Entry Free. Prize Pool: 5000 രൂപ. Register on website!',
        'Esports Tournaments: Solo, Duo, Squad categories. Live Streaming, Commentary, Trophies എല്ലാം ഉണ്ട്!'
      ]
    },

    // Recommendations
    recommendations: {
      keywords: ['recommend', 'suggest', 'best', 'popular', 'ഏറ്റവും', 'നല്ലത്', 'ജനപ്രിയ', 'trending', 'new'],
      responses: [
        'ഇപ്പോൾ Trending: GTA V Online, FC 25, Spider-Man 2, Call of Duty MW3. പുതിയ Players-ക്ക് FIFA, NBA 2K recommend ചെയ്യുന്നു.',
        'Racing Fan ആണെങ്കിൽ Simulator Try ചെയ്യൂ. Action ഇഷ്ടമാണെങ്കിൽ God of War Ragnarok മികച്ചതാണ്. Horror Fan? Resident Evil 4 Remake!',
        'Best Multiplayer: It Takes Two, A Way Out, Overcooked 2. Best Single Player: Elden Ring, Hogwarts Legacy, Ghost of Tsushima.'
      ]
    },

    // How it works
    howItWorks: {
      keywords: ['how', 'work', 'process', 'step', 'എങ്ങനെ', 'പ്രവർത്തിക്കുന്നു', 'procedure'],
      responses: [
        'വളരെ Easy! 1. Website-ൽ Book Now ക്ലിക്ക് ചെയ്യുക. 2. Date, Time, Device തിരഞ്ഞെടുക്കുക. 3. Pay Online. 4. Confirmation Email ലഭിക്കും. 5. Time ആകുമ്പോൾ വരൂ!',
        'Walk-in-ഉം Welcome! നേരിട്ട് വന്ന് Available Slot Check ചെയ്ത് Play ചെയ്യാം. Online Book ചെയ്താൽ Slot Guaranteed.',
        'First Visit? ID Proof കൊണ്ടുവരൂ. 5 മിനിറ്റ് Orientation, Rules Explanation, Then Gaming Start!'
      ]
    },

    // Thanks & Farewell
    thanks: {
      keywords: ['thanks', 'thank you', 'നന്ദി', 'bye', 'goodbye', 'വിട', 'see you', 'ശരി'],
      responses: [
        'നന്ദി! ഗെയിംസ്പോട്ടിൽ നിങ്ങളെ കാണാൻ കാത്തിരിക്കുന്നു. Happy Gaming!',
        'സന്തോഷം! കൂടുതൽ സഹായം വേണമെങ്കിൽ എപ്പോഴും ചോദിക്കൂ. Game On!',
        'വിട! ഗെയിംസ്പോട്ടിലേക്ക് സ്വാഗതം. Best Gaming Experience Guaranteed!'
      ]
    },

    // Amenities
    amenities: {
      keywords: ['amenities', 'facilities', 'സൗകര്യം', 'AC', 'parking', 'wifi', 'toilet', 'restroom'],
      responses: [
        'Amenities: Full AC, Free WiFi, Clean Restrooms, Comfortable Seating, Parking Space, Locker Facility.',
        'Facilities: 4K Gaming Monitors, Surround Sound, Adjustable Gaming Chairs, Charging Points, Drinking Water Free.',
        'Premium Setup: Soundproof Rooms, LED Ambient Lighting, Snack Bar, Waiting Area with TV.'
      ]
    },

    // Age
    age: {
      keywords: ['age', 'പ്രായം', 'year', 'old', 'kids', 'children', 'കുട്ടികൾ', 'adult'],
      responses: [
        'എല്ലാ പ്രായക്കാർക്കും Welcome! 12 വയസ്സിൽ താഴെയുള്ള കുട്ടികൾക്ക് Parent Supervision വേണം. Kids-friendly Games ധാരാളം ഉണ്ട്.',
        '18-ൽ താഴെയുള്ളവർക്ക് Violent Games (GTA, COD) Access ഇല്ല. Minecraft, FIFA, Racing Games എല്ലാ പ്രായക്കാർക്കും.',
        'Family Gaming Sessions-ഉം Arrange ചെയ്യാം! It Takes Two, Overcooked പോലുള്ള Family-friendly Games ഉണ്ട്.'
      ]
    },

    // Internet/Online
    internet: {
      keywords: ['internet', 'wifi', 'online', 'connection', 'ഇന്റർനെറ്റ്', 'speed', 'lag'],
      responses: [
        'High-Speed 1 Gbps Fiber Internet! Online Gaming-ന് Zero Lag. Free WiFi for all visitors.',
        'Dedicated Gaming Network - No Lag, No Buffering. Fortnite, Warzone, GTA Online എല്ലാം Smooth ആയി കളിക്കാം.',
        'Internet Down ആണെങ്കിൽ Offline Games-ഉം ധാരാളം. Story Mode Games, Local Multiplayer എന്നിവ Available.'
      ]
    },

    // Waiting
    waiting: {
      keywords: ['wait', 'queue', 'line', 'available', 'slot', 'കാത്തിരിക്കുക', 'ലഭ്യം'],
      responses: [
        'Live Availability Website-ൽ കാണാം! Green = Available, Yellow = Few Slots, Red = Full. Online Book ചെയ്താൽ Wait വേണ്ട.',
        'Walk-in ആണെങ്കിൽ Peak Hours-ൽ (6 PM - 9 PM) Wait ഉണ്ടാകാം. Waiting Area-യിൽ TV, WiFi ഉണ്ട്.',
        'Pro Tip: Weekday Afternoons ആണ് Best Time! Less Crowd, More Availability.'
      ]
    },

    // Streaming
    streaming: {
      keywords: ['stream', 'youtube', 'twitch', 'record', 'capture', 'സ്ട്രീം', 'video'],
      responses: [
        'Streaming Setup Available! Capture Card, Mic, Webcam ഉണ്ട്. YouTube, Twitch-ൽ Stream ചെയ്യാം. Extra Charge: 50 രൂപ/hour.',
        'Content Creators-ക്ക് Special Packages! Dedicated Room, Green Screen, Professional Lighting.',
        'Game Clips Record ചെയ്ത് USB-ൽ കൊണ്ടുപോകാം. PS5-ൽ Direct Recording-ഉം ഉണ്ട്.'
      ]
    },

    // Special Offers
    offers: {
      keywords: ['offer', 'discount', 'deal', 'ഓഫർ', 'ഡിസ്കൗണ്ട്', 'promotion', 'coupon'],
      responses: [
        'Current Offers: Happy Hours (2 PM - 4 PM) - 20% Off! Student Discount - 15% Off with ID. First Visit - 1 Hour Free!',
        'Weekend Special: 5 Hours @ 350 രൂപ മാത്രം! Group of 4+ - 10% Extra Discount.',
        'Refer a Friend - Both Get 30 Minutes Free! Follow Instagram for Flash Deals.'
      ]
    },

    // Help
    help: {
      keywords: ['help', 'assist', 'support', 'സഹായം', 'problem', 'issue', 'guide'],
      responses: [
        'എന്താണ് സഹായം വേണ്ടത്? Booking, Games, Pricing, Location, Timing എന്തിനെക്കുറിച്ചും ചോദിക്കാം!',
        'Technical Issue ആണെങ്കിൽ Staff-നെ വിളിക്കൂ. ഞങ്ങൾ Immediately Help ചെയ്യാം.',
        'FAQ: 1. Price - 80/hour, 2. Timing - 2-10 PM (Weekdays), 10-10 (Weekends), 3. Location - Perumbavoor.'
      ]
    },

    // Default/Fallback
    default: {
      keywords: [],
      responses: [
        'ക്ഷമിക്കണം, എനിക്ക് മനസ്സിലായില്ല. Booking, Price, Games, Timing, Location എന്നിവയെക്കുറിച്ച് ചോദിക്കൂ.',
        'അത് എനിക്ക് അറിയില്ല. എന്നാൽ Gaming, Booking, Hours, Location എന്നിവയെക്കുറിച്ച് ഞാൻ സഹായിക്കാം!',
        'Sorry, I didn\'t get that. ഗെയിമിംഗ്, ബുക്കിംഗ്, വില, സമയം എന്നിവയെക്കുറിച്ച് Malayalam-ൽ ചോദിക്കൂ!'
      ]
    }
  }), []);

  // Quick action buttons
  const quickActions = useMemo(() => [
    { icon: FiDollarSign, label: 'വില', query: 'എന്താണ് വില?' },
    { icon: FiClock, label: 'സമയം', query: 'പ്രവർത്തന സമയം?' },
    { icon: FiMapPin, label: 'സ്ഥലം', query: 'എവിടെയാണ്?' },
    { icon: FiCalendar, label: 'ബുക്കിംഗ്', query: 'എങ്ങനെ ബുക്ക് ചെയ്യാം?' },
    { icon: FiPhone, label: 'കോൺടാക്ട്', query: 'ഫോൺ നമ്പർ?' },
    { icon: FiHelpCircle, label: 'സഹായം', query: 'എന്തെല്ലാം ഗെയിമുകൾ ഉണ്ട്?' }
  ], []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current || !isOpen) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 3;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true
    });
    renderer.setSize(280, 280);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // Main Sphere with gradient material
    const sphereGeometry = new THREE.IcosahedronGeometry(1, 4);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: 0xff6b00,
      emissive: 0xff4500,
      emissiveIntensity: 0.3,
      shininess: 100,
      transparent: true,
      opacity: 0.9,
      wireframe: false
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);
    sphereRef.current = sphere;

    // Inner glow sphere
    const innerGeometry = new THREE.IcosahedronGeometry(0.85, 3);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: 0xffa500,
      transparent: true,
      opacity: 0.4
    });
    const innerSphere = new THREE.Mesh(innerGeometry, innerMaterial);
    sphere.add(innerSphere);

    // Particles
    const particleCount = 150;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.5 + Math.random() * 1;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.4 + Math.random() * 0.3;
      colors[i * 3 + 2] = 0;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xff6b00, 2, 10);
    pointLight1.position.set(3, 3, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffa500, 1.5, 10);
    pointLight2.position.set(-3, -3, 3);
    scene.add(pointLight2);

    // Animation loop
    let time = 0;
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      time += 0.01;

      // Sphere animation
      if (sphereRef.current) {
        const baseScale = isListening ? 1.1 : (isSpeaking ? 1.05 : 1);
        const pulseScale = isListening 
          ? Math.sin(time * 8) * 0.15 
          : (isSpeaking ? Math.sin(time * 6) * 0.1 : Math.sin(time * 2) * 0.03);
        
        sphereRef.current.scale.setScalar(baseScale + pulseScale);
        sphereRef.current.rotation.y += isListening ? 0.02 : 0.005;
        sphereRef.current.rotation.x += 0.002;

        // Color change based on state
        if (isListening) {
          sphereRef.current.material.emissive.setHex(0x00ff00);
          sphereRef.current.material.color.setHex(0x00cc00);
        } else if (isSpeaking) {
          sphereRef.current.material.emissive.setHex(0x0066ff);
          sphereRef.current.material.color.setHex(0x0044cc);
        } else {
          sphereRef.current.material.emissive.setHex(0xff4500);
          sphereRef.current.material.color.setHex(0xff6b00);
        }
      }

      // Particles animation
      if (particlesRef.current) {
        particlesRef.current.rotation.y -= 0.002;
        particlesRef.current.rotation.x += 0.001;

        const positions = particlesRef.current.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 1] += Math.sin(time * 2 + i) * 0.002;
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
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
      recognitionRef.current.lang = 'ml-IN';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);

        if (finalTranscript) {
          processVoiceInput(finalTranscript);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setStatusText('ടാപ്പ് ചെയ്ത് സംസാരിക്കുക');
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setStatusText('വീണ്ടും ശ്രമിക്കുക');
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Process voice input with intelligent matching
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
          // Longer keyword matches get higher scores
          score += keyword.length;
          // Exact word match bonus
          if (normalizedInput.split(/\s+/).includes(keyword.toLowerCase())) {
            score += 5;
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = category;
      }
    }

    // Get response
    const responseData = bestMatch ? aiKnowledge[bestMatch] : aiKnowledge.default;
    const responses = responseData.responses;
    const response = responses[Math.floor(Math.random() * responses.length)];

    setCurrentResponse(response);
    
    // Add AI response to history
    setConversationHistory(prev => [...prev, {
      type: 'ai',
      text: response,
      timestamp: new Date()
    }]);

    // Speak the response
    speakResponse(response);
  }, [aiKnowledge]);

  // Text to speech with Malayalam voice
  const speakResponse = useCallback((text) => {
    if (isMuted || !text) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ml-IN';
    utterance.rate = voiceSettings.rate;
    utterance.pitch = voiceSettings.pitch;
    utterance.volume = voiceSettings.volume;

    // Try to find a Malayalam voice
    const voices = synthRef.current.getVoices();
    const malayalamVoice = voices.find(v => 
      v.lang.includes('ml') || 
      v.lang.includes('IN') ||
      v.name.toLowerCase().includes('malayalam') ||
      v.name.toLowerCase().includes('indian')
    );

    if (malayalamVoice) {
      utterance.voice = malayalamVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setStatusText('സംസാരിക്കുന്നു...');
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setStatusText('ടാപ്പ് ചെയ്ത് സംസാരിക്കുക');
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setStatusText('ടാപ്പ് ചെയ്ത് സംസാരിക്കുക');
    };

    synthRef.current.speak(utterance);
  }, [isMuted, voiceSettings]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setStatusText('ടാപ്പ് ചെയ്ത് സംസാരിക്കുക');
    } else {
      // Cancel any ongoing speech
      synthRef.current.cancel();
      setIsSpeaking(false);
      
      setTranscript('');
      recognitionRef.current?.start();
      setIsListening(true);
      setStatusText('കേൾക്കുന്നു...');
    }
  }, [isListening]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!isMuted) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
    setIsMuted(!isMuted);
  }, [isMuted]);

  // Handle quick action
  const handleQuickAction = useCallback((query) => {
    setTranscript(query);
    processVoiceInput(query);
  }, [processVoiceInput]);

  // Close handler
  const handleClose = useCallback(() => {
    synthRef.current.cancel();
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setIsListening(false);
    setIsSpeaking(false);
    onClose();
  }, [onClose]);

  // Format timestamp
  const formatTime = (date) => {
    return date.toLocaleTimeString('ml-IN', { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="voice-malayalam-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="voice-malayalam-container"
          ref={containerRef}
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="voice-malayalam-header">
            <div className="header-left">
              <FiHome className="header-icon" />
              <div className="header-text">
                <h2>ഗെയിംസ്പോട്ട് AI</h2>
                <span className="header-subtitle">മലയാളം വോയ്സ് അസിസ്റ്റന്റ്</span>
              </div>
            </div>
            <div className="header-actions">
              <motion.button
                className="header-btn"
                onClick={() => setShowSettings(!showSettings)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiSettings />
              </motion.button>
              <motion.button
                className="header-btn"
                onClick={toggleMute}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isMuted ? <FiVolumeX /> : <FiVolume2 />}
              </motion.button>
              <motion.button
                className="header-btn close-btn"
                onClick={handleClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
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
                  <label>വേഗത</label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={voiceSettings.rate}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, rate: parseFloat(e.target.value) }))}
                  />
                  <span>{voiceSettings.rate.toFixed(1)}x</span>
                </div>
                <div className="setting-item">
                  <label>പിച്ച്</label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={voiceSettings.pitch}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, pitch: parseFloat(e.target.value) }))}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={statusText}
            >
              {statusText}
            </motion.p>
          </div>

          {/* Transcript */}
          {transcript && (
            <motion.div
              className="transcript-box"
              initial={{ opacity: 0, y: 10 }}
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
              initial={{ opacity: 0, y: 10 }}
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
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isSpeaking}
            >
              {isListening ? <FiMicOff size={32} /> : <FiMic size={32} />}
              <span className="pulse-ring" />
              <span className="pulse-ring delay-1" />
              <span className="pulse-ring delay-2" />
            </motion.button>
            <p className="mic-hint">
              {isListening ? 'ടാപ്പ് ചെയ്ത് നിർത്തുക' : 'മലയാളത്തിൽ സംസാരിക്കുക'}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-grid">
            {quickActions.map((action, index) => (
              <motion.button
                key={index}
                className="quick-action-btn"
                onClick={() => handleQuickAction(action.query)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <action.icon className="quick-action-icon" />
                <span>{action.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Conversation History */}
          {conversationHistory.length > 0 && (
            <div className="conversation-history">
              <h4>സംഭാഷണ ചരിത്രം</h4>
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

export default VoiceAIMalayalam;
