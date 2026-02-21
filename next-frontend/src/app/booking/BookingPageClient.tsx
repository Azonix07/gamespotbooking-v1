'use client';
// @ts-nocheck

import { useRouter } from 'next/navigation';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiCalendar, FiClock, FiMonitor, FiUser, FiZap, FiUsers, FiCheck, FiTag, FiPhone, FiStar, FiSearch, FiX, FiGrid, FiList, FiInfo, FiRefreshCw } from 'react-icons/fi';
import { GiSteeringWheel } from 'react-icons/gi';
import { motion, AnimatePresence } from 'framer-motion';
import { getSlots, getSlotDetails, createBooking, calculatePrice, getMembershipStatus, getGames, createPartyBooking } from '@/services/api';
import { formatDate, getToday, formatDuration, formatPrice, formatTime12Hour, isValidName, isValidPhone, getISTTime } from '@/utils/helpers';
import { apiFetch } from '@/services/apiClient';
import ModernDatePicker from '@/components/ModernDatePicker';
import MobileDateCarousel from '@/components/MobileDateCarousel';
import '@/styles/BookingPage.css';

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

// ── Performance: stable motion variants at module scope (shared across renders) ──
const SLOT_HOVER = { scale: 1.05, y: -2 };
const SLOT_TAP = { scale: 0.96 };
const EMPTY_MOTION = {};

const BookingPage = () => {
  const router = useRouter();
  
  // State
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [slots, setSlots] = useState([]);
  const [dayClosedInfo, setDayClosedInfo] = useState(null); // { is_closed, reason }
  const [selectedTime, setSelectedTime] = useState(null);
  const [ps5Bookings, setPs5Bookings] = useState([]);
  const [drivingSim, setDrivingSim] = useState(null); // Changed to store { duration, afterPS5 }
  const [availablePS5Units, setAvailablePS5Units] = useState([]);
  const [availableDriving, setAvailableDriving] = useState(true);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [price, setPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [discountInfo, setDiscountInfo] = useState(null); // { percentage, amount, membership }
  const [hoursWarning, setHoursWarning] = useState(null); // hours warning message from pricing API
  const [loading, setLoading] = useState(false);
  const checkoutFormRef = useRef(null);
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
  const [selectionMode, setSelectionMode] = useState('device'); // 'game' or 'device' - start with console-first flow
  const [showGamePicker, setShowGamePicker] = useState(false); // For mobile game picker modal
  const [gameInfoModal, setGameInfoModal] = useState(null); // Game detail modal
  const [consoleConflictWarning, setConsoleConflictWarning] = useState(null); // Warning when games can't share a console

  // Party booking state
  const [bookingType, setBookingType] = useState('regular'); // 'regular' or 'party'
  const [partyHours, setPartyHours] = useState(1); // 1, 2, or 3 hours
  const [partySubmitting, setPartySubmitting] = useState(false);

  const [priceLoading, setPriceLoading] = useState(false);

  // Live clock tick — forces re-render every minute so past slots disappear in real time
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60_000); // tick every 60 s
    return () => clearInterval(id);
  }, []);

  // Refs for cancelling stale async operations
  const priceUpdateIdRef = useRef(0);
  const priceDebounceRef = useRef(null);

  // Check user session on component mount
  useEffect(() => {
    checkUserSession();
    loadGames();
  }, []);

  // Load slots when date changes
  useEffect(() => {
    loadSlots();
  }, [selectedDate]);

  // Stable serialized key for bookings — avoids re-triggering on same data with new references
  const bookingsKey = useMemo(() => {
    const ps5Key = ps5Bookings.map(b => `${b.device_number}:${b.player_count || 1}:${b.duration || 60}`).join('|');
    const drivingKey = drivingSim ? `ds:${drivingSim.duration || 60}:${drivingSim.afterPS5 || false}` : '';
    return `${ps5Key}__${drivingKey}`;
  }, [ps5Bookings, drivingSim]);

  // Check availability when device durations change (not on initial time select)
  useEffect(() => {
    if (selectedTime && currentStep === 2 && (ps5Bookings.length > 0 || drivingSim)) {
      checkAvailability();
    }
  }, [ps5Bookings.map(b => b.duration).join(','), drivingSim?.duration, drivingSim?.afterPS5]);

  // Calculate price when selections change — debounced to avoid racing API calls
  useEffect(() => {
    if (ps5Bookings.length > 0 || drivingSim) {
      // Clear any pending debounce
      if (priceDebounceRef.current) {
        clearTimeout(priceDebounceRef.current);
      }
      setPriceLoading(true);
      priceDebounceRef.current = setTimeout(() => {
        updatePrice();
      }, 80); // 80ms debounce — single API call is fast
    } else {
      setPrice(0);
      setOriginalPrice(0);
      setDiscountInfo(null);
      setHoursWarning(null);
      setPriceLoading(false);
    }
    return () => {
      if (priceDebounceRef.current) {
        clearTimeout(priceDebounceRef.current);
      }
    };
  }, [bookingsKey]);

  const loadSlots = async (isRetry = false) => {
    try {
      setLoading(true);
      if (!isRetry) setError(null);
      setDayClosedInfo(null);
      const response = await getSlots(selectedDate);
      setSlots(response?.slots || []);
      setError(null); // Clear error on success
      if (response?.is_closed) {
        setDayClosedInfo({ is_closed: true, reason: response.closure_reason || 'Shop closed for the day' });
      }
    } catch (err) {
      console.error('Failed to load slots:', err);
      setSlots([]); // Clear stale slots on error
      setError(err.message || 'Failed to load time slots. Please try again.');
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
        if (data?.user?.name) {
          setCustomerName(data.user.name);
        }
        if (data?.user?.phone) {
          setCustomerPhone(data.user.phone);
        }
        
        // Fetch membership status
        try {
          const membershipResponse = await getMembershipStatus();
          if (membershipResponse.success && membershipResponse.has_membership) {
            setMembership(membershipResponse.membership);
          }
        } catch (membershipErr) {
          // No active membership — continue as guest
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
      
      const ps5Response = await getSlotDetails(selectedDate, selectedTime, maxPS5Duration);
      
      setAvailablePS5Units(ps5Response?.available_ps5_units || []);
      setTotalPlayers(ps5Response?.total_ps5_players_booked || 0);
      
      // Reset PS5 selections if not available — only update state if bookings actually changed
      const validPS5 = ps5Bookings.filter(b => 
        (ps5Response?.available_ps5_units || []).includes(b.device_number)
      );
      // Compare by device numbers to avoid creating a new reference unnecessarily
      const currentDevices = ps5Bookings.map(b => b.device_number).sort().join(',');
      const validDevices = validPS5.map(b => b.device_number).sort().join(',');
      if (currentDevices !== validDevices) {
        setPs5Bookings(validPS5);
      }
      
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
        
        const drivingResponse = await getSlotDetails(selectedDate, drivingCheckTime, drivingDuration);
        
        setAvailableDriving(drivingResponse?.available_driving ?? true);
        
        if (!drivingResponse?.available_driving) {
          setDrivingSim(null);
          setError(`Driving Simulator is not available after your PS5 session (at ${drivingCheckTime})`);
        }
      } else {
        // "Play After PS5" is DISABLED or no PS5 selected - use availability at selected time
        setAvailableDriving(ps5Response?.available_driving ?? true);
        
        // Only reset driving sim if it was selected but is not available at selected time
        if (drivingSim && !ps5Response?.available_driving) {
          setDrivingSim(null);
          setError('Driving Simulator is not available at the selected time');
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const updatePrice = async () => {
    // Increment the update ID — any stale calls with older IDs will be ignored
    const updateId = ++priceUpdateIdRef.current;
    
    try {
      setPriceLoading(true);
      
      // SINGLE API call with ALL bookings — fast & accurate
      // Use the max PS5 duration as the main duration_minutes for membership hour calculation
      const maxDuration = ps5Bookings.length > 0
        ? Math.max(...ps5Bookings.map(b => b.duration || 60))
        : (drivingSim ? (drivingSim.duration || 60) : 60);
      
      const response = await calculatePrice(
        ps5Bookings,
        !!drivingSim,
        maxDuration
      );
      
      // Check if this is still the latest update
      if (updateId !== priceUpdateIdRef.current) return;
      
      setOriginalPrice(response?.original_price || response?.total_price || 0);
      setPrice(response?.total_price || 0);
      
      if (response?.has_discount && response?.membership) {
        setDiscountInfo({
          percentage: response?.discount_percentage,
          membership: response?.membership,
          amount: response?.discount_amount || ((response?.original_price || 0) - (response?.total_price || 0))
        });
      } else {
        setDiscountInfo(null);
      }
      
      setHoursWarning(response?.hours_warning ? response?.hours_warning_message : null);
    } catch (err) {
      if (updateId === priceUpdateIdRef.current) {
        console.error('Price calculation error:', err);
      }
    } finally {
      if (updateId === priceUpdateIdRef.current) {
        setPriceLoading(false);
      }
    }
  };

  // ── Actual price tables matching the backend exactly ──
  const PS5_PRICE_TABLE = {
    1: { 30: 70, 60: 130, 90: 170, 120: 210 },
    2: { 30: 90, 60: 150, 90: 200, 120: 240 },
    3: { 30: 90, 60: 150, 90: 200, 120: 240 },
    4: { 30: 150, 60: 210, 90: 270, 120: 300 }
  };
  const DRIVING_PRICE_TABLE = { 30: 100, 60: 170, 90: 200, 120: 200 };

  // Helper functions to calculate individual item prices (for display in summary)
  const calculatePS5Price = (ps5Booking) => {
    const duration = ps5Booking.duration || 60;
    const players = ps5Booking.player_count || 1;
    return (PS5_PRICE_TABLE[players] || PS5_PRICE_TABLE[1])[duration] || 0;
  };

  const calculateDrivingPrice = (drivingBooking) => {
    const duration = drivingBooking?.duration || 60;
    return DRIVING_PRICE_TABLE[duration] || 0;
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
        
        // Check if party would exceed midnight
        const partyStartMin = timeToMinutes(time);
        if (partyStartMin + partyDuration > CLOSING_MINUTES) {
          setError(`Party booking of ${partyHours} hour(s) starting at ${formatTime12Hour(time)} would go past midnight (12 AM). Please choose an earlier slot or shorter duration.`);
          setLoading(false);
          return;
        }
        
        const response = await getSlotDetails(selectedDate, time, partyDuration);
        
        // Party booking needs ALL devices free
        if ((response?.available_ps5_units?.length || 0) < 3 || !response?.available_driving) {
          setError('Not all devices are available for this time slot. Party booking requires the entire shop to be free.');
          setLoading(false);
          return;
        }
        
        setAvailablePS5Units(response?.available_ps5_units || []);
        setAvailableDriving(response?.available_driving ?? true);
        setTotalPlayers(response?.total_ps5_players_booked || 0);
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
      setAvailablePS5Units(response?.available_ps5_units || []);
      setAvailableDriving(response?.available_driving ?? true);
      setTotalPlayers(response?.total_ps5_players_booked || 0);
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
      // Default to 60 min, but clamp if close to midnight
      const allowed = getAllowedDurations(selectedTime);
      const defaultDur = allowed.includes(60) ? 60 : (allowed[0] || 30);
      setDrivingSim({ duration: defaultDur, afterPS5: false });
    }
  };
  
  const handleDrivingDurationChange = (duration) => {
    setDrivingSim({ ...drivingSim, duration: parseInt(duration) });
  };
  
  const handleDrivingAfterPS5Change = (afterPS5) => {
    if (afterPS5 && ps5Bookings.length > 0 && selectedTime) {
      // When enabling "after PS5", clamp driving duration to fit before midnight
      const maxPS5 = Math.max(...ps5Bookings.map(b => b.duration || 60));
      const [h, m] = selectedTime.split(':').map(Number);
      const drivingStartMin = h * 60 + m + maxPS5;
      const maxDrivingDur = CLOSING_MINUTES - drivingStartMin;
      const currentDur = drivingSim?.duration || 60;
      const clampedDur = currentDur <= maxDrivingDur ? currentDur : 
        [30, 60, 90, 120].filter(d => d <= maxDrivingDur).pop() || 30;
      if (maxDrivingDur < MIN_BOOKING_DURATION) {
        setError('Not enough time for Driving Sim after PS5 session — would exceed midnight (12 AM).');
        return;
      }
      setDrivingSim({ ...drivingSim, afterPS5, duration: clampedDur });
    } else {
      setDrivingSim({ ...drivingSim, afterPS5 });
    }
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
      
      // ── Closing-time validation: every booking must end by midnight ──
      const startMin = timeToMinutes(selectedTime);
      
      for (const ps5 of ps5Bookings) {
        const dur = ps5.duration || 60;
        if (startMin + dur > CLOSING_MINUTES) {
          setError(`PS5 booking would end after midnight (12 AM). Please choose a shorter duration or earlier time.`);
          setLoading(false);
          return;
        }
      }
      
      if (drivingSim) {
        let drivingStartMin = startMin;
        if (drivingSim.afterPS5 && ps5Bookings.length > 0) {
          const maxPS5 = Math.max(...ps5Bookings.map(b => b.duration || 60));
          drivingStartMin = startMin + maxPS5;
        }
        const drivingDur = drivingSim.duration || 60;
        if (drivingStartMin + drivingDur > CLOSING_MINUTES) {
          setError(`Driving Sim booking would end after midnight (12 AM). Please choose a shorter duration or earlier time.`);
          setLoading(false);
          return;
        }
      }
      
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
    router.push('/');
  };

  // ── Closing-time helpers ──
  const CLOSING_MINUTES = 24 * 60; // midnight = 1440
  const MIN_BOOKING_DURATION = 30;  // minimum 30-min booking

  /** Minutes from midnight for a HH:MM time string */
  const timeToMinutes = useCallback((time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }, []);

  /** Max bookable duration (in minutes) for a given start-time slot */
  const getMaxDuration = useCallback((time) => {
    return CLOSING_MINUTES - timeToMinutes(time);
  }, [timeToMinutes]);

  /** Is this slot past (for today only)? Uses IST (Kerala time) */
  const isSlotPast = useCallback((time) => {
    if (selectedDate !== getToday()) return false;
    // nowTick is listed as a dep so the callback refreshes every minute
    // Use IST time so it works correctly for users in any timezone
    const ist = getISTTime();
    const nowMinutes = ist.hours * 60 + ist.minutes;
    return timeToMinutes(time) <= nowMinutes;
  }, [selectedDate, timeToMinutes, nowTick]);

  // If the currently selected time slot becomes past, clear the selection
  useEffect(() => {
    if (selectedTime && isSlotPast(selectedTime)) {
      setSelectedTime(null);
      setPs5Bookings([]);
      setDrivingSim(null);
      if (currentStep > 1) setCurrentStep(1);
    }
  }, [nowTick, selectedTime, isSlotPast, currentStep]);

  /** Can't book this slot — either past, closed, or less than 30 min until midnight */
  const isSlotDisabled = useCallback((slot) => {
    if (slot.status === 'full') return true;
    if (slot.status === 'closed') return true;
    if (isSlotPast(slot.time)) return true;
    if (getMaxDuration(slot.time) < MIN_BOOKING_DURATION) return true;
    return false;
  }, [isSlotPast, getMaxDuration]);

  /** Allowed durations for a given start time (30/60/90/120 that fit before midnight) */
  const getAllowedDurations = useCallback((time) => {
    const maxDur = getMaxDuration(time);
    return [30, 60, 90, 120].filter(d => d <= maxDur);
  }, [getMaxDuration]);

  // Animation Variants — memoized to prevent object recreation on every render
  const fadeInUp = useMemo(() => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
  }), []);

  const staggerContainer = useMemo(() => ({
    animate: {
      transition: {
        staggerChildren: 0.05
      }
    }
  }), []);

  return (
    <div className="booking-page">
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
                          <GiSteeringWheel className="booking-success-device-icon" />
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
                {/* Mobile-only date carousel — matches Flutter app design */}
                <MobileDateCarousel
                  selectedDate={selectedDate}
                  onChange={(dateStr) => setSelectedDate(dateStr)}
                />
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

              {success && (
                <motion.div 
                  className="alert"
                  style={{ background: 'rgba(16, 185, 129, 0.1)', border: '2px solid rgba(16, 185, 129, 0.3)', color: '#059669' }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span className="alert-icon">✅</span>
                  <span>{success}</span>
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

              <div className="step-content-wrapper">
                {/* Time Slots */}
                <div className="time-section-full">
                  <div className="time-slots-header">
                    <div className="header-left">
                      <div className="header-icon">
                        <FiClock />
                      </div>
                      <div className="header-text">
                        <h3 className="header-title">Pick Your Time</h3>
                        <p className="header-subtitle">Tap a slot to start gaming 🎮</p>
                      </div>
                    </div>
                    <div className="slot-legend-bar">
                      <div className="legend-chip legend-available">
                        <span className="legend-dot"></span>
                        <span className="legend-label">Open</span>
                      </div>
                      <div className="legend-chip legend-partial">
                        <span className="legend-dot"></span>
                        <span className="legend-label">Filling</span>
                      </div>
                      <div className="legend-chip legend-full">
                        <span className="legend-dot"></span>
                        <span className="legend-label">Full</span>
                      </div>
                      <div className="legend-chip legend-past">
                        <span className="legend-dot"></span>
                        <span className="legend-label">Past</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Full Day Closure Banner */}
                  {dayClosedInfo?.is_closed && (
                    <div className="closure-banner">
                      <span className="closure-banner-icon">🚫</span>
                      <div className="closure-banner-text">
                        <strong>Shop Closed on This Date</strong>
                        <p>{dayClosedInfo.reason}</p>
                        <p>Please select a different date to book.</p>
                      </div>
                    </div>
                  )}
                  
                  {loading ? (
                    <div className="loading-container">
                      <div className="loader">
                        <div className="loader-ring"></div>
                        <div className="loader-ring"></div>
                        <div className="loader-ring"></div>
                      </div>
                      <p className="loading-text">Finding available slots...</p>
                    </div>
                  ) : error && slots.length === 0 ? (
                    <div className="slots-error-container">
                      <div className="slots-error-icon">⚠️</div>
                      <p className="slots-error-message">{error}</p>
                      <button 
                        className="slots-retry-btn"
                        onClick={() => loadSlots(true)}
                      >
                        <FiRefreshCw className="retry-icon" />
                        Try Again
                      </button>
                      <p className="slots-error-hint">If this keeps happening, try refreshing the page or switching to a different network.</p>
                    </div>
                  ) : slots.filter((slot) => !isSlotPast(slot.time)).length === 0 ? (
                    <div className="slots-error-container">
                      <div className="slots-error-icon">⏰</div>
                      <p className="slots-error-message">No more slots available for today</p>
                      <p className="slots-error-hint">All time slots for today have passed. Please pick a future date to book your session.</p>
                    </div>
                  ) : (
                    <div className="time-slots-scroll-wrapper">
                      <motion.div 
                        className="time-slots-grid compact-horizontal"
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                      >
                        {slots
                        .filter((slot) => !isSlotPast(slot.time))  
                        .map((slot, index) => {
                          const disabled = isSlotDisabled(slot);
                          const maxDur = getMaxDuration(slot.time);
                          const isLateSlot = maxDur <= 60 && maxDur >= MIN_BOOKING_DURATION;
                          const isSelected = selectedTime === slot.time;
                          
                          // Determine visual state class
                          let stateClass = slot.status;
                          if (slot.status === 'closed') stateClass = 'closed';
                          else if (disabled && slot.status !== 'closed') stateClass = 'closing-soon';

                          return (
                          <motion.button
                            key={slot.time}
                            variants={fadeInUp}
                            className={`ts-card ts-${stateClass} ${isSelected ? 'ts-selected' : ''}`}
                            onClick={() => !disabled && handleTimeSelect(slot.time, slot.status)}
                            disabled={disabled}
                            whileHover={!disabled ? SLOT_HOVER : EMPTY_MOTION}
                            whileTap={!disabled ? SLOT_TAP : EMPTY_MOTION}
                            title={slot.status === 'closed' ? (slot.closure_reason || 'Shop closed') : maxDur < MIN_BOOKING_DURATION ? 'Too close to closing time (12 AM)' : isLateSlot ? `Max ${maxDur} min — closes at 12 AM` : ''}
                          >
                            {/* Status indicator dot */}
                            <span className="ts-dot"></span>

                            {/* Time */}
                            <span className="ts-time">{formatTime12Hour(slot.time)}</span>

                            {/* Sub-label based on state */}
                            {slot.status === 'closed' && (
                              <span className="ts-label">Closed</span>
                            )}
                            {slot.status !== 'closed' && isLateSlot && (
                              <span className="ts-label ts-label-warn">Max {maxDur}m</span>
                            )}
                            {slot.status !== 'closed' && !isLateSlot && slot.status === 'partial' && (
                              <span className="ts-label ts-label-partial">
                                {slot.available_ps5} left
                              </span>
                            )}
                            {slot.status !== 'closed' && !isLateSlot && slot.status === 'available' && (
                              <span className="ts-label ts-label-open">Open</span>
                            )}
                            {slot.status !== 'closed' && !isLateSlot && slot.status === 'full' && (
                              <span className="ts-label ts-label-full">Full</span>
                            )}
                          </motion.button>
                          );
                        })}
                      </motion.div>
                      <div className="closing-time-notice">
                        <FiInfo className="closing-notice-icon" />
                        <span>We close at <strong>12:00 AM (Midnight)</strong>. Last booking must end by midnight.</span>
                      </div>
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
                    <div className="party-device-chip driving"><GiSteeringWheel /> Racing Sim</div>
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
                            placeholder="Name"
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
                            placeholder="Phone Number"
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
              className={`booking-card step2-card${(ps5Bookings.length > 0 || drivingSim) ? ' has-price-footer' : ''}`}
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
                      className={`mode-tab ${selectionMode === 'device' ? 'active' : ''}`}
                      onClick={() => setSelectionMode('device')}
                    >
                      <FiMonitor className="mode-tab-icon" />
                      <span>Book by Console</span>
                    </button>
                    <button 
                      className={`mode-tab ${selectionMode === 'game' ? 'active' : ''}`}
                      onClick={() => setSelectionMode('game')}
                    >
                      <FiGrid className="mode-tab-icon" />
                      <span>Book by Game</span>
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
                                              (e.target as HTMLImageElement).style.display = 'none';
                                              ((e.target as HTMLImageElement).nextSibling as HTMLElement).style.display = 'flex';
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
                                            <GiSteeringWheel style={{ fontSize: '0.6rem' }} /> Sim
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
                                          <div className="compact-options">
                                            <div className="compact-option-row">
                                              <span className="compact-option-label"><FiUsers size={13} /> Players</span>
                                              <div className="compact-pill-group">
                                                {[1, 2, 3, 4].map((count) => (
                                                  <button
                                                    key={count}
                                                    className={`compact-pill ${booking && booking.player_count >= count ? 'active' : ''}`}
                                                    onClick={() => handlePlayerSelect(unitNumber, count - 1)}
                                                  >
                                                    {count}
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                            
                                            {booking && (
                                              <div className="compact-option-row">
                                                <span className="compact-option-label"><FiClock size={13} /> Duration</span>
                                                <div className="compact-pill-group">
                                                  {getAllowedDurations(selectedTime).map(dur => (
                                                    <button
                                                      key={dur}
                                                      className={`compact-pill dur ${booking.duration === dur || (!booking.duration && dur === 60) ? 'active' : ''}`}
                                                      onClick={() => handlePS5DurationChange(unitNumber, dur)}
                                                    >
                                                      {dur < 60 ? `${dur}m` : `${dur / 60}h`}
                                                    </button>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
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

                                      <div className="compact-options">
                                        <div className="compact-option-row">
                                          <span className="compact-option-label"><FiUsers size={13} /> Players</span>
                                          <div className="compact-pill-group">
                                            {[1, 2, 3, 4].map((count) => (
                                              <button
                                                key={count}
                                                className={`compact-pill ${booking && booking.player_count >= count ? 'active' : ''}`}
                                                onClick={() => handlePlayerSelect(unitNumber, count - 1)}
                                              >
                                                {count}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                        
                                        {booking && (
                                          <div className="compact-option-row">
                                            <span className="compact-option-label"><FiClock size={13} /> Duration</span>
                                            <div className="compact-pill-group">
                                              {getAllowedDurations(selectedTime).map(dur => (
                                                <button
                                                  key={dur}
                                                  className={`compact-pill dur ${booking.duration === dur || (!booking.duration && dur === 60) ? 'active' : ''}`}
                                                  onClick={() => handlePS5DurationChange(unitNumber, dur)}
                                                >
                                                  {dur < 60 ? `${dur}m` : `${dur / 60}h`}
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
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
                      <GiSteeringWheel className="section-icon" />
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
                          <GiSteeringWheel className="device-icon" />
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
                            <div className="compact-options">
                              <div className="compact-option-row">
                                <span className="compact-option-label"><FiClock size={13} /> Duration</span>
                                <div className="compact-pill-group">
                                  {(() => {
                                    let effectiveStart = selectedTime;
                                    if (drivingSim.afterPS5 && ps5Bookings.length > 0) {
                                      const maxPS5 = Math.max(...ps5Bookings.map(b => b.duration || 60));
                                      const [h, m] = selectedTime.split(':').map(Number);
                                      const total = h * 60 + m + maxPS5;
                                      effectiveStart = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
                                    }
                                    return getAllowedDurations(effectiveStart).map(dur => (
                                      <button
                                        key={dur}
                                        className={`compact-pill dur ${drivingSim.duration === dur ? 'active' : ''}`}
                                        onClick={() => handleDrivingDurationChange(dur)}
                                      >
                                        {dur < 60 ? `${dur}m` : `${dur / 60}h`}
                                      </button>
                                    ));
                                  })()}
                                </div>
                              </div>

                              {ps5Bookings.length > 0 && (
                                <div className="compact-option-row">
                                  <div 
                                    className={`compact-toggle ${drivingSim.afterPS5 ? 'active' : ''}`}
                                    onClick={() => handleDrivingAfterPS5Change(!drivingSim.afterPS5)}
                                  >
                                    <div className="compact-toggle-track">
                                      <div className="compact-toggle-thumb" />
                                    </div>
                                    <span className="compact-toggle-text">Play after PS5 session</span>
                                  </div>
                                  {drivingSim.afterPS5 && (
                                    <div className="compact-after-info">
                                      <FiClock size={12} />
                                      <span>Starts at {(() => {
                                        const maxPS5 = Math.max(...ps5Bookings.map(b => b.duration || 60));
                                        const [h, m] = selectedTime.split(':').map(Number);
                                        const total = h * 60 + m + maxPS5;
                                        return formatTime12Hour(`${String(Math.floor(total / 60) % 24).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`);
                                      })()}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
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
                                <span className="pf-amount" style={{ 
                                  transition: 'opacity 0.15s ease', 
                                  opacity: priceLoading ? 0.5 : 1,
                                  minWidth: '60px',
                                  display: 'inline-block'
                                }}>
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
                                disabled={priceLoading}
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
                  <form onSubmit={handleSubmit} ref={checkoutFormRef}>
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
                            placeholder="Name"
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
                            placeholder="Phone Number"
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
                            <div className="item-icon-v2 driving"><GiSteeringWheel /></div>
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
                              {discountInfo.membership?.plan_type?.replace(/_/g, ' ')} Member Rate
                              {discountInfo.membership?.rate_per_hour && ` (₹${discountInfo.membership.rate_per_hour}/hr)`}
                            </span>
                            <span className="discount-amount">-{formatPrice(discountInfo.amount)}</span>
                          </div>
                          {discountInfo.membership?.hours_remaining && (
                            <div className="total-row-v2" style={{fontSize: '0.8rem', color: '#888'}}>
                              <span>Hours remaining after booking</span>
                              <span>{(discountInfo.membership.hours_remaining - (discountInfo.membership.hours_this_booking || 0)).toFixed(1)}h</span>
                            </div>
                          )}
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
                      {hoursWarning && (
                        <div className="hours-warning-banner" style={{
                          background: '#fff3cd', 
                          border: '1px solid #ffc107', 
                          borderRadius: '8px', 
                          padding: '10px 14px', 
                          marginTop: '10px',
                          fontSize: '0.85rem',
                          color: '#856404',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <FiInfo style={{flexShrink: 0}} />
                          <span>{hoursWarning}</span>
                        </div>
                      )}
                      <p className="payment-note-v2"><FiCheckCircle style={{verticalAlign: 'middle', marginRight: 6}} /> No payment required now</p>
                      
                      <div className="punctuality-warning">
                        <div className="punctuality-warning-icon">⏰</div>
                        <div className="punctuality-warning-content">
                          <strong>Please arrive on time!</strong>
                          <p>If you do not arrive within 15 minutes of your booked slot and another customer is waiting for that time, priority will be given to the on-time customer. Late arrivals may result in a shortened session or reassignment of your slot.</p>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                         className="submit-btn-v2" 
                         disabled={loading}
                         onClick={(e) => {
                             // Submit the checkout form via ref to avoid selecting wrong form
                             if (checkoutFormRef && checkoutFormRef.current) {
                               // @ts-ignore
                               checkoutFormRef.current.requestSubmit();
                             } else {
                               const form = document.querySelector('form');
                               if (form) form.requestSubmit();
                             }
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
</div>
  );
};

export default BookingPage;
