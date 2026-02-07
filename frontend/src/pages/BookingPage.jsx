import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiCalendar, FiClock, FiMonitor, FiUser, FiCpu, FiZap, FiUsers, FiCheck, FiTag, FiPhone, FiChevronDown, FiStar, FiShield, FiInfo } from 'react-icons/fi';
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
  const [drivingSim, setDrivingSim] = useState(null);
  const [availablePS5Units, setAvailablePS5Units] = useState([]);
  const [availableDriving, setAvailableDriving] = useState(true);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [price, setPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [discountInfo, setDiscountInfo] = useState(null);
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
  const [currentStep, setCurrentStep] = useState(1);
  const [expandedPS5, setExpandedPS5] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookingId, setBookingId] = useState(null);

  // Scroll to top on step change
  const contentRef = useRef(null);
  
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentStep]);

  useEffect(() => { checkUserSession(); }, []);
  useEffect(() => { loadSlots(); }, [selectedDate]);
  useEffect(() => {
    if (selectedTime && currentStep === 2 && (ps5Bookings.length > 0 || drivingSim)) {
      checkAvailability();
    }
  }, [ps5Bookings.map(b => b.duration).join(','), drivingSim?.duration, drivingSim?.afterPS5]);
  useEffect(() => {
    if (ps5Bookings.length > 0 || drivingSim) { updatePrice(); }
  }, [ps5Bookings, drivingSim]);

  const loadSlots = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSlots(selectedDate);
      setSlots(response.slots);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const checkUserSession = async () => {
    try {
      const data = await apiFetch('/api/auth/check');
      if (data.authenticated && data.user_type !== 'admin') {
        setIsLoggedIn(true);
        setUser(data.user);
        if (data.user.name) setCustomerName(data.user.name);
        if (data.user.phone) setCustomerPhone(data.user.phone);
        try {
          const membershipResponse = await getMembershipStatus();
          if (membershipResponse.success && membershipResponse.has_membership) {
            setMembership(membershipResponse.membership);
          }
        } catch (membershipErr) { console.log('No active membership'); }
      }
    } catch (err) { console.error('Session check error:', err); }
  };

  const checkAvailability = async () => {
    try {
      const maxPS5Duration = ps5Bookings.length > 0 ? Math.max(...ps5Bookings.map(b => b.duration || 60)) : 60;
      const ps5Response = await getSlotDetails(selectedDate, selectedTime, maxPS5Duration);
      setAvailablePS5Units(ps5Response.available_ps5_units);
      setTotalPlayers(ps5Response.total_ps5_players_booked);
      
      const validPS5 = ps5Bookings.filter(b => ps5Response.available_ps5_units.includes(b.device_number));
      setPs5Bookings(validPS5);
      
      if (drivingSim && drivingSim.afterPS5 && ps5Bookings.length > 0) {
        const maxDur = Math.max(...ps5Bookings.map(b => b.duration || 60));
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + maxDur;
        const newHours = Math.floor(totalMinutes / 60);
        const newMinutes = totalMinutes % 60;
        const drivingCheckTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
        const drivingDuration = drivingSim.duration || 60;
        const drivingResponse = await getSlotDetails(selectedDate, drivingCheckTime, drivingDuration);
        setAvailableDriving(drivingResponse.available_driving);
        if (!drivingResponse.available_driving) {
          setDrivingSim(null);
          setError(`Driving Simulator is not available after your PS5 session (at ${drivingCheckTime})`);
        }
      } else {
        setAvailableDriving(ps5Response.available_driving);
        if (drivingSim && !ps5Response.available_driving) {
          setDrivingSim(null);
          setError('Driving Simulator is not available at the selected time');
        }
      }
    } catch (err) { setError(err.message); }
  };

  const updatePrice = async () => {
    try {
      let totalOriginalPrice = 0;
      let totalFinalPrice = 0;
      let lastDiscountInfo = null;
      for (const ps5 of ps5Bookings) {
        const response = await calculatePrice([ps5], false, ps5.duration || 60);
        totalOriginalPrice += response.original_price || response.total_price;
        totalFinalPrice += response.total_price;
        if (response.has_discount) {
          lastDiscountInfo = { percentage: response.discount_percentage, membership: response.membership };
        }
      }
      if (drivingSim) {
        const response = await calculatePrice([], true, drivingSim.duration || 60);
        totalOriginalPrice += response.original_price || response.total_price;
        totalFinalPrice += response.total_price;
        if (response.has_discount) {
          lastDiscountInfo = { percentage: response.discount_percentage, membership: response.membership };
        }
      }
      setOriginalPrice(totalOriginalPrice);
      setPrice(totalFinalPrice);
      if (lastDiscountInfo) {
        setDiscountInfo({ ...lastDiscountInfo, amount: totalOriginalPrice - totalFinalPrice });
      } else { setDiscountInfo(null); }
    } catch (err) { console.error('Price calculation error:', err); }
  };

  const calculatePS5Price = (ps5Booking) => {
    const baseRate = 100;
    const duration = ps5Booking.duration || 60;
    const players = ps5Booking.player_count || 1;
    return baseRate * players * (duration / 30);
  };

  const calculateDrivingPrice = (drivingBooking) => {
    const baseRate = 100;
    const duration = drivingBooking?.duration || 60;
    return baseRate * (duration / 30);
  };

  const handleTimeSelect = async (time, status) => {
    if (status === 'full') return;
    setSelectedTime(time);
    setPs5Bookings([]);
    setDrivingSim(null);
    setPrice(0);
    setError(null);
    try {
      setLoading(true);
      const response = await getSlotDetails(selectedDate, time, 60);
      setAvailablePS5Units(response.available_ps5_units);
      setAvailableDriving(response.available_driving);
      setTotalPlayers(response.total_ps5_players_booked);
      setCurrentStep(2);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  
  const handlePS5CardClick = (deviceNumber) => {
    if (!availablePS5Units.includes(deviceNumber)) return;
    setExpandedPS5(expandedPS5 === deviceNumber ? null : deviceNumber);
  };
  
  const handlePlayerSelect = (deviceNumber, playerIndex) => {
    const existing = ps5Bookings.find(b => b.device_number === deviceNumber);
    if (existing) {
      const currentCount = existing.player_count;
      const newCount = playerIndex + 1;
      if (newCount === currentCount) {
        setPs5Bookings(ps5Bookings.filter(b => b.device_number !== deviceNumber));
        return;
      }
      const otherPlayers = ps5Bookings.filter(pb => pb.device_number !== deviceNumber).reduce((sum, pb) => sum + pb.player_count, 0);
      if (otherPlayers + newCount + totalPlayers > 10) {
        setError('Maximum 10 players allowed at the same time');
        return;
      }
      setPs5Bookings(ps5Bookings.map(b => b.device_number === deviceNumber ? { ...b, player_count: newCount } : b));
    } else {
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
    setPs5Bookings(ps5Bookings.map(b => b.device_number === deviceNumber ? { ...b, duration: parseInt(duration) } : b));
  };
  
  const handleDrivingSimToggle = () => {
    if (drivingSim) { setDrivingSim(null); } else { setDrivingSim({ duration: 60, afterPS5: false }); }
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
      setPs5Bookings(ps5Bookings.filter(b => b.device_number !== deviceNumber));
    } else {
      setPs5Bookings([...ps5Bookings, { device_number: deviceNumber, player_count: 1 }]);
    }
  };

  const handlePlayerCountChange = (deviceNumber, change) => {
    const updated = ps5Bookings.map(b => {
      if (b.device_number === deviceNumber) {
        const newCount = Math.max(1, Math.min(4, b.player_count + change));
        const otherPlayers = ps5Bookings.filter(pb => pb.device_number !== deviceNumber).reduce((sum, pb) => sum + pb.player_count, 0);
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
    if (!promoCode.trim()) { setPromoCodeError('Please enter a promo code'); return; }
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
        setPromoCodeData(null); setBonusMinutes(0); setPromoCodeSuccess('');
      }
    } catch (err) {
      setPromoCodeError('Failed to validate promo code');
      setPromoCodeData(null); setBonusMinutes(0); setPromoCodeSuccess('');
    } finally { setApplyingPromoCode(false); }
  };

  const handleRemovePromoCode = () => {
    setPromoCode(''); setPromoCodeData(null); setBonusMinutes(0); setPromoCodeError(''); setPromoCodeSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidName(customerName)) { setError('Please enter a valid name (minimum 2 characters)'); return; }
    if (!isValidPhone(customerPhone)) { setError('Please enter a valid phone number (minimum 10 digits)'); return; }
    if (ps5Bookings.length === 0 && !drivingSim) { setError('Please select at least one device'); return; }
    try {
      setLoading(true);
      setError(null);
      const allBookings = [];
      for (const ps5 of ps5Bookings) {
        const priceResponse = await calculatePrice([ps5], false, ps5.duration || 60);
        allBookings.push(createBooking({
          customer_name: customerName, customer_phone: customerPhone,
          booking_date: selectedDate, start_time: selectedTime,
          duration_minutes: ps5.duration || 60, ps5_bookings: [ps5],
          driving_sim: false, driving_after_ps5: false,
          total_price: priceResponse.total_price,
          bonus_minutes: bonusMinutes, promo_code_id: promoCodeData?.id || null
        }));
      }
      if (drivingSim) {
        const priceResponse = await calculatePrice([], true, drivingSim.duration || 60);
        let drivingStartTime = selectedTime;
        if (drivingSim.afterPS5 && ps5Bookings.length > 0) {
          const maxPS5Duration = Math.max(...ps5Bookings.map(b => b.duration || 60));
          const [hours, minutes] = selectedTime.split(':').map(Number);
          const totalMinutes = hours * 60 + minutes + maxPS5Duration;
          drivingStartTime = `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
        }
        allBookings.push(createBooking({
          customer_name: customerName, customer_phone: customerPhone,
          booking_date: selectedDate, start_time: drivingStartTime,
          duration_minutes: drivingSim.duration || 60, ps5_bookings: [],
          driving_sim: true, driving_after_ps5: drivingSim.afterPS5 && ps5Bookings.length > 0,
          total_price: priceResponse.total_price,
          bonus_minutes: bonusMinutes, promo_code_id: promoCodeData?.id || null
        }));
      }
      const responses = await Promise.all(allBookings);
      setBookingId(responses[0].booking_id);
      setShowSuccessModal(true);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  
  const handleSuccessClose = () => { setShowSuccessModal(false); navigate('/'); };

  // Helpers
  const totalSelectedPlayers = ps5Bookings.reduce((sum, b) => sum + b.player_count, 0);
  const capacityPercent = ((totalPlayers + totalSelectedPlayers) / 10) * 100;

  const steps = [
    { num: 1, label: 'Schedule', desc: 'Pick date & time', icon: <FiCalendar /> },
    { num: 2, label: 'Equipment', desc: 'Select your gear', icon: <FiMonitor /> },
    { num: 3, label: 'Confirm', desc: 'Complete booking', icon: <FiCheck /> },
  ];

  return (
    <div className="booking-page">
      <Navbar showCenter={false} />
      
      {/* Background */}
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
            className="bk-modal-overlay" 
            onClick={handleSuccessClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bk-modal-card" 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.85, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="bk-modal-success-ring">
                <div className="bk-modal-check"><FiCheck /></div>
                <div className="bk-modal-pulse"></div>
                <div className="bk-modal-pulse bk-pulse-2"></div>
              </div>
              
              <h2 className="bk-modal-title">Booking Confirmed! 🎉</h2>
              <p className="bk-modal-subtitle">Get ready for an epic gaming session!</p>
              
              <div className="bk-modal-details">
                <div className="bk-modal-row">
                  <span>Booking ID</span>
                  <span className="bk-modal-highlight">#{bookingId}</span>
                </div>
                <div className="bk-modal-divider"></div>
                <div className="bk-modal-row">
                  <span>📅 Date</span>
                  <span>{selectedDate}</span>
                </div>
                <div className="bk-modal-row">
                  <span>🕐 Time</span>
                  <span>{formatTime12Hour(selectedTime)}</span>
                </div>
                <div className="bk-modal-divider"></div>
                <div className="bk-modal-row bk-modal-total">
                  <span>Total Amount</span>
                  <span className="bk-modal-price">{formatPrice(price)}</span>
                </div>
                {bonusMinutes > 0 && (
                  <div className="bk-modal-row bk-modal-bonus">
                    <span>🎁 Bonus Time</span>
                    <span>+{bonusMinutes} min FREE!</span>
                  </div>
                )}
              </div>
              
              <button className="bk-modal-btn" onClick={handleSuccessClose}>
                <FiArrowLeft /> Return Home
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="booking-container" ref={contentRef}>
        {/* Hero */}
        <motion.div className="booking-hero" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="hero-badge"><FiZap className="badge-icon" /> Book Your Session</div>
          <h1 className="booking-title">Reserve Your Gaming Experience</h1>
          <p className="booking-subtitle">Pick your time, choose your gear, and lock in your session</p>
        </motion.div>

        {/* Steps */}
        <motion.div className="bk-steps" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          {steps.map((step, i) => (
            <React.Fragment key={step.num}>
              <button 
                className={`bk-step ${currentStep >= step.num ? 'active' : ''} ${currentStep > step.num ? 'done' : ''}`}
                onClick={() => { if (currentStep > step.num) setCurrentStep(step.num); }}
                disabled={currentStep < step.num}
              >
                <div className="bk-step-icon">
                  {currentStep > step.num ? <FiCheck /> : step.icon}
                </div>
                <div className="bk-step-text">
                  <span className="bk-step-label">{step.label}</span>
                  <span className="bk-step-desc">{step.desc}</span>
                </div>
              </button>
              {i < steps.length - 1 && (
                <div className="bk-step-line">
                  <motion.div 
                    className="bk-step-line-fill"
                    initial={{ width: 0 }}
                    animate={{ width: currentStep > step.num ? '100%' : '0%' }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ═══════ STEP 1: Date & Time ═══════ */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              className="bk-card"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.35 }}
            >
              <div className="bk-card-header">
                <div className="bk-card-icon"><FiCalendar /></div>
                <div className="bk-card-header-text">
                  <h2>Choose Your Schedule</h2>
                  <p>Select your preferred date and time slot</p>
                </div>
                <div className="bk-date-picker-area">
                  <ModernDatePicker 
                    selectedDate={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    minDate={getToday()}
                  />
                </div>
              </div>
              
              {error && (
                <motion.div className="bk-alert bk-alert-error" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <span>⚠️</span><span>{error}</span>
                </motion.div>
              )}

              {/* Time Slots Panel */}
              <div className="bk-time-panel">
                <div className="bk-time-panel-header">
                  <div className="bk-time-header-left">
                    <div className="bk-time-icon"><FiClock /></div>
                    <div>
                      <h3>Available Time Slots</h3>
                      <p>Select your preferred gaming time</p>
                    </div>
                  </div>
                  <div className="bk-legend">
                    <div className="bk-legend-item"><span className="bk-dot bk-dot-available"></span>Available</div>
                    <div className="bk-legend-item"><span className="bk-dot bk-dot-partial"></span>Partial</div>
                    <div className="bk-legend-item"><span className="bk-dot bk-dot-full"></span>Full</div>
                  </div>
                </div>

                {loading ? (
                  <div className="bk-loader-wrap">
                    <div className="bk-loader"><div></div><div></div><div></div></div>
                    <p>Finding available slots...</p>
                  </div>
                ) : (
                  <div className="bk-time-grid-wrap">
                    <motion.div className="bk-time-grid" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.02 } } }}>
                      {slots.map((slot) => (
                        <motion.button
                          key={slot.time}
                          variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                          className={`bk-slot ${slot.status} ${selectedTime === slot.time ? 'selected' : ''}`}
                          onClick={() => handleTimeSelect(slot.time, slot.status)}
                          disabled={slot.status === 'full'}
                          whileHover={slot.status !== 'full' ? { scale: 1.04 } : {}}
                          whileTap={slot.status !== 'full' ? { scale: 0.97 } : {}}
                        >
                          <span className="bk-slot-dot"></span>
                          <span className="bk-slot-time">{formatTime12Hour(slot.time)}</span>
                          {slot.status === 'partial' && slot.total_ps5_players > 0 && (
                            <span className="bk-slot-cap"><FiUsers /> {slot.total_ps5_players}/10</span>
                          )}
                          {slot.status === 'full' && <span className="bk-slot-full-tag">FULL</span>}
                          {selectedTime === slot.time && <motion.div className="bk-slot-ring" layoutId="slotRing" transition={{ type: "spring", stiffness: 500, damping: 30 }} />}
                        </motion.button>
                      ))}
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ═══════ STEP 2: Equipment ═══════ */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              className="bk-card"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.35 }}
            >
              <div className="bk-card-header">
                <button className="bk-back" onClick={() => setCurrentStep(1)}><FiArrowLeft /></button>
                <div className="bk-card-icon"><FiMonitor /></div>
                <div className="bk-card-header-text">
                  <h2>Select Your Equipment</h2>
                  <p>Choose gaming stations and session duration</p>
                </div>
                <div className="bk-session-badges">
                  <div className="bk-badge">
                    <FiCalendar />
                    <div>
                      <span className="bk-badge-label">Date</span>
                      <span className="bk-badge-value">{new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="bk-badge">
                    <FiClock />
                    <div>
                      <span className="bk-badge-label">Time</span>
                      <span className="bk-badge-value">{formatTime12Hour(selectedTime)}</span>
                    </div>
                  </div>
                  <div className="bk-badge">
                    <FiUsers />
                    <div>
                      <span className="bk-badge-label">Capacity</span>
                      <span className={`bk-badge-value ${totalPlayers + totalSelectedPlayers > 8 ? 'warn' : ''}`}>
                        {totalPlayers + totalSelectedPlayers}/10
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {error && (
                <motion.div className="bk-alert bk-alert-error" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <span>⚠️</span><span>{error}</span>
                </motion.div>
              )}
              
              {loading ? (
                <div className="bk-loader-wrap">
                  <div className="bk-loader"><div></div><div></div><div></div></div>
                  <p>Checking availability...</p>
                </div>
              ) : (
                <>
                  {/* Availability Warning */}
                  {(availablePS5Units.length < 3 || !availableDriving) && (
                    <motion.div className="bk-alert bk-alert-warning" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                      <span>⚡</span>
                      <div>
                        <strong>Limited Availability</strong>
                        <p>
                          {availablePS5Units.length < 3 && `PS5 Units ${[1, 2, 3].filter(n => !availablePS5Units.includes(n)).join(', ')} already booked. `}
                          {!availableDriving && `Driving Simulator occupied.`}
                        </p>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* PS5 Section */}
                  <div className="bk-device-section">
                    <div className="bk-section-label">
                      <FiMonitor />
                      <span>PlayStation 5 Consoles</span>
                    </div>
                    
                    <div className="bk-devices-grid">
                      {[1, 2, 3].map((unitNumber) => {
                        const booking = ps5Bookings.find(b => b.device_number === unitNumber);
                        const isExpanded = expandedPS5 === unitNumber;
                        const isSelected = !!booking;
                        const isAvailable = availablePS5Units.includes(unitNumber);
                        
                        return (
                          <motion.div 
                            key={`ps5-${unitNumber}`}
                            layout
                            className={`bk-device ${isSelected ? 'selected' : ''} ${!isAvailable ? 'unavailable' : ''} ${isExpanded ? 'expanded' : ''}`}
                            onClick={() => isAvailable && handlePS5CardClick(unitNumber)}
                          >
                            {!isAvailable && <div className="bk-device-booked">BOOKED</div>}
                            {isSelected && <div className="bk-device-selected-check"><FiCheck /></div>}
                            
                            <div className="bk-device-head">
                              <div className={`bk-device-icon-box ps5`}>
                                <FiMonitor />
                              </div>
                              <div className="bk-device-info">
                                <h4>PlayStation 5</h4>
                                <span>Unit {unitNumber}</span>
                              </div>
                              {isAvailable && (
                                <div className={`bk-device-chevron ${isExpanded ? 'open' : ''}`}>
                                  <FiChevronDown />
                                </div>
                              )}
                            </div>
                            
                            <AnimatePresence>
                              {isExpanded && isAvailable && (
                                <motion.div 
                                  className="bk-device-options"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="bk-option-group">
                                    <label><FiUsers /> Number of Players</label>
                                    <div className="bk-player-btns">
                                      {[0, 1, 2, 3].map((idx) => (
                                        <button
                                          key={idx}
                                          className={`bk-player-btn ${booking && booking.player_count >= idx + 1 ? 'active' : ''}`}
                                          onClick={() => handlePlayerSelect(unitNumber, idx)}
                                        >
                                          {idx + 1}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  {booking && (
                                    <div className="bk-option-group">
                                      <label><FiClock /> Session Duration</label>
                                      <div className="bk-duration-btns">
                                        {[30, 60, 90, 120].map(dur => (
                                          <button
                                            key={dur}
                                            className={`bk-dur-btn ${booking.duration === dur || (!booking.duration && dur === 60) ? 'active' : ''}`}
                                            onClick={() => handlePS5DurationChange(unitNumber, dur)}
                                          >
                                            <span className="bk-dur-val">{dur < 60 ? dur : dur / 60}</span>
                                            <span className="bk-dur-unit">{dur < 60 ? 'min' : dur === 60 ? 'hr' : 'hrs'}</span>
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
                    <div className="bk-section-label bk-section-label-driving">
                      <FiCpu />
                      <span>Racing Simulator</span>
                    </div>
                    
                    <motion.div 
                      layout
                      className={`bk-device bk-device-driving ${drivingSim ? 'selected' : ''} ${!availableDriving ? 'unavailable' : ''}`}
                      onClick={() => availableDriving && handleDrivingSimToggle()}
                    >
                      {!availableDriving && <div className="bk-device-booked">BOOKED</div>}
                      {drivingSim && <div className="bk-device-selected-check"><FiCheck /></div>}

                      <div className="bk-device-head">
                        <div className="bk-device-icon-box driving">
                          <FiCpu />
                        </div>
                        <div className="bk-device-info">
                          <h4>Racing Simulator</h4>
                          <span>Pro Setup with Wheel & Pedals</span>
                        </div>
                        {availableDriving && drivingSim && (
                          <div className="bk-device-check-icon"><FiCheck /></div>
                        )}
                      </div>

                      <AnimatePresence>
                        {drivingSim && availableDriving && (
                          <motion.div 
                            className="bk-device-options"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="bk-option-group">
                              <label><FiClock /> Session Duration</label>
                              <div className="bk-duration-btns">
                                {[30, 60, 90, 120].map(dur => (
                                  <button
                                    key={dur}
                                    className={`bk-dur-btn ${drivingSim.duration === dur ? 'active' : ''}`}
                                    onClick={() => handleDrivingDurationChange(dur)}
                                  >
                                    <span className="bk-dur-val">{dur < 60 ? dur : dur / 60}</span>
                                    <span className="bk-dur-unit">{dur < 60 ? 'min' : dur === 60 ? 'hr' : 'hrs'}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {ps5Bookings.length > 0 && (
                              <div className="bk-option-group bk-after-ps5">
                                <label className="bk-toggle-wrap">
                                  <input
                                    type="checkbox"
                                    checked={drivingSim.afterPS5 || false}
                                    onChange={(e) => handleDrivingAfterPS5Change(e.target.checked)}
                                  />
                                  <span className="bk-toggle-track"><span className="bk-toggle-thumb"></span></span>
                                  <span>Start after PS5 session ends</span>
                                </label>
                                {drivingSim.afterPS5 && (
                                  <p className="bk-after-ps5-info">
                                    <FiClock />
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

                  {/* Price Footer */}
                  {(ps5Bookings.length > 0 || drivingSim) && (
                    <motion.div 
                      className="bk-price-footer"
                      initial={{ opacity: 0, y: 80 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 80 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      <div className="bk-price-footer-inner">
                        <div className="bk-pf-price">
                          <span className="bk-pf-label">TOTAL</span>
                          <span className="bk-pf-amount" style={discountInfo ? { color: '#10b981' } : {}}>
                            {formatPrice(price)}
                          </span>
                        </div>
                        <button className="bk-pf-btn" onClick={() => setCurrentStep(3)}>
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

          {/* ═══════ STEP 3: Confirm ═══════ */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              className="bk-card"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.35 }}
            >
              <div className="bk-card-header">
                <button className="bk-back" onClick={() => setCurrentStep(2)}><FiArrowLeft /></button>
                <div className="bk-card-icon bk-card-icon-confirm"><FiUser /></div>
                <div className="bk-card-header-text">
                  <h2>Review & Confirm</h2>
                  <p>Final step to lock in your gaming session</p>
                </div>
              </div>

              <div className="bk-checkout-grid">
                {/* Left: Form */}
                <motion.div className="bk-checkout-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <form onSubmit={handleSubmit}>
                    {isLoggedIn && user ? (
                      <motion.div className="bk-user-card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                        <div className="bk-user-avatar"><FiUser /></div>
                        <div className="bk-user-info">
                          <span className="bk-user-greeting">Welcome back,</span>
                          <span className="bk-user-name">{user.name}</span>
                        </div>
                        <div className="bk-user-verified"><FiCheckCircle /> Verified</div>
                      </motion.div>
                    ) : (
                      <h3 className="bk-form-heading">Enter Your Details</h3>
                    )}
                    
                    <div className="bk-form-fields">
                      <div className="bk-field">
                        <label htmlFor="customerName">Full Name</label>
                        <div className="bk-input-wrap">
                          <FiUser className="bk-input-icon" />
                          <input
                            id="customerName"
                            type="text"
                            className={isLoggedIn ? 'filled' : ''}
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            required
                            placeholder="e.g., John Doe"
                          />
                        </div>
                      </div>
                      
                      <div className="bk-field">
                        <label htmlFor="customerPhone">Phone Number</label>
                        <div className="bk-input-wrap">
                          <FiPhone className="bk-input-icon" />
                          <input
                            id="customerPhone"
                            type="tel"
                            className={isLoggedIn ? 'filled' : ''}
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            required
                            placeholder="e.g., 9876543210"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Promo Code */}
                    <div className="bk-promo-section">
                      <h4><FiTag /> Have a Promo Code?</h4>
                      <div className="bk-promo-row">
                        <div className="bk-input-wrap bk-promo-input">
                          <FiTag className="bk-input-icon" />
                          <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                            placeholder="Enter promo code"
                            disabled={!!promoCodeData}
                          />
                        </div>
                        {!promoCodeData ? (
                          <button type="button" className="bk-promo-apply" onClick={handleApplyPromoCode} disabled={applyingPromoCode || !promoCode.trim()}>
                            {applyingPromoCode ? 'Applying...' : 'Apply'}
                          </button>
                        ) : (
                          <button type="button" className="bk-promo-remove" onClick={handleRemovePromoCode}>Remove</button>
                        )}
                      </div>
                      {promoCodeError && <div className="bk-promo-error">⚠️ {promoCodeError}</div>}
                      {promoCodeSuccess && <div className="bk-promo-success"><FiCheck /> {promoCodeSuccess}</div>}
                    </div>
                    
                    {error && (
                      <motion.div className="bk-alert bk-alert-error" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                        <span>⚠️</span><span>{error}</span>
                      </motion.div>
                    )}
                  </form>
                </motion.div>

                {/* Right: Summary */}
                <motion.div className="bk-checkout-summary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <h3>Booking Summary</h3>
                  
                  <div className="bk-summary-card">
                    <div className="bk-summary-session">
                      <div className="bk-summary-item">
                        <FiCalendar className="bk-summary-icon" />
                        <div>
                          <span className="bk-summary-label">Date</span>
                          <span className="bk-summary-value">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                      <div className="bk-summary-item">
                        <FiClock className="bk-summary-icon" />
                        <div>
                          <span className="bk-summary-label">Time</span>
                          <span className="bk-summary-value">{formatTime12Hour(selectedTime)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bk-summary-divider"></div>
                    
                    <div className="bk-summary-equipment">
                      <span className="bk-summary-section-title">Selected Equipment</span>
                      <div className="bk-items-list">
                        {ps5Bookings.map((b) => (
                          <div key={b.device_number} className="bk-item-row">
                            <div className="bk-item-icon ps5"><FiMonitor /></div>
                            <div className="bk-item-details">
                              <span className="bk-item-name">PS5 - Unit {b.device_number}</span>
                              <span className="bk-item-meta">{b.player_count}P • {formatDuration(b.duration || 60)}</span>
                            </div>
                            <span className="bk-item-price">{formatPrice(calculatePS5Price(b))}</span>
                          </div>
                        ))}
                        {drivingSim && (
                          <div className="bk-item-row">
                            <div className="bk-item-icon driving"><FiCpu /></div>
                            <div className="bk-item-details">
                              <span className="bk-item-name">Racing Sim</span>
                              <span className="bk-item-meta">{formatDuration(drivingSim.duration || 60)}</span>
                            </div>
                            <span className="bk-item-price">{formatPrice(calculateDrivingPrice(drivingSim))}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="bk-summary-divider"></div>
                    
                    <div className="bk-summary-total">
                      {discountInfo ? (
                        <>
                          <div className="bk-total-row">
                            <span>Subtotal</span>
                            <span className="bk-subtotal-val">{formatPrice(originalPrice)}</span>
                          </div>
                          <div className="bk-total-row bk-discount-row">
                            <span><FiTag /> {discountInfo.membership?.plan_type} ({discountInfo.percentage}% off)</span>
                            <span className="bk-discount-val">-{formatPrice(discountInfo.amount)}</span>
                          </div>
                          <div className="bk-total-row bk-final-row">
                            <span>Total</span>
                            <span className="bk-final-amount">{formatPrice(price)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="bk-total-row bk-final-row">
                          <span>Total</span>
                          <span className="bk-final-amount">{formatPrice(price)}</span>
                        </div>
                      )}
                      <p className="bk-pay-note"><FiShield /> No payment required now — pay at the venue</p>
                    </div>
                    
                    <button 
                      className="bk-confirm-btn" 
                      disabled={loading}
                      onClick={(e) => {
                        const form = document.querySelector('form');
                        if(form) form.requestSubmit();
                      }}
                    >
                      {loading ? (
                        <><div className="bk-btn-spinner"></div> Processing...</>
                      ) : (
                        <><FiCheck /> Confirm Booking</>
                      )}
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
