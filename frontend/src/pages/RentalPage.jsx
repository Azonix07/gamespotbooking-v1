import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiClock, FiDollarSign, FiCheck, FiX, FiInfo, FiShoppingBag, FiTrendingDown, FiPackage, FiUser, FiPhone, FiMail, FiMapPin } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getToday } from '../utils/helpers';
import '../styles/RentalPage.css';

const RentalPage = () => {
  const navigate = useNavigate();
  
  // State for device selection
  const [selectedDevice, setSelectedDevice] = useState('vr'); // 'vr' or 'ps5'
  
  // State
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState('');
  const [customDays, setCustomDays] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState(null); // 'daily', 'weekly', 'monthly', 'custom'
  const [totalPrice, setTotalPrice] = useState(350);
  const [savings, setSavings] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // PS5 specific state
  const [extraControllers, setExtraControllers] = useState(0);
  
  // Form fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookingId, setBookingId] = useState(null);

  // Pricing tiers for VR
  const vrPricingTiers = {
    daily: { days: 1, price: 350, perDay: 350 },
    weekly: { days: 7, price: 2100, perDay: 300 },
    monthly: { days: 30, price: 7500, perDay: 250 }
  };

  // Pricing tiers for PS5
  const ps5PricingTiers = {
    daily: { days: 1, price: 400, perDay: 400 },
    weekly: { days: 7, price: 2400, perDay: 343 }
  };
  
  // Extra controller pricing
  const controllerPricePerDay = 50;

  // Calculate days between dates
  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both dates
    return diffDays;
  };

  // Calculate best price based on days and device type
  const calculatePrice = (days) => {
    if (days <= 0) return { price: 0, perDay: 0, savings: 0, package: null };

    const pricingTiers = selectedDevice === 'ps5' ? ps5PricingTiers : vrPricingTiers;
    const dailyRate = selectedDevice === 'ps5' ? 400 : 350;
    let price, perDay, packageType;
    const regularPrice = days * dailyRate;

    if (selectedDevice === 'ps5') {
      // PS5 pricing: daily or weekly only
      if (days >= 7) {
        const weeks = Math.floor(days / 7);
        const remainingDays = days % 7;
        price = (weeks * 2400) + (remainingDays * 400);
        packageType = 'weekly';
        perDay = price / days;
      } else {
        price = days * 400;
        packageType = 'daily';
        perDay = 400;
      }
      
      // Add extra controller cost
      const controllerCost = extraControllers * controllerPricePerDay * days;
      price += controllerCost;
    } else {
      // VR pricing: daily, weekly, or monthly
      if (days >= 30) {
        const months = Math.floor(days / 30);
        const remainingDays = days % 30;
        price = (months * 7500) + (remainingDays * 350);
        packageType = 'monthly';
        perDay = price / days;
      } else if (days >= 7) {
        const weeks = Math.floor(days / 7);
        const remainingDays = days % 7;
        price = (weeks * 2100) + (remainingDays * 350);
        packageType = 'weekly';
        perDay = price / days;
      } else {
        price = days * 350;
        packageType = 'daily';
        perDay = 350;
      }
    }

    const savings = regularPrice - price;
    return { price, perDay, savings, package: packageType };
  };

  // Update price when dates or custom days change
  useEffect(() => {
    if (selectedPackage === 'custom' && startDate && endDate) {
      const days = calculateDays(startDate, endDate);
      const { price, perDay, savings } = calculatePrice(days);
      setCustomDays(days);
      setTotalPrice(price);
      setSavings(savings);
    } else if (selectedPackage && selectedPackage !== 'custom') {
      const pricingTiers = selectedDevice === 'ps5' ? ps5PricingTiers : vrPricingTiers;
      const tier = pricingTiers[selectedPackage];
      if (tier) {
        const { price, savings } = calculatePrice(tier.days);
        setTotalPrice(price);
        setSavings(savings);
        setCustomDays(tier.days);
      }
    }
  }, [startDate, endDate, selectedPackage, selectedDevice, extraControllers]);

  const handlePackageSelect = (packageType) => {
    setSelectedPackage(packageType);
    setError(null);
    
    if (packageType !== 'custom') {
      const pricingTiers = selectedDevice === 'ps5' ? ps5PricingTiers : vrPricingTiers;
      const tier = pricingTiers[packageType];
      if (tier) {
        const { price, savings } = calculatePrice(tier.days);
        setTotalPrice(price);
        setSavings(savings);
        setCustomDays(tier.days);
        
        // Set dates automatically for preset packages
        const today = new Date();
        const end = new Date(today);
        end.setDate(end.getDate() + tier.days - 1);
        setStartDate(getToday());
        setEndDate(end.toISOString().split('T')[0]);
      }
    } else {
      // Custom package
      setStartDate(getToday());
      setEndDate('');
    }
  };

  const handleProceedToBooking = () => {
    if (!selectedPackage) {
      setError('Please select a rental package');
      return;
    }
    if (selectedPackage === 'custom' && (!startDate || !endDate)) {
      setError('Please select start and end dates');
      return;
    }
    setShowBookingForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!customerName || customerName.length < 2) {
      setError('Please enter a valid name');
      return;
    }
    if (!customerPhone || customerPhone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    if (!customerEmail || !customerEmail.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    if (!deliveryAddress || deliveryAddress.length < 10) {
      setError('Please enter a complete delivery address');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Prepare booking data for API
      const bookingData = {
        device_type: selectedDevice,
        start_date: startDate,
        end_date: endDate,
        rental_days: customDays,
        package_type: selectedPackage || 'custom',
        base_price: totalPrice - (extraControllers * 50),
        total_price: totalPrice,
        savings: savings,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        delivery_address: deliveryAddress,
        extra_controllers: extraControllers,
        controller_cost: extraControllers * 50,
        notes: `Device: ${selectedDevice === 'vr' ? 'Meta Quest 3' : 'PS5'}`
      };

      // Make API call to save rental booking
      const API_BASE_URL = process.env.REACT_APP_API_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/rentals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bookingData)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Booking failed');
      }
      
      setBookingId(result.booking_id || 'RNT' + Math.floor(Math.random() * 100000));
      setShowBookingForm(false);
      setShowSuccessModal(true);

    } catch (err) {
      setError(err.message || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate('/');
  };

  return (
    <div className="rental-page">
      <Navbar showCenter={false} />
      
      {/* Animated Background */}
      <div className="rental-bg-effects">
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
            >
              <div className="success-animation">
                <div className="success-checkmark">
                  <FiCheck className="checkmark-icon" />
                </div>
                <div className="success-ripple"></div>
                <div className="success-ripple delay-1"></div>
              </div>
              
              <h2 className="success-title">Rental Booked! 🎉</h2>
              <p className="success-subtitle">Your Meta Quest 3 will be delivered soon!</p>
              
              <div className="success-details">
                <div className="detail-card">
                  <div className="detail-row">
                    <span className="detail-label">Booking ID</span>
                    <span className="detail-value highlight">#{bookingId}</span>
                  </div>
                  <div className="detail-divider"></div>
                  <div className="detail-row">
                    <span className="detail-label">📅 Rental Period</span>
                    <span className="detail-value">{customDays} day{customDays > 1 ? 's' : ''}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">🗓️ Dates</span>
                    <span className="detail-value">{startDate} to {endDate}</span>
                  </div>
                  <div className="detail-divider"></div>
                  <div className="detail-row total">
                    <span className="detail-label">Total Amount</span>
                    <span className="detail-value price">₹{totalPrice}</span>
                  </div>
                </div>
              </div>
              
              <button className="btn-success-action" onClick={handleSuccessClose}>
                Return Home
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container rental-container">
        {/* Hero Section */}
        <motion.div 
          className="rental-hero"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="hero-badge">
            <FiPackage className="badge-icon" />
            Device Rental
          </div>
          <h1 className="rental-title">Rent Gaming Devices</h1>
          <p className="rental-subtitle">Experience premium VR and PS5 gaming at home with flexible rental plans</p>
          
          {/* Device Selection Tabs */}
          <div className="device-selection-tabs">
            <button 
              className={`device-tab ${selectedDevice === 'vr' ? 'active' : ''}`}
              onClick={() => {
                setSelectedDevice('vr');
                setSelectedPackage(null);
                setExtraControllers(0);
              }}
            >
              <FiPackage />
              <span>Meta Quest 3 VR</span>
            </button>
            <button 
              className={`device-tab ${selectedDevice === 'ps5' ? 'active' : ''}`}
              onClick={() => {
                setSelectedDevice('ps5');
                setSelectedPackage(null);
                setExtraControllers(0);
              }}
            >
              <FiPackage />
              <span>PS5 Console</span>
            </button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="rental-content">
          {/* Device Info Card */}
          <motion.div 
            className="device-info-card"
            key={selectedDevice}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="device-image-container">
              <div className="device-image-placeholder">
                <FiPackage className="device-placeholder-icon" />
                <span>{selectedDevice === 'ps5' ? 'PlayStation 5' : 'Meta Quest 3'}</span>
              </div>
            </div>
            <div className="device-details">
              <h3 className="device-name">
                {selectedDevice === 'ps5' ? 'PlayStation 5 Console' : 'Meta Quest 3 VR Headset'}
              </h3>
              <p className="device-description">
                {selectedDevice === 'ps5' 
                  ? 'Experience next-gen gaming with PlayStation 5. Ultra-high-speed SSD, stunning 4K graphics, and an extensive game library. Perfect for gaming sessions with friends and family.'
                  : 'Immerse yourself in cutting-edge virtual reality with Meta Quest 3. Features high-resolution display, advanced hand tracking, and access to hundreds of VR games and experiences.'
                }
              </p>
              <div className="device-features">
                {selectedDevice === 'ps5' ? (
                  <>
                    <div className="feature-item">
                      <FiCheck className="feature-icon" />
                      <span>1 Controller Included</span>
                    </div>
                    <div className="feature-item">
                      <FiCheck className="feature-icon" />
                      <span>Latest Games Available</span>
                    </div>
                    <div className="feature-item">
                      <FiCheck className="feature-icon" />
                      <span>HDMI & Power Cables</span>
                    </div>
                    <div className="feature-item">
                      <FiCheck className="feature-icon" />
                      <span>Sanitized & Tested</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="feature-item">
                      <FiCheck className="feature-icon" />
                      <span>128GB Storage</span>
                    </div>
                    <div className="feature-item">
                      <FiCheck className="feature-icon" />
                      <span>Controllers Included</span>
                    </div>
                    <div className="feature-item">
                      <FiCheck className="feature-icon" />
                      <span>Charging Cable</span>
                    </div>
                    <div className="feature-item">
                      <FiCheck className="feature-icon" />
                      <span>Sanitized & Ready</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Booking Section */}
          <motion.div 
            className="booking-section"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {!showBookingForm ? (
              <div className="package-selection">
                <h2 className="section-title">Choose Your Rental Plan</h2>
                
                {/* Preset Packages */}
                <div className="packages-grid">
                  {selectedDevice === 'ps5' ? (
                    <>
                      {/* PS5 Daily Package */}
                      <motion.div 
                        className={`package-card ${selectedPackage === 'daily' ? 'selected' : ''}`}
                        onClick={() => handlePackageSelect('daily')}
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {selectedPackage === 'daily' && (
                          <div className="selected-indicator">
                            <FiCheck />
                          </div>
                        )}
                        <div className="package-header">
                          <FiClock className="package-icon" />
                          <h3 className="package-name">Daily</h3>
                        </div>
                        <div className="package-price">
                          <span className="price-currency">₹</span>
                          <span className="price-amount">400</span>
                          <span className="price-period">/day</span>
                        </div>
                        <p className="package-desc">Perfect for gaming sessions</p>
                        <div className="package-duration">1 Day Rental</div>
                        <div className="package-note">1 controller included</div>
                      </motion.div>

                      <motion.div 
                        className={`package-card popular ${selectedPackage === 'weekly' ? 'selected' : ''}`}
                        onClick={() => handlePackageSelect('weekly')}
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="popular-badge">Most Popular</div>
                        {selectedPackage === 'weekly' && (
                          <div className="selected-indicator">
                            <FiCheck />
                          </div>
                        )}
                        <div className="package-header">
                          <FiCalendar className="package-icon" />
                          <h3 className="package-name">Weekly</h3>
                        </div>
                        <div className="package-price">
                          <span className="price-currency">₹</span>
                          <span className="price-amount">2,400</span>
                          <span className="price-period">/week</span>
                        </div>
                        <p className="package-desc">Best value for extended play</p>
                        <div className="package-duration">7 Days Rental</div>
                        <div className="package-note">1 controller included</div>
                        <div className="savings-badge">
                          <FiTrendingDown />
                          Save ₹400
                        </div>
                      </motion.div>
                      
                      {/* Extra Controllers Section for PS5 */}
                      {selectedPackage && (
                        <motion.div 
                          className="extra-controllers-section"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <h4>Need Extra Controllers?</h4>
                          <p className="extra-desc">₹50 per controller per day</p>
                          <div className="controller-selector">
                            {[0, 1, 2, 3, 4].map(num => (
                              <button
                                key={num}
                                className={`controller-btn ${extraControllers === num ? 'active' : ''}`}
                                onClick={() => setExtraControllers(num)}
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* VR Packages */}
                      <motion.div 
                        className={`package-card ${selectedPackage === 'daily' ? 'selected' : ''}`}
                        onClick={() => handlePackageSelect('daily')}
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {selectedPackage === 'daily' && (
                          <div className="selected-indicator">
                            <FiCheck />
                          </div>
                        )}
                        <div className="package-header">
                          <FiClock className="package-icon" />
                          <h3 className="package-name">Daily</h3>
                        </div>
                        <div className="package-price">
                          <span className="price-currency">₹</span>
                          <span className="price-amount">350</span>
                          <span className="price-period">/day</span>
                        </div>
                        <p className="package-desc">Perfect for trying out VR</p>
                        <div className="package-duration">1 Day Rental</div>
                      </motion.div>

                      <motion.div 
                        className={`package-card popular ${selectedPackage === 'weekly' ? 'selected' : ''}`}
                        onClick={() => handlePackageSelect('weekly')}
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="popular-badge">Most Popular</div>
                        {selectedPackage === 'weekly' && (
                          <div className="selected-indicator">
                            <FiCheck />
                          </div>
                        )}
                        <div className="package-header">
                          <FiCalendar className="package-icon" />
                          <h3 className="package-name">Weekly</h3>
                        </div>
                        <div className="package-price">
                          <span className="price-currency">₹</span>
                          <span className="price-amount">2,100</span>
                          <span className="price-period">/week</span>
                        </div>
                        <p className="package-desc">Best value for enthusiasts</p>
                        <div className="package-duration">7 Days Rental</div>
                        <div className="savings-badge">
                          <FiTrendingDown />
                          Save ₹350
                        </div>
                      </motion.div>

                      <motion.div 
                        className={`package-card ${selectedPackage === 'monthly' ? 'selected' : ''}`}
                        onClick={() => handlePackageSelect('monthly')}
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {selectedPackage === 'monthly' && (
                          <div className="selected-indicator">
                            <FiCheck />
                          </div>
                        )}
                        <div className="package-header">
                          <FiShoppingBag className="package-icon" />
                          <h3 className="package-name">Monthly</h3>
                        </div>
                        <div className="package-price">
                          <span className="price-currency">₹</span>
                          <span className="price-amount">7,500</span>
                          <span className="price-period">/month</span>
                        </div>
                        <p className="package-desc">Maximum savings & flexibility</p>
                        <div className="package-duration">30 Days Rental</div>
                        <div className="savings-badge">
                          <FiTrendingDown />
                          Save ₹3,000
                        </div>
                      </motion.div>
                    </>
                  )}
                </div>

                {/* Custom Duration */}
                <div className="custom-duration-section">
                  <div className="section-divider">
                    <span>Or</span>
                  </div>
                  
                  <motion.div 
                    className={`custom-package-card ${selectedPackage === 'custom' ? 'active' : ''}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="custom-header">
                      <FiCalendar className="custom-icon" />
                      <div>
                        <h3 className="custom-title">Custom Duration</h3>
                        <p className="custom-subtitle">Pick your own start and end dates</p>
                      </div>
                      <button 
                        className={`custom-toggle ${selectedPackage === 'custom' ? 'active' : ''}`}
                        onClick={() => handlePackageSelect('custom')}
                      >
                        {selectedPackage === 'custom' ? 'Selected' : 'Select'}
                      </button>
                    </div>

                    {selectedPackage === 'custom' && (
                      <motion.div 
                        className="custom-dates"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="date-inputs">
                          <div className="date-input-group">
                            <label>Start Date</label>
                            <input 
                              type="date"
                              value={startDate}
                              min={getToday()}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="date-input"
                            />
                          </div>
                          <div className="date-input-group">
                            <label>End Date</label>
                            <input 
                              type="date"
                              value={endDate}
                              min={startDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="date-input"
                            />
                          </div>
                        </div>
                        
                        {startDate && endDate && (
                          <div className="duration-info">
                            <FiInfo className="info-icon" />
                            <span>Total: {customDays} day{customDays > 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                </div>

                {/* Price Summary */}
                {selectedPackage && (
                  <motion.div 
                    className="price-summary"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="summary-row">
                      <span className="summary-label">Rental Duration</span>
                      <span className="summary-value">{customDays} day{customDays > 1 ? 's' : ''}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Rate per Day</span>
                      <span className="summary-value">₹{Math.round(totalPrice / customDays)}</span>
                    </div>
                    {savings > 0 && (
                      <div className="summary-row savings">
                        <span className="summary-label">
                          <FiTrendingDown className="savings-icon" />
                          You Save
                        </span>
                        <span className="summary-value">₹{savings}</span>
                      </div>
                    )}
                    <div className="summary-divider"></div>
                    <div className="summary-row total">
                      <span className="summary-label">Total Amount</span>
                      <span className="summary-value">₹{totalPrice}</span>
                    </div>
                  </motion.div>
                )}

                {error && (
                  <motion.div 
                    className="alert alert-error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <FiX className="alert-icon" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <button 
                  className="proceed-btn"
                  onClick={handleProceedToBooking}
                  disabled={!selectedPackage || (selectedPackage === 'custom' && (!startDate || !endDate))}
                >
                  <FiShoppingBag />
                  Proceed to Booking
                  <span className="btn-price">₹{totalPrice}</span>
                </button>
              </div>
            ) : (
              <div className="booking-form-container">
                <button className="back-to-packages" onClick={() => setShowBookingForm(false)}>
                  ← Back to Packages
                </button>
                
                <h2 className="form-title">Complete Your Booking</h2>
                
                <div className="booking-summary-mini">
                  <div className="mini-item">
                    <span>📦 Meta Quest 3</span>
                  </div>
                  <div className="mini-item">
                    <span>📅 {customDays} day{customDays > 1 ? 's' : ''}</span>
                  </div>
                  <div className="mini-item">
                    <span>💰 ₹{totalPrice}</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="rental-form">
                  <div className="form-group">
                    <label className="form-label">
                      <FiUser className="label-icon" />
                      Full Name
                    </label>
                    <input 
                      type="text"
                      className="form-input"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        <FiPhone className="label-icon" />
                        Phone Number
                      </label>
                      <input 
                        type="tel"
                        className="form-input"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Enter phone number"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <FiMail className="label-icon" />
                        Email Address
                      </label>
                      <input 
                        type="email"
                        className="form-input"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <FiMapPin className="label-icon" />
                      Delivery Address
                    </label>
                    <textarea 
                      className="form-input textarea"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Enter complete delivery address with landmark"
                      rows="3"
                      required
                    />
                  </div>

                  {error && (
                    <motion.div 
                      className="alert alert-error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <FiX className="alert-icon" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <button 
                    type="submit"
                    className="submit-rental-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="btn-spinner"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiCheck />
                        Confirm Rental Booking
                        <span className="btn-price">₹{totalPrice}</span>
                      </>
                    )}
                  </button>

                  <p className="terms-note">
                    📌 Device will be delivered to your address. Security deposit may be required.
                  </p>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RentalPage;
