import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiCalendar, FiClock, FiMonitor, FiUser, FiCpu, FiZap, FiUsers, FiCheck, FiTag, FiPhone, FiStar, FiSearch, FiX, FiGrid, FiList, FiInfo, FiAward } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { getSlots, getSlotDetails, createBooking, calculatePrice, getMembershipStatus, getGames, createPartyBooking, getQuestPassStatus, subscribeQuestPass } from '../services/api';
import { formatDate, getToday, formatDuration, formatPrice, formatTime12Hour, isValidName, isValidPhone } from '../utils/helpers';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { apiFetch } from '../services/apiClient';
import ModernDatePicker from '../components/ModernDatePicker';
import '../styles/BookingPage.css';

// Game cover images mapping - using Steam CDN (library_600x900) for verified correct covers
const GAME_COVERS = {
  'Spider-Man 2': {
    img: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2651280/library_600x900.jpg',
    emoji: '🕷️',
    color: '#b91c1c'
  },
  'FC 26': {
    img: 'https://image.api.playstation.com/vulcan/ap/rnd/202507/1617/27132291f4187708f316b43f65ab887a74fdf325f4ece306.png',
    emoji: '⚽',
    color: '#1a472a'
  },
  'WWE 2K24': {
    img: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2315690/library_600x900.jpg',
    emoji: '🤼',
    color: '#8b0000'
  },
  'WWE 2K25': {
    img: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2895490/library_600x900.jpg',
    emoji: '🤼',
    color: '#990000'
  },
  'Split Fiction': {
    img: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2001120/library_600x900.jpg',
    emoji: '📖',
    color: '#4a0e8f'
  },
  'It Takes Two': {
    img: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1426210/library_600x900.jpg',
    emoji: '💑',
    color: '#e85d04'
  },
  'Marvel Rivals': {
    img: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2767030/library_600x900.jpg',
    emoji: '🦸',
    color: '#c41e3a'
  },
  'Mortal Kombat 1': {
    img: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1971870/library_600x900.jpg',
    emoji: '🐉',
    color: '#8b4513'
  },
  'GTA 5': {
    img: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/271590/library_600x900.jpg',
    emoji: '🔫',
    color: '#006400'
  },
  'Gran Turismo 7': {
    img: 'https://image.api.playstation.com/vulcan/ap/rnd/202109/1321/y7iyxoBE8VKotN89QCFhLgLM.png',
    emoji: '🏎️',
    color: '#00308F'
  },
  'Forza Horizon 5': {
    img: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1551360/library_600x900.jpg',
    emoji: '🏁',
    color: '#ff6b00'
  },
  'The Crew Motorfest': {
    img: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2698940/library_600x900.jpg',
    emoji: '🏝️',
    color: '#0077be'
  },
};

// Helper to get game cover info
const getGameCover = (gameName) => {
  return GAME_COVERS[gameName] || { img: null, emoji: '🎮', color: '#ff6b35' };
};

const BookingPage = () => {
  const navigate = useNavigate();
  
  // State
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [slots, setSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [ps5Bookings, setPs5Bookings] = useState([]);
  const [drivingSim, setDrivingSim] = useState(null); // Changed to store { duration, afterPS5 }
  const [availablePS5Units, setAvailablePS5Units] = useState([]);
  const [availableDriving, setAvailableDriving] = useState(true);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [price, setPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [discountInfo, setDiscountInfo] = useState(null); // { percentage, amount, membership }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  
  // User session state
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [membership, setMembership] = useState(null);
  
  // Form fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoCodeData, setPromoCodeData] = useState(null);
  const [promoCodeError, setPromoCodeError] = useState('');
  const [promoCodeSuccess, setPromoCodeSuccess] = useState('');
  const [applyingPromoCode, setApplyingPromoCode] = useState(false);
  const [bonusMinutes, setBonusMinutes] = useState(0);
  
  // New state for step-based flow
  const [currentStep, setCurrentStep] = useState(1); // 1: Date/Time, 2: Device Selection, 3: Details
  const [expandedPS5, setExpandedPS5] = useState(null); // Track which PS5 card is expanded
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookingId, setBookingId] = useState(null);

  // Game selection state
  const [allGames, setAllGames] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [selectedGames, setSelectedGames] = useState([]); // Games user wants to play (multiple selection)
  const [gameSearchQuery, setGameSearchQuery] = useState('');
  const [activeGenreFilter, setActiveGenreFilter] = useState('All');
  const [selectionMode, setSelectionMode] = useState('game'); // 'game' or 'device' - start with game-first flow
  const [showGamePicker, setShowGamePicker] = useState(false); // For mobile game picker modal
  const [gameInfoModal, setGameInfoModal] = useState(null); // Game detail modal
  const [consoleConflictWarning, setConsoleConflictWarning] = useState(null); // Warning when games can't share a console

  // Party booking state
  const [bookingType, setBookingType] = useState('regular'); // 'regular' or 'party'
  const [partyHours, setPartyHours] = useState(1); // 1, 2, or 3 hours
  const [partySubmitting, setPartySubmitting] = useState(false);

  // Quest Pass state
  const [questPass, setQuestPass] = useState(null); // { has_active, active_pass, has_pending, pending_pass, progress }
  const [questPassGame, setQuestPassGame] = useState(''); // Game name for new subscription
  const [questPassSubmitting, setQuestPassSubmitting] = useState(false);
  const [showQuestPassModal, setShowQuestPassModal] = useState(false);

  // Check user session on component mount
  useEffect(() => {
    checkUserSession();
    loadGames();
  }, []);

  // Load slots when date changes
  useEffect(() => {
    loadSlots();
  }, [selectedDate]);

  // Check availability when device durations change (not on initial time select)
  useEffect(() => {
    if (selectedTime && currentStep === 2 && (ps5Bookings.length > 0 || drivingSim)) {
      checkAvailability();
    }
  }, [ps5Bookings.map(b => b.duration).join(','), drivingSim?.duration, drivingSim?.afterPS5]);

  // Calculate price when selections change
  useEffect(() => {
    if (ps5Bookings.length > 0 || drivingSim) {
      updatePrice();
    }
  }, [ps5Bookings, drivingSim]);

  const loadSlots = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSlots(selectedDate);
      setSlots(response.slots);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkUserSession = async () => {
    try {
      const data = await apiFetch('/api/auth/check');
      
      if (data.authenticated && data.user_type !== 'admin') {
        // User is logged in (not admin)
        setIsLoggedIn(true);
        setUser(data.user);
        
        // Auto-fill form fields with user data
        if (data.user.name) {
          setCustomerName(data.user.name);
        }
        if (data.user.phone) {
          setCustomerPhone(data.user.phone);
        }
        
        // Fetch membership status
        try {
          const membershipResponse = await getMembershipStatus();
          if (membershipResponse.success && membershipResponse.has_membership) {
            setMembership(membershipResponse.membership);
          }
        } catch (membershipErr) {
          console.log('No active membership');
        }

        // Fetch Quest Pass status
        try {
          const questResponse = await getQuestPassStatus();
          if (questResponse.success) {
            setQuestPass(questResponse);
          }
        } catch (questErr) {
          console.log('No quest pass data');
        }
      }
    } catch (err) {
      console.error('Session check error:', err);
      // Not logged in, continue as guest
    }
  };

  const loadGames = async () => {
    try {
      setGamesLoading(true);
      const response = await getGames();
      if (response.success) {
        setAllGames(response.games || []);
      }
    } catch (err) {
      console.error('Failed to load games:', err);
      // Use fallback - empty array, game selection will be optional
    } finally {
      setGamesLoading(false);
    }
  };

  // Compute unique genres from games
  const gameGenres = useMemo(() => {
    const genres = new Set(allGames.map(g => g.genre).filter(Boolean));
    return ['All', ...Array.from(genres).sort()];
  }, [allGames]);

  // Filter games based on search and genre
  const filteredGames = useMemo(() => {
    let games = allGames;
    if (activeGenreFilter !== 'All') {
      games = games.filter(g => g.genre === activeGenreFilter);
    }
    if (gameSearchQuery.trim()) {
      const q = gameSearchQuery.toLowerCase();
      games = games.filter(g => 
        g.name.toLowerCase().includes(q) || 
        g.genre?.toLowerCase().includes(q)
      );
    }
    return games;
  }, [allGames, activeGenreFilter, gameSearchQuery]);

  // Get PS5 units that have the selected games
  const recommendedPS5Units = useMemo(() => {
    if (selectedGames.length === 0) return [];
    // Collect all PS5 units across all selected games
    const allUnits = new Set();
    selectedGames.forEach(game => {
      (game.ps5_numbers || []).forEach(n => {
        if (availablePS5Units.includes(n)) allUnits.add(n);
      });
    });
    return Array.from(allUnits);
  }, [selectedGames, availablePS5Units]);

  // Get games available on a specific PS5 unit
  const getGamesForUnit = (unitNumber) => {
    return allGames.filter(g => (g.ps5_numbers || []).includes(unitNumber));
  };

  // Handle game selection (multi-select) and auto-select recommended PS5
  const handleGameSelect = (game) => {
    const isAlreadySelected = selectedGames.some(g => g.id === game.id);
    
    let newSelectedGames;
    if (isAlreadySelected) {
      // Deselect
      newSelectedGames = selectedGames.filter(g => g.id !== game.id);
      setSelectedGames(newSelectedGames);
      setConsoleConflictWarning(null); // Clear warning on deselect
      // Re-check conflict after deselect
      const ps5GamesAfter = newSelectedGames.filter(g => {
        const units = (g.ps5_numbers || []).filter(n => n !== 4);
        return units.length > 0;
      });
      if (ps5GamesAfter.length >= 2) {
        let commonUnits = (ps5GamesAfter[0].ps5_numbers || []).filter(n => n !== 4);
        for (let i = 1; i < ps5GamesAfter.length; i++) {
          const gameUnits = (ps5GamesAfter[i].ps5_numbers || []).filter(n => n !== 4);
          commonUnits = commonUnits.filter(u => gameUnits.includes(u));
        }
        if (commonUnits.length === 0) {
          const gameNames = ps5GamesAfter.map(g => g.name).join(', ');
          setConsoleConflictWarning(
            `⚠️ "${gameNames}" are not available on a single console. You'll need separate PS5 units or sessions to play all of them.`
          );
        }
      }
      // If no games left, reset PS5 bookings
      if (newSelectedGames.length === 0) {
        setPs5Bookings([]);
      }
      return;
    }
    
    // Add to selection
    newSelectedGames = [...selectedGames, game];
    setSelectedGames(newSelectedGames);
    setShowGamePicker(false);
    
    // --- Console Conflict Warning ---
    // Check if all selected PS5 games (non-driving-sim) share at least one common PS5 unit
    const ps5Games = newSelectedGames.filter(g => {
      const units = (g.ps5_numbers || []).filter(n => n !== 4);
      return units.length > 0; // Only games that are on PS5 (not driving-sim-only)
    });
    
    if (ps5Games.length >= 2) {
      // Find intersection of PS5 units across all selected PS5 games
      let commonUnits = (ps5Games[0].ps5_numbers || []).filter(n => n !== 4);
      for (let i = 1; i < ps5Games.length; i++) {
        const gameUnits = (ps5Games[i].ps5_numbers || []).filter(n => n !== 4);
        commonUnits = commonUnits.filter(u => gameUnits.includes(u));
      }
      
      if (commonUnits.length === 0) {
        // No single console has all selected games — show warning
        const gameNames = ps5Games.map(g => g.name).join(', ');
        setConsoleConflictWarning(
          `⚠️ "${gameNames}" are not available on a single console. You'll need separate PS5 units or sessions to play all of them. Consider removing one, or book multiple PS5 units.`
        );
      } else {
        setConsoleConflictWarning(null);
      }
    } else {
      setConsoleConflictWarning(null);
    }
    
    // If game is a driving sim only game (all its units are unit 4), auto-select the driving simulator
    const isOnlyDrivingSim = game.device_type === 'driving_sim' || (game.ps5_numbers || []).every(n => n === 4);
    if (isOnlyDrivingSim) {
      if (availableDriving && !drivingSim) {
        setDrivingSim({ duration: 60, afterPS5: false });
      }
      return;
    }
    
    // PS5 Allocation Priority: PS5-2 first → PS5-3 if driving sim selected → closest → PS5-1 last resort
    const gamePS5Units = (game.ps5_numbers || []).filter(n => n !== 4);
    const availableUnitsWithGame = gamePS5Units.filter(n => availablePS5Units.includes(n));
    
    if (availableUnitsWithGame.length > 0 && ps5Bookings.length === 0) {
      // Check if any selected game includes driving sim
      const hasDrivingSimGame = newSelectedGames.some(g => (g.ps5_numbers || []).includes(4));
      
      let unitNumber;
      // Priority: PS5-2 > PS5-3 (if driving sim) > PS5-3 > PS5-1 (last resort)
      if (availableUnitsWithGame.includes(2)) {
        unitNumber = 2;
      } else if (hasDrivingSimGame && availableUnitsWithGame.includes(3)) {
        unitNumber = 3;
      } else if (availableUnitsWithGame.includes(3)) {
        unitNumber = 3;
      } else if (availableUnitsWithGame.includes(1)) {
        // PS5-1 is last resort — only if the game is exclusively on PS5-1
        unitNumber = 1;
      } else {
        unitNumber = availableUnitsWithGame[0];
      }
      
      setPs5Bookings([{ device_number: unitNumber, player_count: 1, duration: 60, game_preference: game.name }]);
      setExpandedPS5(unitNumber);
    }
  };

  const checkAvailability = async () => {
    try {
      // Check PS5 availability at the selected time
      const maxPS5Duration = ps5Bookings.length > 0 
        ? Math.max(...ps5Bookings.map(b => b.duration || 60))
        : 60;
      
      console.log('🔄 Checking PS5 availability with duration:', maxPS5Duration);
      const ps5Response = await getSlotDetails(selectedDate, selectedTime, maxPS5Duration);
      console.log('🔍 PS5 Availability Response:', ps5Response);
      console.log('📱 Available PS5 Units:', ps5Response.available_ps5_units);
      
      setAvailablePS5Units(ps5Response.available_ps5_units);
      setTotalPlayers(ps5Response.total_ps5_players_booked);
      
      // Reset PS5 selections if not available
      const validPS5 = ps5Bookings.filter(b => 
        ps5Response.available_ps5_units.includes(b.device_number)
      );
      setPs5Bookings(validPS5);
      
      // Check Driving Sim availability based on "Play After PS5" setting
      if (drivingSim && drivingSim.afterPS5 && ps5Bookings.length > 0) {
        // "Play After PS5" is ENABLED - check at adjusted time (after PS5 ends)
        const maxPS5Duration = Math.max(...ps5Bookings.map(b => b.duration || 60));
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + maxPS5Duration;
        const newHours = Math.floor(totalMinutes / 60);
        const newMinutes = totalMinutes % 60;
        const drivingCheckTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
        const drivingDuration = drivingSim.duration || 60;
        
        console.log('🔄 Checking Driving Sim (AFTER PS5) at:', drivingCheckTime, 'duration:', drivingDuration);
        const drivingResponse = await getSlotDetails(selectedDate, drivingCheckTime, drivingDuration);
        console.log('🏎️ Driving Sim Availability (adjusted time):', drivingResponse.available_driving);
        
        setAvailableDriving(drivingResponse.available_driving);
        
        if (!drivingResponse.available_driving) {
          setDrivingSim(null);
          setError(`Driving Simulator is not available after your PS5 session (at ${drivingCheckTime})`);
        }
      } else {
        // "Play After PS5" is DISABLED or no PS5 selected - use availability at selected time
        console.log('🏎️ Driving Sim Availability (selected time):', ps5Response.available_driving);
        setAvailableDriving(ps5Response.available_driving);
        
        // Only reset driving sim if it was selected but is not available at selected time
        if (drivingSim && !ps5Response.available_driving) {
          setDrivingSim(null);
          setError('Driving Simulator is not available at the selected time');
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const updatePrice = async () => {
    try {
      // Calculate price for each device separately and sum them
      let totalOriginalPrice = 0;
      let totalFinalPrice = 0;
      let lastDiscountInfo = null;
      
      // Calculate PS5 prices
      for (const ps5 of ps5Bookings) {
        const response = await calculatePrice([ps5], false, ps5.duration || 60);
        totalOriginalPrice += response.original_price || response.total_price;
        totalFinalPrice += response.total_price;
        
        // Capture discount info from last response
        if (response.has_discount) {
          lastDiscountInfo = {
            percentage: response.discount_percentage,
            membership: response.membership
          };
        }
      }
      
      // Calculate Driving Sim price
      if (drivingSim) {
        const response = await calculatePrice([], true, drivingSim.duration || 60);
        totalOriginalPrice += response.original_price || response.total_price;
        totalFinalPrice += response.total_price;
        
        // Capture discount info from last response
        if (response.has_discount) {
          lastDiscountInfo = {
            percentage: response.discount_percentage,
            membership: response.membership
          };
        }
      }
      
      setOriginalPrice(totalOriginalPrice);
      setPrice(totalFinalPrice);
      
      if (lastDiscountInfo) {
        setDiscountInfo({
          ...lastDiscountInfo,
          amount: totalOriginalPrice - totalFinalPrice
        });
      } else {
        setDiscountInfo(null);
      }
    } catch (err) {
      console.error('Price calculation error:', err);
    }
  };

  // Helper functions to calculate individual item prices (for display in summary)
  const calculatePS5Price = (ps5Booking) => {
    // Base rate: ₹100 per player per 30 minutes
    const baseRate = 100;
    const duration = ps5Booking.duration || 60;
    const players = ps5Booking.player_count || 1;
    const durationMultiplier = duration / 30;
    return baseRate * players * durationMultiplier;
  };

  const calculateDrivingPrice = (drivingBooking) => {
    // Base rate: ₹100 per 30 minutes for driving sim
    const baseRate = 100;
    const duration = drivingBooking?.duration || 60;
    const durationMultiplier = duration / 30;
    return baseRate * durationMultiplier;
  };

  const handleTimeSelect = async (time, status) => {
    if (status === 'full') return;
    setSelectedTime(time);
    setPs5Bookings([]);
    setDrivingSim(null);
    setSelectedGames([]);
    setPrice(0);
    setError(null);
    setConsoleConflictWarning(null);
    
    // For party bookings, check availability for the full party duration
    if (bookingType === 'party') {
      try {
        setLoading(true);
        const partyDuration = partyHours * 60;
        const response = await getSlotDetails(selectedDate, time, partyDuration);
        
        // Party booking needs ALL devices free
        if (response.available_ps5_units.length < 3 || !response.available_driving) {
          setError('Not all devices are available for this time slot. Party booking requires the entire shop to be free.');
          setLoading(false);
          return;
        }
        
        setAvailablePS5Units(response.available_ps5_units);
        setAvailableDriving(response.available_driving);
        setTotalPlayers(response.total_ps5_players_booked);
        setCurrentStep(2); // Go to party confirmation step
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }
    
    // Regular booking: Fetch availability data for this time slot
    try {
      setLoading(true);
      const response = await getSlotDetails(selectedDate, time, 60);
      console.log('🔍 Slot Details Response:', response);
      console.log('📱 Available PS5 Units:', response.available_ps5_units);
      setAvailablePS5Units(response.available_ps5_units);
      setAvailableDriving(response.available_driving);
      setTotalPlayers(response.total_ps5_players_booked);
      setCurrentStep(2); // Move to device selection step after data is loaded
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePS5CardClick = (deviceNumber) => {
    // Check if this device is available before allowing any interaction
    const isAvailable = availablePS5Units.includes(deviceNumber);
    if (!isAvailable) {
      return; // Do nothing if device is not available
    }
    
    // Toggle expanded state
    setExpandedPS5(expandedPS5 === deviceNumber ? null : deviceNumber);
  };
  
  const handlePlayerSelect = (deviceNumber, playerIndex) => {
    const existing = ps5Bookings.find(b => b.device_number === deviceNumber);
    
    if (existing) {
      const currentCount = existing.player_count;
      const newCount = playerIndex + 1;
      
      // If clicking the same count, deselect the entire PS5
      if (newCount === currentCount) {
        setPs5Bookings(ps5Bookings.filter(b => b.device_number !== deviceNumber));
        return;
      }
      
      // Check if this would exceed max 10 players
      const otherPlayers = ps5Bookings
        .filter(pb => pb.device_number !== deviceNumber)
        .reduce((sum, pb) => sum + pb.player_count, 0);
      
      if (otherPlayers + newCount + totalPlayers > 10) {
        setError('Maximum 10 players allowed at the same time');
        return;
      }
      
      // Update player count
      setPs5Bookings(ps5Bookings.map(b => 
        b.device_number === deviceNumber ? { ...b, player_count: newCount } : b
      ));
    } else {
      // Add new PS5 with selected player count and default duration
      const newCount = playerIndex + 1;
      const otherPlayers = ps5Bookings.reduce((sum, pb) => sum + pb.player_count, 0);
      
      if (otherPlayers + newCount + totalPlayers > 10) {
        setError('Maximum 10 players allowed at the same time');
        return;
      }
      
      setPs5Bookings([...ps5Bookings, { device_number: deviceNumber, player_count: newCount, duration: 60, game_preference: selectedGames.map(g => g.name).join(', ') || null }]);
    }
  };
  
  const handlePS5DurationChange = (deviceNumber, duration) => {
    setPs5Bookings(ps5Bookings.map(b => 
      b.device_number === deviceNumber ? { ...b, duration: parseInt(duration) } : b
    ));
  };
  
  const handleDrivingSimToggle = () => {
    if (drivingSim) {
      setDrivingSim(null);
    } else {
      setDrivingSim({ duration: 60, afterPS5: false });
    }
  };
  
  const handleDrivingDurationChange = (duration) => {
    setDrivingSim({ ...drivingSim, duration: parseInt(duration) });
  };
  
  const handleDrivingAfterPS5Change = (afterPS5) => {
    setDrivingSim({ ...drivingSim, afterPS5 });
  };

  const handlePS5Selection = (deviceNumber) => {
    const existing = ps5Bookings.find(b => b.device_number === deviceNumber);
    
    if (existing) {
      // Remove
      setPs5Bookings(ps5Bookings.filter(b => b.device_number !== deviceNumber));
    } else {
      // Add with 1 player by default
      setPs5Bookings([...ps5Bookings, { device_number: deviceNumber, player_count: 1 }]);
    }
  };

  const handlePlayerCountChange = (deviceNumber, change) => {
    const updated = ps5Bookings.map(b => {
      if (b.device_number === deviceNumber) {
        const newCount = Math.max(1, Math.min(4, b.player_count + change));
        
        // Check if this would exceed max 10 players
        const otherPlayers = ps5Bookings
          .filter(pb => pb.device_number !== deviceNumber)
          .reduce((sum, pb) => sum + pb.player_count, 0);
        
        if (otherPlayers + newCount + totalPlayers > 10) {
          setError('Maximum 10 players allowed at the same time');
          return b;
        }
        
        return { ...b, player_count: newCount };
      }
      return b;
    });
    
    setPs5Bookings(updated);
  };

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoCodeError('Please enter a promo code');
      return;
    }

    setApplyingPromoCode(true);
    setPromoCodeError('');
    setPromoCodeSuccess('');

    try {
      const response = await apiFetch('/api/promo/validate', {
        method: 'POST',
        body: JSON.stringify({ code: promoCode.trim().toUpperCase() })
      });

      if (response.success && response.valid) {
        setPromoCodeData(response.promo_code);
        setBonusMinutes(response.promo_code.bonus_minutes);
        setPromoCodeSuccess(`Promo code applied! You'll get ${response.promo_code.bonus_minutes} additional minutes FREE!`);
        setPromoCodeError('');
      } else {
        setPromoCodeError(response.error || 'Invalid promo code');
        setPromoCodeData(null);
        setBonusMinutes(0);
        setPromoCodeSuccess('');
      }
    } catch (err) {
      setPromoCodeError('Failed to validate promo code');
      setPromoCodeData(null);
      setBonusMinutes(0);
      setPromoCodeSuccess('');
    } finally {
      setApplyingPromoCode(false);
    }
  };

  const handleRemovePromoCode = () => {
    setPromoCode('');
    setPromoCodeData(null);
    setBonusMinutes(0);
    setPromoCodeError('');
    setPromoCodeSuccess('');
  };

  // Party Booking Submit Handler
  const handlePartySubmit = async (e) => {
    e.preventDefault();
    
    if (!isValidName(customerName)) {
      setError('Please enter a valid name (minimum 2 characters)');
      return;
    }
    if (!isValidPhone(customerPhone)) {
      setError('Please enter a valid phone number (minimum 10 digits)');
      return;
    }
    
    try {
      setPartySubmitting(true);
      setError(null);
      
      const response = await createPartyBooking({
        customer_name: customerName,
        customer_phone: customerPhone,
        booking_date: selectedDate,
        start_time: selectedTime,
        hours: partyHours,
      });
      
      setBookingId(response.booking_id);
      setShowSuccessModal(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setPartySubmitting(false);
    }
  };

  // Quest Pass Subscribe Handler
  const handleQuestPassSubscribe = async () => {
    if (!questPassGame.trim()) {
      setError('Please select a game for your Quest Pass');
      return;
    }
    
    try {
      setQuestPassSubmitting(true);
      setError(null);
      
      const response = await subscribeQuestPass(questPassGame);
      if (response.success) {
        setShowQuestPassModal(false);
        setQuestPassGame('');
        // Refresh quest pass status
        const questResponse = await getQuestPassStatus();
        if (questResponse.success) {
          setQuestPass(questResponse);
        }
        setSuccess(response.message);
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setQuestPassSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!isValidName(customerName)) {
      setError('Please enter a valid name (minimum 2 characters)');
      return;
    }
    
    if (!isValidPhone(customerPhone)) {
      setError('Please enter a valid phone number (minimum 10 digits)');
      return;
    }
    
    if (ps5Bookings.length === 0 && !drivingSim) {
      setError('Please select at least one device');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Create separate bookings for each device (since they may have different durations)
      const allBookings = [];
      
      // Add PS5 bookings
      for (const ps5 of ps5Bookings) {
        // Calculate price for this PS5
        const priceResponse = await calculatePrice([ps5], false, ps5.duration || 60);
        
        const bookingData = {
          customer_name: customerName,
          customer_phone: customerPhone,
          booking_date: selectedDate,
          start_time: selectedTime,
          duration_minutes: ps5.duration || 60,
          ps5_bookings: [ps5],
          driving_sim: false,
          driving_after_ps5: false,
          total_price: priceResponse.total_price,
          bonus_minutes: bonusMinutes,
          promo_code_id: promoCodeData?.id || null
        };
        allBookings.push(createBooking(bookingData));
      }
      
      // Add Driving Sim booking
      if (drivingSim) {
        // Calculate price for driving sim
        const priceResponse = await calculatePrice([], true, drivingSim.duration || 60);
        
        // Calculate adjusted start time if "Play After PS5" is enabled
        let drivingStartTime = selectedTime;
        
        if (drivingSim.afterPS5 && ps5Bookings.length > 0) {
          // Find the longest PS5 booking duration
          const maxPS5Duration = Math.max(...ps5Bookings.map(b => b.duration || 60));
          
          // Calculate the new start time by adding max PS5 duration to selected time
          const [hours, minutes] = selectedTime.split(':').map(Number);
          const totalMinutes = hours * 60 + minutes + maxPS5Duration;
          const newHours = Math.floor(totalMinutes / 60);
          const newMinutes = totalMinutes % 60;
          drivingStartTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
        }
        
        const bookingData = {
          customer_name: customerName,
          customer_phone: customerPhone,
          booking_date: selectedDate,
          start_time: drivingStartTime,
          duration_minutes: drivingSim.duration || 60,
          ps5_bookings: [],
          driving_sim: true,
          driving_after_ps5: drivingSim.afterPS5 && ps5Bookings.length > 0,
          total_price: priceResponse.total_price,
          bonus_minutes: bonusMinutes,
          promo_code_id: promoCodeData?.id || null
        };
        allBookings.push(createBooking(bookingData));
      }
      
      const responses = await Promise.all(allBookings);
      setBookingId(responses[0].booking_id); // Show first booking ID
      setShowSuccessModal(true);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate('/');
  };

  // Animation Variants
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  return (
    <div className="booking-page">
      <Navbar variant="light" />
      
      {/* Animated Background */}
      <div className="booking-bg-effects">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
        <div className="bg-grid"></div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div 
            className="booking-success-overlay" 
            onClick={handleSuccessClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="booking-success-modal" 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.85, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 40 }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
            >
              {/* Decorative top gradient bar */}
              <div className="booking-success-topbar"></div>
              
              {/* Animated checkmark */}
              <div className="booking-success-icon-wrap">
                <motion.div 
                  className="booking-success-icon"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2, damping: 12, stiffness: 200 }}
                >
                  <FiCheck className="booking-success-check" />
                </motion.div>
                <motion.div 
                  className="booking-success-ring ring-1"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
                />
                <motion.div 
                  className="booking-success-ring ring-2"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 1.4, delay: 0.6, ease: "easeOut" }}
                />
              </div>
              
              <motion.h2 
                className="booking-success-heading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Booking Confirmed!
              </motion.h2>
              <motion.p 
                className="booking-success-sub"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Get ready for an epic gaming session 🎮
              </motion.p>
              
              <motion.div 
                className="booking-success-card"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="booking-success-id-row">
                  <span className="booking-success-id-label">Booking ID</span>
                  <span className="booking-success-id-value">#{bookingId}</span>
                </div>
                
                <div className="booking-success-divider"></div>
                
                <div className="booking-success-info-grid">
                  <div className="booking-success-info-item">
                    <FiCalendar className="booking-success-info-icon" />
                    <div>
                      <span className="booking-success-info-label">Date</span>
                      <span className="booking-success-info-value">{selectedDate ? formatDate(selectedDate) : selectedDate}</span>
                    </div>
                  </div>
                  <div className="booking-success-info-item">
                    <FiClock className="booking-success-info-icon" />
                    <div>
                      <span className="booking-success-info-label">Time</span>
                      <span className="booking-success-info-value">{formatTime12Hour(selectedTime)}</span>
                    </div>
                  </div>
                </div>

                {/* Devices summary */}
                {(ps5Bookings.length > 0 || drivingSim) && (
                  <>
                    <div className="booking-success-divider"></div>
                    <div className="booking-success-devices">
                      {ps5Bookings.map((ps5, idx) => (
                        <div key={idx} className="booking-success-device">
                          <FiMonitor className="booking-success-device-icon" />
                          <span>PS5 Unit {ps5.device_number}</span>
                          <span className="booking-success-device-detail">{ps5.player_count} player{ps5.player_count > 1 ? 's' : ''} · {formatDuration(ps5.duration || 60)}</span>
                        </div>
                      ))}
                      {drivingSim && (
                        <div className="booking-success-device">
                          <FiCpu className="booking-success-device-icon" />
                          <span>Driving Simulator</span>
                          <span className="booking-success-device-detail">{formatDuration(drivingSim.duration || 60)}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
                
                <div className="booking-success-divider"></div>
                
                <div className="booking-success-total-row">
                  <span className="booking-success-total-label">Total Amount</span>
                  <span className="booking-success-total-value">{formatPrice(price)}</span>
                </div>

                {bonusMinutes > 0 && (
                  <div className="booking-success-bonus">
                    <span className="booking-success-bonus-icon">🎁</span>
                    <span>+{bonusMinutes} minutes FREE bonus time!</span>
                  </div>
                )}
              </motion.div>
              
              <motion.p 
                className="booking-success-note"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                Pay at the counter when you arrive
              </motion.p>
              
              <motion.button 
                className="booking-success-btn" 
                onClick={handleSuccessClose}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <FiArrowLeft /> Back to Home
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="container booking-container">
        {/* Progress Steps */}
        <motion.div 
          className="steps-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={`step-item ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">
              {currentStep > 1 ? <FiCheck /> : '1'}
            </div>
            <div className="step-content">
              <span className="step-label">Schedule</span>
              <span className="step-desc">Pick date & time</span>
            </div>
          </div>
          
          <div className="step-connector">
            <div className="connector-line">
              <motion.div 
                className="connector-fill"
                initial={{ width: 0 }}
                animate={{ width: currentStep >= 2 ? '100%' : '0%' }}
                transition={{ duration: 0.5 }}
              ></motion.div>
            </div>
          </div>
          
          <div className={`step-item ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">
              {currentStep > 2 ? <FiCheck /> : '2'}
            </div>
            <div className="step-content">
              <span className="step-label">Equipment</span>
              <span className="step-desc">Select your gear</span>
            </div>
          </div>
          
          <div className="step-connector">
            <div className="connector-line">
              <motion.div 
                className="connector-fill"
                initial={{ width: 0 }}
                animate={{ width: currentStep >= 3 ? '100%' : '0%' }}
                transition={{ duration: 0.5 }}
              ></motion.div>
            </div>
          </div>
          
          <div className={`step-item ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-content">
              <span className="step-label">Confirm</span>
              <span className="step-desc">Complete booking</span>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Date and Time Selection */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              className="booking-card"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="card-header">
                <div className="card-icon">
                  <FiCalendar />
                </div>
                <div className="card-header-content">
                  <h2 className="card-title">Choose Your Schedule</h2>
                  <p className="card-subtitle">Select your preferred date and time slot</p>
                </div>
                <div className="header-date-picker">
                  <ModernDatePicker 
                    selectedDate={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    minDate={getToday()}
                  />
                </div>
              </div>
              
              {error && (
                <motion.div 
                  className="alert alert-error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span className="alert-icon">⚠️</span>
                  <span>{error}</span>
                </motion.div>
              )}
              
              {/* Booking Type Toggle */}
              <div className="booking-type-toggle">
                <button 
                  className={`booking-type-btn ${bookingType === 'regular' ? 'active' : ''}`}
                  onClick={() => setBookingType('regular')}
                >
                  <FiMonitor className="type-btn-icon" />
                  <div className="type-btn-content">
                    <span className="type-btn-title">Regular Booking</span>
                    <span className="type-btn-desc">Book individual consoles</span>
                  </div>
                </button>
                <button 
                  className={`booking-type-btn party ${bookingType === 'party' ? 'active' : ''}`}
                  onClick={() => setBookingType('party')}
                >
                  <FiZap className="type-btn-icon" />
                  <div className="type-btn-content">
                    <span className="type-btn-title">🎉 Party / Full Book</span>
                    <span className="type-btn-desc">Book entire shop • ₹600/hr</span>
                  </div>
                </button>
              </div>

              {/* Party Hours Selector (only in party mode) */}
              {bookingType === 'party' && (
                <motion.div 
                  className="party-config-section"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="party-info-banner">
                    <div className="party-info-icon">🎉</div>
                    <div className="party-info-text">
                      <h4>Full Shop Party Booking</h4>
                      <p>Get all 3 PS5 units + Racing Simulator for your exclusive event!</p>
                    </div>
                  </div>
                  
                  <div className="party-hours-selector">
                    <label className="party-hours-label">
                      <FiClock className="party-label-icon" />
                      How many hours?
                    </label>
                    <div className="party-hours-buttons">
                      {[1, 2, 3].map(h => (
                        <button
                          key={h}
                          className={`party-hour-btn ${partyHours === h ? 'active' : ''}`}
                          onClick={() => setPartyHours(h)}
                        >
                          <span className="party-hour-value">{h}</span>
                          <span className="party-hour-unit">hour{h > 1 ? 's' : ''}</span>
                          <span className="party-hour-price">₹{h * 600}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="party-includes">
                    <span className="party-includes-label">Includes:</span>
                    <div className="party-includes-list">
                      <span className="party-include-item">🎮 PS5 Unit 1</span>
                      <span className="party-include-item">🎮 PS5 Unit 2</span>
                      <span className="party-include-item">🎮 PS5 Unit 3</span>
                      <span className="party-include-item">🏎️ Racing Simulator</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Quest Pass Section - Only for logged-in users */}
              {isLoggedIn && bookingType === 'regular' && (
                <div className="story-mode-section">
                  <div className="story-mode-card" onClick={() => {
                    if (!questPass?.has_active && !questPass?.has_pending) {
                      setShowQuestPassModal(true);
                    }
                  }}>
                    <div className="story-mode-header">
                      <div className="story-mode-icon">🏆</div>
                      <div>
                        <h3 className="story-mode-title">Quest Pass</h3>
                        <p className="story-mode-subtitle">Your Story, Your Console — Save & Resume</p>
                      </div>
                    </div>
                    <div className="story-mode-features">
                      <span className="story-feature-tag">🎮 Dedicated PS5</span>
                      <span className="story-feature-tag">💾 Progress Saved</span>
                      <span className="story-feature-tag">⚡ ₹50/hr Play Rate</span>
                      <span className="story-feature-tag">📅 30 Days</span>
                    </div>
                    <div className="story-mode-pricing">
                      <div className="story-price-main">
                        <span className="story-price-value">₹500</span>
                        <span className="story-price-period">per month</span>
                      </div>
                      <div className="story-play-rate">
                        <FiZap />
                        <span>Play at ₹50/hr</span>
                      </div>
                    </div>
                    {questPass?.has_active && (
                      <div className="story-mode-status active">
                        ✅ Active — PS5-{questPass.active_pass?.device_number} • {questPass.active_pass?.game_name} • {questPass.active_pass?.days_remaining} days left
                      </div>
                    )}
                    {questPass?.has_pending && !questPass?.has_active && (
                      <div className="story-mode-status pending">
                        ⏳ Pending Approval — {questPass.pending_pass?.game_name}
                      </div>
                    )}
                    {!questPass?.has_active && !questPass?.has_pending && (
                      <div className="story-mode-status none">
                        Tap to subscribe → Get your own console & save progress
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quest Pass Subscribe Modal */}
              <AnimatePresence>
                {showQuestPassModal && (
                  <motion.div
                    className="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowQuestPassModal(false)}
                  >
                    <motion.div
                      className="booking-card"
                      style={{ maxWidth: '480px', margin: '2rem auto', position: 'relative', zIndex: 1001 }}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="card-header">
                        <div className="card-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                          <FiAward />
                        </div>
                        <div className="card-header-content">
                          <h2 className="card-title">🏆 Subscribe to Quest Pass</h2>
                          <p className="card-subtitle">₹500/month • Play at ₹50/hr • Dedicated Console</p>
                        </div>
                        <button className="back-button" onClick={() => setShowQuestPassModal(false)} style={{ marginLeft: 'auto' }}>
                          <FiX />
                        </button>
                      </div>

                      <div style={{ padding: '0 1.5rem 1.5rem' }}>
                        <div className="party-info-banner" style={{ borderColor: 'rgba(139, 92, 246, 0.2)', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(79, 70, 229, 0.04))' }}>
                          <div className="party-info-icon">🎮</div>
                          <div className="party-info-text">
                            <h4 style={{ color: '#6d28d9' }}>How Quest Pass Works</h4>
                            <p>Choose a story-mode game → Admin assigns you a dedicated PS5 → Your save data is exclusively yours. Resume your adventure anytime!</p>
                          </div>
                        </div>

                        <div className="form-group-v2" style={{ marginBottom: '1rem' }}>
                          <label className="form-label-v2" style={{ color: '#6d28d9', fontWeight: 700 }}>Choose Your Game</label>
                          <div className="input-wrapper-v2">
                            <FiStar className="input-icon-v2" style={{ color: '#8b5cf6' }} />
                            <select
                              className="form-input-v2"
                              value={questPassGame}
                              onChange={(e) => setQuestPassGame(e.target.value)}
                              style={{ cursor: 'pointer' }}
                            >
                              <option value="">Select a game...</option>
                              {allGames.filter(g => g.game_type === 'ps5').map(g => (
                                <option key={g.id} value={g.name}>{g.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="story-mode-features" style={{ marginBottom: '1rem' }}>
                          <span className="story-feature-tag">🎮 Dedicated PS5 assigned</span>
                          <span className="story-feature-tag">💾 Save data preserved</span>
                          <span className="story-feature-tag">⚡ ₹50/hr play rate</span>
                          <span className="story-feature-tag">📅 30-day access</span>
                          <span className="story-feature-tag">🔄 Resume anytime</span>
                        </div>

                        <button 
                          className="submit-btn-v2"
                          style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', width: '100%' }}
                          onClick={handleQuestPassSubscribe}
                          disabled={questPassSubmitting || !questPassGame}
                        >
                          {questPassSubmitting ? 'Submitting...' : `🏆 Request Quest Pass — ₹500/month`}
                          {!questPassSubmitting && <FiCheck />}
                        </button>

                        <p className="payment-note-v2" style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                          <FiCheckCircle style={{ verticalAlign: 'middle', marginRight: 6 }} />
                          Pay ₹500 at the shop after admin approval
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="step-content-wrapper">
                {/* Time Slots */}
                <div className="time-section-full">
                  <div className="time-slots-header">
                    <div className="header-left">
                      <div className="header-icon">
                        <FiClock />
                      </div>
                      <div className="header-text">
                        <h3 className="header-title">Available Time Slots</h3>
                        <p className="header-subtitle">Select your preferred gaming time</p>
                      </div>
                    </div>
                    <div className="slot-status-legend">
                      <div className="legend-item">
                        <span className="status-dot status-available"></span>
                        <span className="status-label">Available</span>
                      </div>
                      <div className="legend-item">
                        <span className="status-dot status-partial"></span>
                        <span className="status-label">Partial</span>
                      </div>
                      <div className="legend-item">
                        <span className="status-dot status-full"></span>
                        <span className="status-label">Full</span>
                      </div>
                    </div>
                  </div>
                  {loading ? (
                    <div className="loading-container">
                      <div className="loader">
                        <div className="loader-ring"></div>
                        <div className="loader-ring"></div>
                        <div className="loader-ring"></div>
                      </div>
                      <p className="loading-text">Finding available slots...</p>
                    </div>
                  ) : (
                    <div className="time-slots-scroll-wrapper">
                      <motion.div 
                        className="time-slots-grid compact-horizontal"
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                      >
                        {slots.map((slot, index) => (
                          <motion.button
                            key={slot.time}
                            variants={fadeInUp}
                            className={`time-slot ${slot.status} ${selectedTime === slot.time ? 'selected' : ''}`}
                            onClick={() => handleTimeSelect(slot.time, slot.status)}
                            disabled={slot.status === 'full'}
                            whileHover={slot.status !== 'full' ? { scale: 1.04 } : {}}
                            whileTap={slot.status !== 'full' ? { scale: 0.97 } : {}}
                          >
                            <span className="slot-time">{formatTime12Hour(slot.time)}</span>
                            {slot.status === 'partial' && slot.total_ps5_players > 0 && (
                              <span className="slot-capacity">
                                <FiUsers className="capacity-icon" />
                                {slot.total_ps5_players}/10
                              </span>
                            )}
                            {selectedTime === slot.time && (
                              <motion.div 
                                className="slot-selected-indicator"
                                layoutId="timeIndicator"
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              />
                            )}
                          </motion.button>
                        ))}
                      </motion.div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          
          {/* STEP 2 - PARTY MODE: Confirmation */}
          {currentStep === 2 && bookingType === 'party' && (
            <motion.div
              key="step2-party"
              className="booking-card step2-card party-step2"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="card-header with-back">
                <button className="back-button" onClick={() => setCurrentStep(1)}>
                  <FiArrowLeft />
                </button>
                <div className="card-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
                  <FiZap />
                </div>
                <div className="card-header-content">
                  <h2 className="card-title">🎉 Party Booking Confirmation</h2>
                  <p className="card-subtitle">Book the entire shop for your exclusive event</p>
                </div>
              </div>

              {error && (
                <motion.div 
                  className="alert alert-error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span className="alert-icon">⚠️</span>
                  <span>{error}</span>
                </motion.div>
              )}

              <div className="party-booking-layout">
                {/* Party Summary */}
                <div className="party-summary-card">
                  <h3 className="party-summary-title">🎉 Party Package</h3>
                  
                  <div className="party-summary-details">
                    <div className="party-detail-row">
                      <FiCalendar className="party-detail-icon" />
                      <span className="party-detail-label">Date</span>
                      <span className="party-detail-value">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="party-detail-row">
                      <FiClock className="party-detail-icon" />
                      <span className="party-detail-label">Time</span>
                      <span className="party-detail-value">{formatTime12Hour(selectedTime)} — {(() => {
                        const [h, m] = selectedTime.split(':').map(Number);
                        const endMin = h * 60 + m + (partyHours * 60);
                        return formatTime12Hour(`${String(Math.floor(endMin / 60) % 24).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`);
                      })()}</span>
                    </div>
                    <div className="party-detail-row">
                      <FiClock className="party-detail-icon" />
                      <span className="party-detail-label">Duration</span>
                      <span className="party-detail-value">{partyHours} hour{partyHours > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  
                  <div className="party-devices-grid">
                    <div className="party-device-chip"><FiMonitor /> PS5 Unit 1</div>
                    <div className="party-device-chip"><FiMonitor /> PS5 Unit 2</div>
                    <div className="party-device-chip"><FiMonitor /> PS5 Unit 3</div>
                    <div className="party-device-chip driving"><FiCpu /> Racing Sim</div>
                  </div>
                  
                  <div className="party-price-box">
                    <span className="party-price-label">Total Price</span>
                    <span className="party-price-amount">₹{partyHours * 600}</span>
                    <span className="party-price-breakdown">₹600 × {partyHours} hour{partyHours > 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Customer Form */}
                <div className="party-form-section">
                  <form onSubmit={handlePartySubmit}>
                    {isLoggedIn && user ? (
                      <div className="user-profile-card">
                        <div className="profile-avatar"><FiUser /></div>
                        <div className="profile-info">
                          <span className="profile-greeting">Welcome back,</span>
                          <span className="profile-name">{user.name}</span>
                        </div>
                        <div className="profile-verified">
                          <FiCheckCircle />
                          <span>Verified</span>
                        </div>
                      </div>
                    ) : (
                      <h3 className="form-title-v2">Enter Your Details</h3>
                    )}
                    
                    <div className="form-section-v2">
                      <div className="form-group-v2">
                        <label htmlFor="partyName" className="form-label-v2">Full Name</label>
                        <div className="input-wrapper-v2">
                          <FiUser className="input-icon-v2" />
                          <input
                            id="partyName"
                            type="text"
                            className={`form-input-v2 ${isLoggedIn ? 'filled' : ''}`}
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            required
                            placeholder="e.g., John Doe"
                          />
                        </div>
                      </div>
                      
                      <div className="form-group-v2">
                        <label htmlFor="partyPhone" className="form-label-v2">Phone Number</label>
                        <div className="input-wrapper-v2">
                          <FiPhone className="input-icon-v2" />
                          <input
                            id="partyPhone"
                            type="tel"
                            className={`form-input-v2 ${isLoggedIn ? 'filled' : ''}`}
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            required
                            placeholder="e.g., 9876543210"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      type="submit"
                      className="submit-btn-v2 party-submit-btn"
                      disabled={partySubmitting}
                    >
                      {partySubmitting ? 'Booking...' : `🎉 Confirm Party Booking — ₹${partyHours * 600}`}
                      {!partySubmitting && <FiCheck />}
                    </button>
                    
                    <p className="payment-note-v2" style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                      <FiCheckCircle style={{ verticalAlign: 'middle', marginRight: 6 }} />
                      No payment required now — pay at venue
                    </p>
                  </form>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Game & Device Selection - Redesigned */}
          {currentStep === 2 && bookingType === 'regular' && (
            <motion.div
              key="step2"
              className="booking-card step2-card"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {/* Step 2 Header */}
              <div className="card-header with-back">
                <button className="back-button" onClick={() => setCurrentStep(1)}>
                  <FiArrowLeft />
                </button>
                <div className="card-icon">
                  <FiMonitor />
                </div>
                <div className="card-header-content">
                  <h2 className="card-title">Choose Your Experience</h2>
                  <p className="card-subtitle">Pick a game or select your gaming station</p>
                </div>
                <div className="header-session-info">
                  <div className="session-badge">
                    <FiCalendar className="badge-icon" />
                    <div className="badge-content">
                      <span className="badge-label">Date</span>
                      <span className="badge-value">{new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="session-badge">
                    <FiClock className="badge-icon" />
                    <div className="badge-content">
                      <span className="badge-label">Time</span>
                      <span className="badge-value">{formatTime12Hour(selectedTime)}</span>
                    </div>
                  </div>
                  <div className="session-badge">
                    <FiUsers className="badge-icon" />
                    <div className="badge-content">
                      <span className="badge-label">Capacity</span>
                      <span className={`badge-value ${totalPlayers + ps5Bookings.reduce((sum, b) => sum + b.player_count, 0) > 8 ? 'warning' : ''}`}>
                        {totalPlayers + ps5Bookings.reduce((sum, b) => sum + b.player_count, 0)}/10
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {error && (
                <motion.div 
                  className="alert alert-error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span className="alert-icon">⚠️</span>
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Quest Pass Active Banner */}
              {questPass?.has_active && (
                <div className="story-booking-info">
                  <span className="story-booking-badge">🏆 QUEST PASS</span>
                  <span className="story-booking-text">
                    Playing {questPass.active_pass?.game_name} on PS5-{questPass.active_pass?.device_number}
                  </span>
                  <span className="story-booking-rate">₹50/hr</span>
                </div>
              )}
              
              {loading ? (
                <div className="loading-container">
                  <div className="loader">
                    <div className="loader-ring"></div>
                    <div className="loader-ring"></div>
                    <div className="loader-ring"></div>
                  </div>
                  <p className="loading-text">Checking availability...</p>
                </div>
              ) : (
                <>
                  {/* Mode Toggle Tabs */}
                  <div className="selection-mode-tabs">
                    <button 
                      className={`mode-tab ${selectionMode === 'game' ? 'active' : ''}`}
                      onClick={() => setSelectionMode('game')}
                    >
                      <FiGrid className="mode-tab-icon" />
                      <span>Browse by Game</span>
                    </button>
                    <button 
                      className={`mode-tab ${selectionMode === 'device' ? 'active' : ''}`}
                      onClick={() => setSelectionMode('device')}
                    >
                      <FiMonitor className="mode-tab-icon" />
                      <span>Choose by Console</span>
                    </button>
                  </div>

                  {/* Availability Warning */}
                  {(availablePS5Units.length < 3 || !availableDriving) && (
                    <motion.div 
                      className="alert alert-warning"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <span className="alert-icon">⚡</span>
                      <div>
                        <strong>Limited Availability</strong>
                        <p>
                          {availablePS5Units.length < 3 && `PS5 Units ${[1, 2, 3].filter(n => !availablePS5Units.includes(n)).join(', ')} already booked. `}
                          {!availableDriving && `Driving Simulator occupied.`}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <AnimatePresence mode="wait">
                    {/* ===== GAME-FIRST MODE ===== */}
                    {selectionMode === 'game' && (
                      <motion.div
                        key="game-mode"
                        className="game-selection-section"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Selected Games Banner */}
                        {selectedGames.length > 0 && (
                          <motion.div 
                            className="selected-game-banner"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          >
                            <div className="sgb-content">
                              <div className="sgb-games-list">
                                {selectedGames.map(game => (
                                  <div key={game.id} className="sgb-game-item">
                                    <div className="sgb-game-icon">
                                      {getGameCover(game.name).img ? (
                                        <img src={getGameCover(game.name).img} alt={game.name} className="sgb-cover-img" />
                                      ) : (
                                        <span>{getGameCover(game.name).emoji}</span>
                                      )}
                                    </div>
                                    <div className="sgb-info">
                                      <span className="sgb-name">{game.name}</span>
                                      <span className="sgb-meta">
                                        {game.genre} • {game.max_players}P
                                      </span>
                                    </div>
                                    <button className="sgb-remove-game" onClick={() => handleGameSelect(game)} title="Remove game">
                                      <FiX />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <div className="sgb-actions">
                                <span className="sgb-count">{selectedGames.length} game{selectedGames.length > 1 ? 's' : ''} selected</span>
                                <button className="sgb-change" onClick={() => { setSelectedGames([]); setPs5Bookings([]); }}>
                                  <FiX /> Clear All
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Console Conflict Warning */}
                        {consoleConflictWarning && (
                          <motion.div 
                            className="alert alert-warning console-conflict-warning"
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          >
                            <span className="alert-icon">🎮</span>
                            <div>
                              <strong>Console Conflict</strong>
                              <p>{consoleConflictWarning}</p>
                            </div>
                          </motion.div>
                        )}

                        {/* Game Search & Filter - Always visible for multi-select */}
                        <div className="game-browser">
                            <div className="game-browser-header">
                              <h3 className="section-title">
                                <FiStar className="section-icon" />
                                <span>What do you want to play?</span>
                              </h3>
                              <div className="game-search-box">
                                <FiSearch className="search-icon" />
                                <input
                                  type="text"
                                  placeholder="Search games..."
                                  value={gameSearchQuery}
                                  onChange={(e) => setGameSearchQuery(e.target.value)}
                                  className="game-search-input"
                                />
                                {gameSearchQuery && (
                                  <button className="search-clear" onClick={() => setGameSearchQuery('')}>
                                    <FiX />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Genre Filter Pills */}
                            <div className="genre-filter-scroll">
                              <div className="genre-filter-pills">
                                {gameGenres.map(genre => (
                                  <button
                                    key={genre}
                                    className={`genre-pill ${activeGenreFilter === genre ? 'active' : ''}`}
                                    onClick={() => setActiveGenreFilter(genre)}
                                  >
                                    {genre}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Games Grid */}
                            {gamesLoading ? (
                              <div className="loading-container" style={{ padding: '30px' }}>
                                <div className="loader"><div className="loader-ring"></div><div className="loader-ring"></div></div>
                                <p className="loading-text">Loading games...</p>
                              </div>
                            ) : (
                              <motion.div 
                                className="games-grid"
                                variants={staggerContainer}
                                initial="initial"
                                animate="animate"
                              >
                                {filteredGames.map((game) => {
                                  const isDrivingSim = game.device_type === 'driving_sim' || ((game.ps5_numbers || []).every(n => n === 4));
                                  const ps5Units = (game.ps5_numbers || []).filter(n => n !== 4);
                                  const hasDrivingSimUnit = (game.ps5_numbers || []).includes(4);
                                  const gameAvailablePS5Units = ps5Units.filter(n => availablePS5Units.includes(n));
                                  const isGameAvailable = isDrivingSim ? availableDriving : (gameAvailablePS5Units.length > 0 || (hasDrivingSimUnit && availableDriving));
                                  const cover = getGameCover(game.name);
                                  
                                  return (
                                    <motion.div
                                      key={game.id}
                                      variants={fadeInUp}
                                      className={`game-card ${!isGameAvailable ? 'game-unavailable' : ''} ${selectedGames.some(g => g.id === game.id) ? 'game-selected' : ''} ${isDrivingSim ? 'driving-sim-game' : ''}`}
                                      onClick={() => isGameAvailable && handleGameSelect(game)}
                                      whileHover={isGameAvailable ? { y: -6, scale: 1.02 } : {}}
                                      whileTap={isGameAvailable ? { scale: 0.98 } : {}}
                                    >
                                      <div className="game-card-visual">
                                        {cover.img ? (
                                          <img 
                                            src={cover.img} 
                                            alt={game.name} 
                                            className="game-card-cover-img"
                                            loading="lazy"
                                            onError={(e) => {
                                              e.target.style.display = 'none';
                                              e.target.nextSibling.style.display = 'flex';
                                            }}
                                          />
                                        ) : null}
                                        <div className="game-card-cover-fallback" style={{ display: cover.img ? 'none' : 'flex', background: `linear-gradient(135deg, ${cover.color}cc, ${cover.color}99)` }}>
                                          <span className="game-card-emoji">{cover.emoji}</span>
                                        </div>
                                        <div className="game-card-gradient"></div>
                                        {selectedGames.some(g => g.id === game.id) && (
                                          <div className="game-selected-badge">
                                            <FiCheck />
                                          </div>
                                        )}
                                        {isDrivingSim && (
                                          <div className="game-device-badge driving-sim-badge">
                                            <FiCpu style={{ fontSize: '0.6rem' }} /> Sim
                                          </div>
                                        )}
                                        <button
                                          className="game-info-btn"
                                          onClick={(e) => { e.stopPropagation(); setGameInfoModal(game); }}
                                          title="Game details"
                                        >
                                          <FiInfo />
                                        </button>
                                        {!isGameAvailable && (
                                          <div className="game-unavail-overlay">
                                            <span>Unavailable</span>
                                          </div>
                                        )}
                                        {/* Title overlay on image */}
                                        <div className="game-card-title-overlay">
                                          <h4 className="game-card-name">{game.name}</h4>
                                        </div>
                                        {/* Hover-reveal details - inside card visual as overlay */}
                                        <div className="game-card-details">
                                          <h4 className="game-card-detail-name">{game.name}</h4>
                                          <div className="game-card-meta">
                                            <span className="game-genre-tag">{game.genre}</span>
                                            <span className="game-players-tag">
                                              <FiUsers className="tag-icon" />
                                              {game.max_players}P
                                            </span>
                                          </div>
                                          <div className="game-card-units">
                                            {(game.ps5_numbers || []).map(n => (
                                              <span 
                                                key={n} 
                                                className={`unit-chip ${n === 4 ? (availableDriving ? 'available' : 'booked') : (availablePS5Units.includes(n) ? 'available' : 'booked')} ${n === 4 ? 'driving-chip' : ''}`}
                                              >
                                                {n === 4 ? 'Sim' : `PS5-${n}`}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                                {filteredGames.length === 0 && (
                                  <div className="no-games-found">
                                    <span className="no-games-emoji">🔍</span>
                                    <p>No games found matching your search</p>
                                    <button className="reset-filters-btn" onClick={() => { setGameSearchQuery(''); setActiveGenreFilter('All'); }}>
                                      Reset Filters
                                    </button>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </div>

                        {/* PS5 Unit Selection (shown after games are picked) */}
                        {selectedGames.length > 0 && (
                          <motion.div 
                            className="post-game-device-select"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                          >
                            <h3 className="section-title">
                              <FiMonitor className="section-icon" />
                              <span>Configure Your Session</span>
                            </h3>
                            
                            <div className="recommended-units-grid">
                              {[1, 2, 3].map((unitNumber) => {
                                const booking = ps5Bookings.find(b => b.device_number === unitNumber);
                                const isExpanded = expandedPS5 === unitNumber;
                                const isSelected = !!booking;
                                const isAvailable = availablePS5Units.includes(unitNumber);
                                // Check if ANY selected game is on this unit
                                const hasGame = selectedGames.some(g => (g.ps5_numbers || []).includes(unitNumber));
                                const isRecommended = hasGame && isAvailable;
                                
                                if (!hasGame) return null;
                                
                                return (
                                  <motion.div 
                                    key={`ps5-game-${unitNumber}`}
                                    layout
                                    className={`device-card ${isSelected ? 'selected' : ''} ${!isAvailable ? 'unavailable' : ''} ${isExpanded ? 'expanded' : ''} ${isRecommended ? 'recommended' : ''}`}
                                    onClick={() => isAvailable && handlePS5CardClick(unitNumber)}
                                    whileHover={isAvailable ? { y: -4 } : {}}
                                  >
                                    {isRecommended && !isSelected && (
                                      <div className="recommended-tag">
                                        <FiZap /> Best Match
                                      </div>
                                    )}
                                    {!isAvailable && (
                                      <div className="unavailable-badge"><span>BOOKED</span></div>
                                    )}
                                    {isSelected && (
                                      <div className="selected-badge"><FiCheck /> Selected</div>
                                    )}
                                    
                                    <div className="device-header">
                                      <div className="device-icon-wrapper ps5">
                                        <FiMonitor className="device-icon" />
                                      </div>
                                      <div className="device-details">
                                        <h4 className="device-name">PlayStation 5</h4>
                                        <span className="device-unit">Unit {unitNumber}</span>
                                      </div>
                                      {isAvailable && (
                                        <div className={`expand-icon ${isExpanded ? 'rotated' : ''}`}>
                                          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" fill="none"/>
                                          </svg>
                                        </div>
                                      )}
                                    </div>

                                    {!isExpanded && isAvailable && (
                                      <div className="device-games-preview">
                                        {getGamesForUnit(unitNumber).slice(0, 3).map(g => (
                                          <span key={g.id} className={`mini-game-tag ${selectedGames.some(sg => sg.id === g.id) ? 'highlight' : ''}`}>
                                            {g.name}
                                          </span>
                                        ))}
                                        {getGamesForUnit(unitNumber).length > 3 && (
                                          <span className="mini-game-tag more">+{getGamesForUnit(unitNumber).length - 3} more</span>
                                        )}
                                      </div>
                                    )}
                                    
                                    <AnimatePresence>
                                      {isExpanded && isAvailable && (
                                        <motion.div 
                                          className="device-options"
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: 'auto' }}
                                          exit={{ opacity: 0, height: 0 }}
                                          transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <div className="option-group">
                                            <label className="option-label">
                                              <FiUsers className="option-icon" />
                                              Number of Players
                                            </label>
                                            <div className="player-buttons">
                                              {[0, 1, 2, 3].map((idx) => (
                                                <button
                                                  key={idx}
                                                  className={`player-btn ${booking && booking.player_count >= idx + 1 ? 'active' : ''}`}
                                                  onClick={() => handlePlayerSelect(unitNumber, idx)}
                                                >
                                                  {idx + 1}
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                          
                                          {booking && (
                                            <div className="option-group">
                                              <label className="option-label">
                                                <FiClock className="option-icon" />
                                                Session Duration
                                              </label>
                                              <div className="duration-buttons">
                                                {[30, 60, 90, 120].map(dur => (
                                                  <button
                                                    key={dur}
                                                    className={`duration-btn ${booking.duration === dur || (!booking.duration && dur === 60) ? 'active' : ''}`}
                                                    onClick={() => handlePS5DurationChange(unitNumber, dur)}
                                                  >
                                                    <span className="dur-value">{dur < 60 ? dur : dur / 60}</span>
                                                    <span className="dur-unit">{dur < 60 ? 'min' : dur === 60 ? 'hr' : 'hrs'}</span>
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                    {/* ===== DEVICE-FIRST MODE ===== */}
                    {selectionMode === 'device' && (
                      <motion.div
                        key="device-mode"
                        className="devices-section"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="devices-section-header">
                          <h3 className="section-title" style={{ display: 'flex', alignItems: 'center' }}>
                            <FiMonitor className="section-icon" />
                            <span>PlayStation 5 Consoles</span>
                          </h3>
                        </div>
                        
                        <div className="devices-grid">
                          {[1, 2, 3].map((unitNumber) => {
                            const booking = ps5Bookings.find(b => b.device_number === unitNumber);
                            const isExpanded = expandedPS5 === unitNumber;
                            const isSelected = !!booking;
                            const isAvailable = availablePS5Units.includes(unitNumber);
                            const unitGames = getGamesForUnit(unitNumber);
                            
                            return (
                              <motion.div 
                                key={`ps5-${unitNumber}`}
                                layout
                                className={`device-card ${isSelected ? 'selected' : ''} ${!isAvailable ? 'unavailable' : ''} ${isExpanded ? 'expanded' : ''}`}
                                onClick={() => isAvailable && handlePS5CardClick(unitNumber)}
                                whileHover={isAvailable ? { y: -4 } : {}}
                              >
                                {!isAvailable && (
                                  <div className="unavailable-badge"><span>BOOKED</span></div>
                                )}
                                {isSelected && (
                                  <div className="selected-badge"><FiCheck /> Selected</div>
                                )}
                                
                                <div className="device-header">
                                  <div className="device-icon-wrapper ps5">
                                    <FiMonitor className="device-icon" />
                                  </div>
                                  <div className="device-details">
                                    <h4 className="device-name">PlayStation 5</h4>
                                    <span className="device-unit">Unit {unitNumber}</span>
                                  </div>
                                  {isAvailable && (
                                    <div className={`expand-icon ${isExpanded ? 'rotated' : ''}`}>
                                      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                        <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" fill="none"/>
                                      </svg>
                                    </div>
                                  )}
                                </div>

                                {!isExpanded && isAvailable && unitGames.length > 0 && (
                                  <div className="device-games-preview">
                                    {unitGames.slice(0, 3).map(g => (
                                      <span key={g.id} className="mini-game-tag">{g.name}</span>
                                    ))}
                                    {unitGames.length > 3 && (
                                      <span className="mini-game-tag more">+{unitGames.length - 3} more</span>
                                    )}
                                  </div>
                                )}
                                
                                <AnimatePresence>
                                  {isExpanded && isAvailable && (
                                    <motion.div 
                                      className="device-options"
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {unitGames.length > 0 && (
                                        <div className="option-group">
                                          <label className="option-label">
                                            <FiStar className="option-icon" />
                                            Available Games
                                          </label>
                                          <div className="unit-games-list">
                                            {unitGames.map(g => (
                                              <div 
                                                key={g.id} 
                                                className={`unit-game-item ${booking?.game_preference === g.name ? 'chosen' : ''}`}
                                                onClick={() => {
                                                  if (booking) {
                                                    setPs5Bookings(ps5Bookings.map(b => 
                                                      b.device_number === unitNumber 
                                                        ? { ...b, game_preference: booking.game_preference === g.name ? null : g.name } 
                                                        : b
                                                    ));
                                                  }
                                                  // Add game to selection if not already selected
                                                  if (!selectedGames.some(sg => sg.id === g.id)) {
                                                    setSelectedGames([...selectedGames, g]);
                                                  }
                                                }}
                                              >
                                                {getGameCover(g.name).img ? (
                                                  <img src={getGameCover(g.name).img} alt={g.name} className="unit-game-thumb" />
                                                ) : (
                                                  <span className="unit-game-emoji">{getGameCover(g.name).emoji}</span>
                                                )}
                                                <span className="unit-game-name">{g.name}</span>
                                                <span className="unit-game-genre">{g.genre}</span>
                                                {g.rating && (
                                                  <span className="unit-game-rating">
                                                    <FiStar className="mini-star" /> {g.rating}
                                                  </span>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      <div className="option-group">
                                        <label className="option-label">
                                          <FiUsers className="option-icon" />
                                          Number of Players
                                        </label>
                                        <div className="player-buttons">
                                          {[0, 1, 2, 3].map((idx) => (
                                            <button
                                              key={idx}
                                              className={`player-btn ${booking && booking.player_count >= idx + 1 ? 'active' : ''}`}
                                              onClick={() => handlePlayerSelect(unitNumber, idx)}
                                            >
                                              {idx + 1}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                      
                                      {booking && (
                                        <div className="option-group">
                                          <label className="option-label">
                                            <FiClock className="option-icon" />
                                            Session Duration
                                          </label>
                                          <div className="duration-buttons">
                                            {[30, 60, 90, 120].map(dur => (
                                              <button
                                                key={dur}
                                                className={`duration-btn ${booking.duration === dur || (!booking.duration && dur === 60) ? 'active' : ''}`}
                                                onClick={() => handlePS5DurationChange(unitNumber, dur)}
                                              >
                                                <span className="dur-value">{dur < 60 ? dur : dur / 60}</span>
                                                <span className="dur-unit">{dur < 60 ? 'min' : dur === 60 ? 'hr' : 'hrs'}</span>
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Driving Simulator - Always visible */}
                  <div className="devices-section" style={{ marginTop: selectionMode === 'game' && selectedGames.length === 0 ? 0 : 8 }}>
                    <h3 className="section-title driving-title">
                      <FiCpu className="section-icon" />
                      Racing Simulator
                    </h3>
                    
                    <motion.div 
                      layout
                      className={`device-card driving-card ${drivingSim ? 'selected' : ''} ${!availableDriving ? 'unavailable' : ''}`}
                      onClick={() => availableDriving && handleDrivingSimToggle()}
                      whileHover={availableDriving ? { y: -4 } : {}}
                    >
                      {!availableDriving && (
                        <div className="unavailable-badge"><span>BOOKED</span></div>
                      )}
                      {drivingSim && (
                        <div className="selected-badge"><FiCheck /> Selected</div>
                      )}

                      <div className="device-header">
                        <div className="device-icon-wrapper driving">
                          <FiCpu className="device-icon" />
                        </div>
                        <div className="device-details">
                          <h4 className="device-name">Racing Simulator</h4>
                          <span className="device-unit">Pro Setup with Wheel & Pedals</span>
                        </div>
                        {availableDriving && drivingSim && (
                          <div className="check-indicator"><FiCheck /></div>
                        )}
                      </div>

                      {/* Driving Sim Games Preview */}
                      {!drivingSim && availableDriving && (
                        <div className="driving-sim-games-preview">
                          {allGames.filter(g => g.device_type === 'driving_sim' || (g.ps5_numbers || []).includes(4)).map(g => (
                            <div key={g.id} className="driving-sim-game-chip">
                              {getGameCover(g.name).img ? (
                                <img src={getGameCover(g.name).img} alt={g.name} className="driving-chip-thumb" />
                              ) : (
                                <span className="driving-chip-emoji">{getGameCover(g.name).emoji}</span>
                              )}
                              <span>{g.name}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <AnimatePresence>
                        {drivingSim && availableDriving && (
                          <motion.div 
                            className="device-options"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="option-group">
                              <label className="option-label">
                                <FiClock className="option-icon" />
                                Session Duration
                              </label>
                              <div className="duration-buttons">
                                {[30, 60, 90, 120].map(dur => (
                                  <button
                                    key={dur}
                                    className={`duration-btn ${drivingSim.duration === dur ? 'active' : ''}`}
                                    onClick={() => handleDrivingDurationChange(dur)}
                                  >
                                    <span className="dur-value">{dur < 60 ? dur : dur / 60}</span>
                                    <span className="dur-unit">{dur < 60 ? 'min' : dur === 60 ? 'hr' : 'hrs'}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {ps5Bookings.length > 0 && (
                              <div className="option-group after-ps5-option">
                                <label className="toggle-label">
                                  <input
                                    type="checkbox"
                                    checked={drivingSim.afterPS5 || false}
                                    onChange={(e) => handleDrivingAfterPS5Change(e.target.checked)}
                                  />
                                  <span className="toggle-switch"></span>
                                  <span className="toggle-text">Start after PS5 session ends</span>
                                </label>
                                {drivingSim.afterPS5 && (
                                  <p className="after-ps5-info">
                                    <FiClock className="info-icon-sm" />
                                    Starts at: {(() => {
                                      const maxPS5 = Math.max(...ps5Bookings.map(b => b.duration || 60));
                                      const [h, m] = selectedTime.split(':').map(Number);
                                      const total = h * 60 + m + maxPS5;
                                      return formatTime12Hour(`${String(Math.floor(total / 60) % 24).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`);
                                    })()}
                                  </p>
                                )}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>

                  {/* Fixed Price Footer */}
                  {(ps5Bookings.length > 0 || drivingSim) && (
                    <motion.div 
                        className="pf-fixed-footer"
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        <div className="pf-container">
                            <div className="pf-price-section">
                                <span className="pf-label">TOTAL</span>
                                <span className="pf-amount">
                                  {discountInfo ? (
                                    <span style={{ color: '#10b981' }}>{formatPrice(price)}</span> 
                                  ) : (
                                    formatPrice(price)
                                  )}
                                </span>
                            </div>
                            <button 
                                className="pf-next-btn"
                                onClick={() => setCurrentStep(3)}
                            >
                                <span>Review Booking</span>
                                <FiArrowRight />
                            </button>
                        </div>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          )}
          
          {/* STEP 3: Customer Details */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              className="booking-card checkout-card"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="card-header with-back">
                <button className="back-button" onClick={() => setCurrentStep(2)}>
                  <FiArrowLeft />
                </button>
                <div className="card-icon checkout-icon">
                  <FiUser />
                </div>
                <div className="card-header-content">
                  <h2 className="card-title">Review & Confirm</h2>
                  <p className="card-subtitle">Final step to lock in your gaming session</p>
                </div>
              </div>

              <div className="checkout-layout-v2">
                {/* Left Side: Form */}
                <motion.div 
                  className="checkout-form-v2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <form onSubmit={handleSubmit}>
                    {isLoggedIn && user ? (
                      <motion.div 
                        className="user-profile-card"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="profile-avatar">
                          <FiUser />
                        </div>
                        <div className="profile-info">
                          <span className="profile-greeting">Welcome back,</span>
                          <span className="profile-name">{user.name}</span>
                        </div>
                        <div className="profile-verified">
                          <FiCheckCircle />
                          <span>Verified</span>
                        </div>
                      </motion.div>
                    ) : (
                      <h3 className="form-title-v2">Enter Your Details</h3>
                    )}
                    
                    <div className="form-section-v2">
                      <div className="form-group-v2">
                        <label htmlFor="customerName" className="form-label-v2">Full Name</label>
                        <div className="input-wrapper-v2">
                          <FiUser className="input-icon-v2" />
                          <input
                            id="customerName"
                            type="text"
                            className={`form-input-v2 ${isLoggedIn ? 'filled' : ''}`}
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            required
                            placeholder="e.g., John Doe"
                          />
                        </div>
                      </div>
                      
                      <div className="form-group-v2">
                        <label htmlFor="customerPhone" className="form-label-v2">Phone Number</label>
                        <div className="input-wrapper-v2">
                           <FiPhone className="input-icon-v2" /> {/* Use Icon component instead of raw SVG for consistency */}
                          <input
                            id="customerPhone"
                            type="tel"
                            className={`form-input-v2 ${isLoggedIn ? 'filled' : ''}`}
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            required
                            placeholder="e.g., 9876543210"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Promo Code Section */}
                    <div className="form-section-v2 promo-code-section">
                      <h3 className="section-subtitle">Have a Promo Code?</h3>
                      <div className="promo-code-input-group">
                        <div className="form-group-v2" style={{ flex: 1 }}>
                          <div className="input-wrapper-v2">
                            <FiTag className="input-icon-v2" />
                            <input
                              id="promoCode"
                              type="text"
                              className="form-input-v2"
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                              placeholder="Enter promo code"
                              disabled={!!promoCodeData}
                            />
                          </div>
                        </div>
                        {!promoCodeData ? (
                          <button
                            type="button"
                            className="btn-apply-promo"
                            onClick={handleApplyPromoCode}
                            disabled={applyingPromoCode || !promoCode.trim()}
                          >
                            {applyingPromoCode ? 'Applying...' : 'Apply'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-remove-promo"
                            onClick={handleRemovePromoCode}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      
                      {promoCodeError && (
                        <div className="promo-code-error">
                          <span className="alert-icon">⚠️</span>
                          <span>{promoCodeError}</span>
                        </div>
                      )}
                      
                      {promoCodeSuccess && (
                        <div className="promo-code-success">
                          <FiCheck className="success-icon" />
                          <span>{promoCodeSuccess}</span>
                        </div>
                      )}
                    </div>
                    
                    {error && (
                      <motion.div 
                        className="alert alert-error form-error"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <span className="alert-icon">⚠️</span>
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </form>
                </motion.div>

                {/* Right Side: Summary */}
                <motion.div 
                  className="checkout-summary-v2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="summary-title-v2">Booking Summary</h3>
                  
                  <div className="summary-card-v2">
                    <div className="summary-section-v2">
                      <div className="summary-item-v2">
                        <FiCalendar className="summary-icon-v2" />
                        <div className="summary-details-v2">
                          <span className="summary-label-v2">Date</span>
                          <span className="summary-value-v2">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                      <div className="summary-item-v2">
                        <FiClock className="summary-icon-v2" />
                        <div className="summary-details-v2">
                          <span className="summary-label-v2">Time</span>
                          <span className="summary-value-v2">{formatTime12Hour(selectedTime)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="summary-divider-v2"></div>
                    
                    <div className="summary-section-v2">
                      <span className="section-title-v2">Selected Equipment</span>
                      {selectedGames.length > 0 && (
                        <div className="summary-game-badge">
                          <span className="summary-game-label">🎮 Game{selectedGames.length > 1 ? 's' : ''}:</span>
                          <span className="summary-game-name">{selectedGames.map(g => g.name).join(', ')}</span>
                        </div>
                      )}
                      <div className="items-list-v2">
                        {ps5Bookings.map((b) => (
                          <div key={b.device_number} className="item-row-v2">
                            <div className="item-icon-v2 ps5"><FiMonitor /></div>
                            <div className="item-details-v2">
                              <span className="item-name-v2">PS5 - Unit {b.device_number}</span>
                              <span className="item-meta-v2">
                                {b.player_count}P • {formatDuration(b.duration || 60)}
                                {b.game_preference && ` • ${b.game_preference}`}
                              </span>
                            </div>
                            <span className="item-price-v2">{formatPrice(calculatePS5Price(b))}</span>
                          </div>
                        ))}
                        
                        {drivingSim && (
                          <div className="item-row-v2">
                            <div className="item-icon-v2 driving"><FiCpu /></div>
                            <div className="item-details-v2">
                              <span className="item-name-v2">Racing Sim</span>
                              <span className="item-meta-v2">{formatDuration(drivingSim.duration || 60)}</span>
                            </div>
                            <span className="item-price-v2">{formatPrice(calculateDrivingPrice(drivingSim))}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="summary-divider-v2"></div>
                    
                    <div className="summary-total-v2">
                      {discountInfo ? (
                        <>
                          <div className="total-row-v2 subtotal">
                            <span className="total-label-v2">Subtotal</span>
                            <span className="subtotal-amount">{formatPrice(originalPrice)}</span>
                          </div>
                          <div className="total-row-v2 discount-row">
                            <span className="discount-label">
                              <FiTag className="discount-icon" />
                              {discountInfo.membership?.plan_type} ({discountInfo.percentage}% off)
                            </span>
                            <span className="discount-amount">-{formatPrice(discountInfo.amount)}</span>
                          </div>
                          <div className="total-row-v2 final-total">
                            <span className="total-label-v2">Total</span>
                            <span className="total-amount-v2">{formatPrice(price)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="total-row-v2">
                          <span className="total-label-v2">Total</span>
                          <span className="total-amount-v2">{formatPrice(price)}</span>
                        </div>
                      )}
                      <p className="payment-note-v2"><FiCheckCircle style={{verticalAlign: 'middle', marginRight: 6}} /> No payment required now</p>
                    </div>
                    
                    <button 
                         className="submit-btn-v2" 
                         disabled={loading}
                         onClick={(e) => {
                             // Find the form and submit it
                             const form = document.querySelector('form');
                             if(form) form.requestSubmit();
                         }}
                    >
                          {loading ? 'Processing...' : 'Confirm Booking'}
                          {!loading && <FiCheck />}
                    </button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Game Info Modal */}
      <AnimatePresence>
        {gameInfoModal && (
          <motion.div
            className="game-info-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setGameInfoModal(null)}
          >
            <motion.div
              className="game-info-modal"
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="game-info-modal-close" onClick={() => setGameInfoModal(null)}>
                <FiX />
              </button>
              <div className="game-info-modal-cover">
                {(() => {
                  const cover = getGameCover(gameInfoModal.name);
                  return cover.img ? (
                    <img src={cover.img} alt={gameInfoModal.name} className="game-info-modal-img" />
                  ) : (
                    <div className="game-info-modal-fallback" style={{ background: `linear-gradient(135deg, ${cover.color}cc, ${cover.color}99)` }}>
                      <span style={{ fontSize: '4rem' }}>{cover.emoji}</span>
                    </div>
                  );
                })()}
              </div>
              <div className="game-info-modal-content">
                <h2 className="game-info-modal-title">{gameInfoModal.name}</h2>
                <div className="game-info-modal-tags">
                  <span className="game-info-tag genre">{gameInfoModal.genre}</span>
                  <span className="game-info-tag year">{gameInfoModal.release_year}</span>
                  <span className="game-info-tag players">
                    <FiUsers style={{ fontSize: '0.75rem' }} />
                    {gameInfoModal.max_players} Player{gameInfoModal.max_players > 1 ? 's' : ''}
                  </span>
                  {gameInfoModal.rating && (
                    <span className="game-info-tag rating">
                      <FiStar style={{ fontSize: '0.75rem', color: '#f59e0b' }} />
                      {gameInfoModal.rating}
                    </span>
                  )}
                </div>
                <p className="game-info-modal-desc">{gameInfoModal.description}</p>
                <div className="game-info-modal-availability">
                  <h4>Available On</h4>
                  <div className="game-info-modal-units">
                    {(gameInfoModal.ps5_numbers || []).map(n => (
                      <span
                        key={n}
                        className={`game-info-unit ${n === 4 ? 'sim' : ''} ${n === 4 ? (availableDriving ? 'available' : 'booked') : (availablePS5Units.includes(n) ? 'available' : 'booked')}`}
                      >
                        <FiMonitor style={{ fontSize: '0.8rem' }} />
                        {n === 4 ? 'Driving Sim' : `PS5 Unit ${n}`}
                        <span className="unit-status-dot"></span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default BookingPage;
