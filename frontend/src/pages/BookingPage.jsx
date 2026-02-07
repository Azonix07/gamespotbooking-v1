import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiCalendar, FiClock, FiMonitor, FiUser, FiCpu, FiZap, FiUsers, FiCheck, FiTag, FiPhone } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { getSlots, getSlotDetails, createBooking, calculatePrice, getMembershipStatus } from '../services/api';
import { formatDate, getToday, formatDuration, formatPrice, formatTime12Hour, isValidName, isValidPhone } from '../utils/helpers';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { apiFetch } from '../services/apiClient';
import ModernDatePicker from '../components/ModernDatePicker';
import '../styles/BookingPage.css';

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

  // Check user session on component mount
  useEffect(() => {
    checkUserSession();
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
      }
    } catch (err) {
      console.error('Session check error:', err);
      // Not logged in, continue as guest
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
    setPrice(0);
    setError(null);
    
    // Fetch availability data for this time slot
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
      
      setPs5Bookings([...ps5Bookings, { device_number: deviceNumber, player_count: newCount, duration: 60 }]);
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
      <Navbar showCenter={false} />
      
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
            className="modal-overlay" 
            onClick={handleSuccessClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content success-modal" 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="success-animation">
                <div className="success-checkmark">
                  <FiCheck className="checkmark-icon" />
                </div>
                <div className="success-ripple"></div>
                <div className="success-ripple delay-1"></div>
                <div className="success-ripple delay-2"></div>
              </div>
              
              <h2 className="success-title">Booking Confirmed! 🎉</h2>
              <p className="success-subtitle">Get ready for an epic gaming session!</p>
              
              <div className="success-details">
                <div className="detail-card">
                  <div className="detail-row">
                    <span className="detail-label">Booking ID</span>
                    <span className="detail-value highlight">#{bookingId}</span>
                  </div>
                  <div className="detail-divider"></div>
                  <div className="detail-row">
                    <span className="detail-label">📅 Date</span>
                    <span className="detail-value">{selectedDate}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">🕐 Time</span>
                    <span className="detail-value">{formatTime12Hour(selectedTime)}</span>
                  </div>
                  <div className="detail-divider"></div>
                  <div className="detail-row total">
                    <span className="detail-label">Total Amount</span>
                    <span className="detail-value price">{formatPrice(price)}</span>
                  </div>
                  {bonusMinutes > 0 && (
                    <div className="detail-row bonus-minutes">
                      <span className="detail-label">🎁 Bonus Time</span>
                      <span className="detail-value bonus">+{bonusMinutes} minutes FREE!</span>
                    </div>
                  )}
                </div>
              </div>
              
              <button className="btn-success-action" onClick={handleSuccessClose}>
                <FiArrowLeft /> Return Home
              </button>
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
          
          {/* STEP 2: Device & Player Selection */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              className="booking-card"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="card-header with-back">
                <button className="back-button" onClick={() => setCurrentStep(1)}>
                  <FiArrowLeft />
                </button>
                <div className="card-icon">
                  <FiMonitor />
                </div>
                <div className="card-header-content">
                  <h2 className="card-title">Select Your Equipment</h2>
                  <p className="card-subtitle">Choose gaming stations and session duration</p>
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
                  
                  {/* Device Selection Grid */}
                  <div className="devices-section">
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
                        
                        return (
                          <motion.div 
                            key={`ps5-${unitNumber}`}
                            layout
                            className={`device-card ${isSelected ? 'selected' : ''} ${!isAvailable ? 'unavailable' : ''} ${isExpanded ? 'expanded' : ''}`}
                            onClick={() => isAvailable && handlePS5CardClick(unitNumber)}
                            whileHover={isAvailable ? { y: -4 } : {}}
                          >
                            {!isAvailable && (
                              <div className="unavailable-badge">
                                <span>BOOKED</span>
                              </div>
                            )}
                            {isSelected && (
                              <div className="selected-badge">
                                <FiCheck /> Selected
                              </div>
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
                            
                            <AnimatePresence>
                              {isExpanded && isAvailable && (
                                <motion.div 
                                  className="device-options"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }} // Smoother bezier curve
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
                    
                    {/* Driving Simulator */}
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
                        <div className="unavailable-badge">
                          <span>BOOKED</span>
                        </div>
                      )}
                      {drivingSim && (
                        <div className="selected-badge">
                          <FiCheck /> Selected
                        </div>
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
                          <div className="check-indicator">
                            <FiCheck />
                          </div>
                        )}
                      </div>

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

                    {/* Desktop & Mobile Price Footer */}
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
                  </div>
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
                      <div className="items-list-v2">
                        {ps5Bookings.map((b) => (
                          <div key={b.device_number} className="item-row-v2">
                            <div className="item-icon-v2 ps5"><FiMonitor /></div>
                            <div className="item-details-v2">
                              <span className="item-name-v2">PS5 - Unit {b.device_number}</span>
                              <span className="item-meta-v2">{b.player_count}P • {formatDuration(b.duration || 60)}</span>
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

      <Footer />
    </div>
  );
};

export default BookingPage;
