'use client';
// @ts-nocheck

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiClock, FiCheck, FiX, FiInfo, FiShoppingBag, FiTrendingDown, FiPackage, FiUser, FiPhone, FiMail, FiMapPin, FiShield, FiTruck, FiHeadphones, FiStar, FiZap, FiMonitor, FiChevronRight, FiArrowLeft } from 'react-icons/fi';
import { getToday } from '@/utils/helpers';
import '@/styles/RentalPage.css';

const RentalPage = () => {
  const router = useRouter();
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState('');
  const [customDays, setCustomDays] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [savings, setSavings] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [extraControllers, setExtraControllers] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookingId, setBookingId] = useState(null);

  const vrPricingTiers = {
    daily: { days: 1, price: 350, perDay: 350 },
    weekly: { days: 7, price: 2100, perDay: 300 },
    monthly: { days: 30, price: 7500, perDay: 250 }
  };

  const ps5PricingTiers = {
    daily: { days: 1, price: 400, perDay: 400 },
    weekly: { days: 7, price: 2400, perDay: 343 }
  };

  const controllerPricePerDay = 50;

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    return Math.ceil(Math.abs(e - s) / (1000 * 60 * 60 * 24)) + 1;
  };

  const calculatePrice = (days) => {
    if (days <= 0) return { price: 0, perDay: 0, savings: 0 };
    const dailyRate = selectedDevice === 'ps5' ? 400 : 350;
    let price, packageType;

    if (selectedDevice === 'ps5') {
      if (days >= 7) {
        const weeks = Math.floor(days / 7);
        const rem = days % 7;
        price = (weeks * 2400) + (rem * 400);
        packageType = 'weekly';
      } else {
        price = days * 400;
        packageType = 'daily';
      }
      price += extraControllers * controllerPricePerDay * days;
    } else {
      if (days >= 30) {
        const months = Math.floor(days / 30);
        const rem = days % 30;
        price = (months * 7500) + (rem * 350);
        packageType = 'monthly';
      } else if (days >= 7) {
        const weeks = Math.floor(days / 7);
        const rem = days % 7;
        price = (weeks * 2100) + (rem * 350);
        packageType = 'weekly';
      } else {
        price = days * 350;
        packageType = 'daily';
      }
    }
    return { price, perDay: price / days, savings: Math.max(0, (days * dailyRate) - price), package: packageType };
  };

  useEffect(() => {
    if (!selectedDevice) return;
    if (selectedPackage === 'custom' && startDate && endDate) {
      const days = calculateDays(startDate, endDate);
      const { price, savings: s } = calculatePrice(days);
      setCustomDays(days);
      setTotalPrice(price);
      setSavings(s);
    } else if (selectedPackage && selectedPackage !== 'custom') {
      const tiers = selectedDevice === 'ps5' ? ps5PricingTiers : vrPricingTiers;
      const tier = tiers[selectedPackage];
      if (tier) {
        const { price, savings: s } = calculatePrice(tier.days);
        setTotalPrice(price);
        setSavings(s);
        setCustomDays(tier.days);
      }
    }
    // eslint-disable-next-line
  }, [startDate, endDate, selectedPackage, selectedDevice, extraControllers]);

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
    setError(null);
    if (pkg !== 'custom') {
      const tiers = selectedDevice === 'ps5' ? ps5PricingTiers : vrPricingTiers;
      const tier = tiers[pkg];
      if (tier) {
        setCustomDays(tier.days);
        const today = new Date();
        const end = new Date(today);
        end.setDate(end.getDate() + tier.days - 1);
        setStartDate(getToday());
        setEndDate(end.toISOString().split('T')[0]);
      }
    } else {
      setStartDate(getToday());
      setEndDate('');
    }
  };

  const handleProceedToBooking = () => {
    if (!selectedPackage) { setError('Please select a rental package'); return; }
    if (selectedPackage === 'custom' && (!startDate || !endDate)) { setError('Please select start and end dates'); return; }
    setShowBookingForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName || customerName.length < 2) { setError('Please enter a valid name'); return; }
    if (!customerPhone || customerPhone.length < 10) { setError('Please enter a valid phone number'); return; }
    if (!customerEmail || !customerEmail.includes('@')) { setError('Please enter a valid email'); return; }
    if (!deliveryAddress || deliveryAddress.length < 10) { setError('Please enter a complete delivery address'); return; }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/rentals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          device_type: selectedDevice, start_date: startDate, end_date: endDate,
          rental_days: customDays, package_type: selectedPackage || 'custom',
          total_price: totalPrice, savings,
          customer_name: customerName, customer_phone: customerPhone,
          customer_email: customerEmail, delivery_address: deliveryAddress,
          extra_controllers: extraControllers
        })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Booking failed');
      setBookingId(result.booking_id || 'RNT' + Math.floor(Math.random() * 100000));
      setShowBookingForm(false);
      setShowSuccessModal(true);
    } catch (err) {
      setError(err.message || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => { setShowSuccessModal(false); router.push('/'); };

  const handleBackToDevices = () => {
    setSelectedDevice(null);
    setSelectedPackage(null);
    setShowBookingForm(false);
    setTotalPrice(0);
    setSavings(0);
    setExtraControllers(0);
  };

  return (
    <div className="rp">
<div className="rp-bg">
        <div className="rp-bg-grad"></div>
        <div className="rp-bg-dots"></div>
        <div className="rp-orb rp-orb1"></div>
        <div className="rp-orb rp-orb2"></div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div className="rp-modal-overlay" onClick={handleSuccessClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="rp-modal" onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.85, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 40 }}>
              <div className="rp-modal-check"><FiCheck size={36} /></div>
              <h2>Rental Booked! 🎉</h2>
              <p className="rp-modal-sub">Your {selectedDevice === 'ps5' ? 'PlayStation 5' : 'Meta Quest 3'} will be delivered soon!</p>
              <div className="rp-modal-details">
                <div className="rp-modal-row"><span>Booking ID</span><span className="rp-highlight">#{bookingId}</span></div>
                <div className="rp-modal-sep"></div>
                <div className="rp-modal-row"><span>📅 Period</span><span>{customDays} day{customDays > 1 ? 's' : ''}</span></div>
                <div className="rp-modal-row"><span>🗓️ Dates</span><span>{startDate} → {endDate}</span></div>
                <div className="rp-modal-sep"></div>
                <div className="rp-modal-row rp-modal-total"><span>Total</span><span>₹{totalPrice.toLocaleString()}</span></div>
              </div>
              <button className="rp-modal-btn" onClick={handleSuccessClose}>Return Home</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rp-content">
        {/* ─── HERO ─── */}
        <motion.section className="rp-hero" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="rp-hero-badge"><FiPackage /> Premium Device Rental</div>
          <h1 className="rp-hero-title">Rent Premium Gaming<span> Devices</span></h1>
          <p className="rp-hero-sub">Next-gen VR & console gaming delivered to your doorstep. Sanitized, tested, ready to play.</p>
          <div className="rp-trust">
            <div className="rp-trust-item"><FiTruck /><span>Free Delivery</span></div>
            <div className="rp-trust-item"><FiShield /><span>Sanitized</span></div>
            <div className="rp-trust-item"><FiHeadphones /><span>24/7 Support</span></div>
            <div className="rp-trust-item"><FiStar /><span>Premium Quality</span></div>
          </div>
        </motion.section>

        {/* ─── DEVICE SELECTION ─── */}
        {!selectedDevice && (
          <motion.section className="rp-devices" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h2 className="rp-heading">Choose Your Device</h2>
            <p className="rp-subheading">Select the gaming device you'd like to rent</p>

            <div className="rp-device-grid">
              {/* VR */}
              <motion.div className="rp-device-card rp-vr" whileHover={{ y: -8, scale: 1.015 }} whileTap={{ scale: 0.98 }} onClick={() => setSelectedDevice('vr')}>
                <div className="rp-device-glow rp-glow-vr"></div>
                <div className="rp-device-tag rp-tag-hot">🔥 Popular</div>
                <div className="rp-device-visual">
                  <div className="rp-device-icon rp-icon-vr"><FiPackage size={52} /></div>
                  <span className="rp-device-label">VR</span>
                </div>
                <div className="rp-device-body">
                  <h3>Meta Quest 3</h3>
                  <p className="rp-device-tagline">Immersive Virtual Reality</p>
                  <div className="rp-device-specs">
                    <span>🎮 128GB Storage</span>
                    <span>🕹️ Controllers Included</span>
                    <span>📱 Standalone VR</span>
                    <span>🎯 Hand Tracking</span>
                  </div>
                  <div className="rp-device-pricing">
                    <small>Starting from</small>
                    <strong>₹350<span>/day</span></strong>
                  </div>
                  <div className="rp-device-cta rp-cta-vr">Rent Now <FiChevronRight /></div>
                </div>
              </motion.div>

              {/* PS5 */}
              <motion.div className="rp-device-card rp-ps5" whileHover={{ y: -8, scale: 1.015 }} whileTap={{ scale: 0.98 }} onClick={() => setSelectedDevice('ps5')}>
                <div className="rp-device-glow rp-glow-ps5"></div>
                <div className="rp-device-tag rp-tag-new">✨ New</div>
                <div className="rp-device-visual">
                  <div className="rp-device-icon rp-icon-ps5"><FiMonitor size={52} /></div>
                  <span className="rp-device-label">PS5</span>
                </div>
                <div className="rp-device-body">
                  <h3>PlayStation 5</h3>
                  <p className="rp-device-tagline">Next-Gen Console Gaming</p>
                  <div className="rp-device-specs">
                    <span>🎮 DualSense Controller</span>
                    <span>🖥️ 4K HDR Output</span>
                    <span>⚡ Ultra-Fast SSD</span>
                    <span>🎮 Latest Games</span>
                  </div>
                  <div className="rp-device-pricing">
                    <small>Starting from</small>
                    <strong>₹400<span>/day</span></strong>
                  </div>
                  <div className="rp-device-cta rp-cta-ps5">Rent Now <FiChevronRight /></div>
                </div>
              </motion.div>
            </div>

            {/* Why Rent */}
            <div className="rp-why">
              <h3>Why Rent With GameSpot?</h3>
              <div className="rp-why-grid">
                <div className="rp-why-card"><div className="rp-why-icon"><FiTruck /></div><h4>Doorstep Delivery</h4><p>We deliver & pick up from your location</p></div>
                <div className="rp-why-card"><div className="rp-why-icon"><FiShield /></div><h4>Fully Sanitized</h4><p>Every device thoroughly cleaned before delivery</p></div>
                <div className="rp-why-card"><div className="rp-why-icon"><FiZap /></div><h4>Ready to Play</h4><p>Pre-loaded with popular games & accessories</p></div>
                <div className="rp-why-card"><div className="rp-why-icon"><FiHeadphones /></div><h4>Full Support</h4><p>Our team is available 24/7 to assist you</p></div>
              </div>
            </div>
          </motion.section>
        )}

        {/* ─── BOOKING FLOW ─── */}
        {selectedDevice && (
          <motion.section className="rp-booking" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <button className="rp-back" onClick={handleBackToDevices}><FiArrowLeft /> Back to Devices</button>

            {/* Selected Device Banner */}
            <div className={`rp-selected ${selectedDevice === 'ps5' ? 'rp-sel-ps5' : 'rp-sel-vr'}`}>
              <div className="rp-sel-icon">{selectedDevice === 'ps5' ? <FiMonitor size={28} /> : <FiPackage size={28} />}</div>
              <div className="rp-sel-info">
                <h2>{selectedDevice === 'ps5' ? 'PlayStation 5' : 'Meta Quest 3 VR'}</h2>
                <p>{selectedDevice === 'ps5' ? '4K HDR • DualSense Controller • Latest Games' : '128GB • Hand Tracking • Standalone VR'}</p>
              </div>
              <div className="rp-sel-features">
                <span><FiCheck /> {selectedDevice === 'ps5' ? '1 Controller' : 'Controllers'}</span>
                <span><FiCheck /> {selectedDevice === 'ps5' ? 'HDMI Cable' : 'Charger'}</span>
                <span><FiCheck /> Sanitized</span>
              </div>
            </div>

            {!showBookingForm ? (
              <div className="rp-plans">
                <h2 className="rp-heading">Choose Your Plan</h2>

                <div className="rp-pkg-grid">
                  {selectedDevice === 'ps5' ? (
                    <>
                      <motion.div className={`rp-pkg ${selectedPackage === 'daily' ? 'rp-pkg-on' : ''}`}
                        onClick={() => handlePackageSelect('daily')} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
                        {selectedPackage === 'daily' && <div className="rp-pkg-check"><FiCheck /></div>}
                        <div className="rp-pkg-icon"><FiClock size={22} /></div>
                        <h3>Daily</h3>
                        <div className="rp-pkg-price"><sup>₹</sup>400<sub>/day</sub></div>
                        <p>1 Day Rental</p>
                        <div className="rp-pkg-note">1 controller included</div>
                      </motion.div>

                      <motion.div className={`rp-pkg rp-pkg-pop ${selectedPackage === 'weekly' ? 'rp-pkg-on' : ''}`}
                        onClick={() => handlePackageSelect('weekly')} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
                        <div className="rp-pkg-ribbon">Best Value</div>
                        {selectedPackage === 'weekly' && <div className="rp-pkg-check"><FiCheck /></div>}
                        <div className="rp-pkg-icon"><FiCalendar size={22} /></div>
                        <h3>Weekly</h3>
                        <div className="rp-pkg-price"><sup>₹</sup>2,400<sub>/week</sub></div>
                        <p>7 Days Rental</p>
                        <div className="rp-pkg-note">1 controller included</div>
                        <div className="rp-pkg-save"><FiTrendingDown /> Save ₹400</div>
                      </motion.div>

                      {selectedPackage && (
                        <motion.div className="rp-extras" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                          <h4><FiZap /> Extra Controllers</h4>
                          <p>₹50 per controller per day</p>
                          <div className="rp-extras-btns">
                            {[0, 1, 2, 3, 4].map(n => (
                              <button key={n} className={extraControllers === n ? 'active' : ''} onClick={() => setExtraControllers(n)}>{n}</button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </>
                  ) : (
                    <>
                      <motion.div className={`rp-pkg ${selectedPackage === 'daily' ? 'rp-pkg-on' : ''}`}
                        onClick={() => handlePackageSelect('daily')} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
                        {selectedPackage === 'daily' && <div className="rp-pkg-check"><FiCheck /></div>}
                        <div className="rp-pkg-icon"><FiClock size={22} /></div>
                        <h3>Daily</h3>
                        <div className="rp-pkg-price"><sup>₹</sup>350<sub>/day</sub></div>
                        <p>1 Day Rental</p>
                      </motion.div>

                      <motion.div className={`rp-pkg rp-pkg-pop ${selectedPackage === 'weekly' ? 'rp-pkg-on' : ''}`}
                        onClick={() => handlePackageSelect('weekly')} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
                        <div className="rp-pkg-ribbon">Best Value</div>
                        {selectedPackage === 'weekly' && <div className="rp-pkg-check"><FiCheck /></div>}
                        <div className="rp-pkg-icon"><FiCalendar size={22} /></div>
                        <h3>Weekly</h3>
                        <div className="rp-pkg-price"><sup>₹</sup>2,100<sub>/week</sub></div>
                        <p>7 Days Rental</p>
                        <div className="rp-pkg-save"><FiTrendingDown /> Save ₹350</div>
                      </motion.div>

                      <motion.div className={`rp-pkg ${selectedPackage === 'monthly' ? 'rp-pkg-on' : ''}`}
                        onClick={() => handlePackageSelect('monthly')} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
                        {selectedPackage === 'monthly' && <div className="rp-pkg-check"><FiCheck /></div>}
                        <div className="rp-pkg-icon"><FiShoppingBag size={22} /></div>
                        <h3>Monthly</h3>
                        <div className="rp-pkg-price"><sup>₹</sup>7,500<sub>/month</sub></div>
                        <p>30 Days Rental</p>
                        <div className="rp-pkg-save"><FiTrendingDown /> Save ₹3,000</div>
                      </motion.div>
                    </>
                  )}
                </div>

                {/* Custom */}
                <div className="rp-custom">
                  <div className="rp-divider"><span>Or choose custom dates</span></div>
                  <div className={`rp-custom-card ${selectedPackage === 'custom' ? 'rp-custom-on' : ''}`}>
                    <div className="rp-custom-top">
                      <div className="rp-custom-left"><FiCalendar size={22} /><div><h4>Custom Duration</h4><p>Pick your own dates</p></div></div>
                      <button className={`rp-custom-btn ${selectedPackage === 'custom' ? 'on' : ''}`} onClick={() => handlePackageSelect('custom')}>
                        {selectedPackage === 'custom' ? '✓ Selected' : 'Select'}
                      </button>
                    </div>
                    {selectedPackage === 'custom' && (
                      <motion.div className="rp-custom-body" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                        <div className="rp-date-row">
                          <div className="rp-date-group"><label>Start Date</label><input type="date" value={startDate} min={getToday()} onChange={(e) => setStartDate(e.target.value)} /></div>
                          <div className="rp-date-group"><label>End Date</label><input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} /></div>
                        </div>
                        {startDate && endDate && <div className="rp-date-info"><FiInfo /> {customDays} day{customDays > 1 ? 's' : ''} selected</div>}
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Summary */}
                {selectedPackage && (
                  <motion.div className="rp-summary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="rp-sum-row"><span>Duration</span><span>{customDays} day{customDays > 1 ? 's' : ''}</span></div>
                    <div className="rp-sum-row"><span>Rate/Day</span><span>₹{Math.round(totalPrice / customDays)}</span></div>
                    {extraControllers > 0 && <div className="rp-sum-row"><span>Controllers ({extraControllers})</span><span>₹{extraControllers * controllerPricePerDay * customDays}</span></div>}
                    {savings > 0 && <div className="rp-sum-row rp-sum-save"><span><FiTrendingDown /> You Save</span><span>₹{savings.toLocaleString()}</span></div>}
                    <div className="rp-sum-line"></div>
                    <div className="rp-sum-row rp-sum-total"><span>Total</span><span>₹{totalPrice.toLocaleString()}</span></div>
                  </motion.div>
                )}

                {error && <div className="rp-alert"><FiX /> {error}</div>}

                <button className="rp-proceed" onClick={handleProceedToBooking}
                  disabled={!selectedPackage || (selectedPackage === 'custom' && (!startDate || !endDate))}>
                  <FiShoppingBag /> Proceed to Booking
                  {totalPrice > 0 && <span className="rp-btn-tag">₹{totalPrice.toLocaleString()}</span>}
                </button>
              </div>
            ) : (
              /* ─── BOOKING FORM ─── */
              <motion.div className="rp-form-wrap" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <button className="rp-back" onClick={() => setShowBookingForm(false)}><FiArrowLeft /> Back to Plans</button>
                <h2 className="rp-heading">Complete Your Booking</h2>
                <div className="rp-form-mini">
                  <span>📦 {selectedDevice === 'ps5' ? 'PS5' : 'Meta Quest 3'}</span>
                  <span>📅 {customDays} day{customDays > 1 ? 's' : ''}</span>
                  <span>💰 ₹{totalPrice.toLocaleString()}</span>
                </div>
                <form onSubmit={handleSubmit} className="rp-form">
                  <div className="rp-field"><label><FiUser /> Full Name</label><input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Your full name" required /></div>
                  <div className="rp-field-row">
                    <div className="rp-field"><label><FiPhone /> Phone</label><input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone number" required /></div>
                    <div className="rp-field"><label><FiMail /> Email</label><input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Email address" required /></div>
                  </div>
                  <div className="rp-field"><label><FiMapPin /> Delivery Address</label><textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Complete address with landmark" rows="3" required /></div>
                  {error && <div className="rp-alert"><FiX /> {error}</div>}
                  <button type="submit" className="rp-submit" disabled={loading}>
                    {loading ? <><div className="rp-spinner"></div> Processing...</> : <><FiCheck /> Confirm Rental <span className="rp-btn-tag">₹{totalPrice.toLocaleString()}</span></>}
                  </button>
                  <p className="rp-terms">📌 Device delivered to your address. Security deposit may be required.</p>
                </form>
              </motion.div>
            )}
          </motion.section>
        )}
      </div>
</div>
  );
};

export default RentalPage;
