import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlay, FiX, FiCalendar, FiMapPin, FiTruck, FiDollarSign, 
  FiCheck, FiUser, FiPhone, FiMail, FiPackage, FiUsers,
  FiMonitor, FiCamera, FiTrendingUp, FiAward, FiClock,
  FiChevronRight, FiInfo, FiZap, FiStar, FiLoader
} from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getToday } from '../utils/helpers';
import '../styles/CollegeSetupPage.css';

// GameSpot Kodungallur Location
const GAMESPOT_LOCATION = {
  name: 'GameSpot Kodungallur',
  address: 'Kodungallur, Thrissur, Kerala, India',
  lat: 10.2167,
  lng: 76.2000
};

// Sample college data with videos and images
const colleges = [
  {
    id: 1,
    name: 'St. Joseph\'s College',
    location: 'Bangalore, Karnataka',
    date: 'December 2025',
    students: '500+',
    duration: '3 days',
    thumbnail: '/images/colleges/stjoseph-thumb.jpg',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Replace with actual video
    highlights: ['4 PS5 Stations', '2 VR Zones', 'Driving Simulator', 'Live Tournaments'],
    rating: 4.9,
    feedback: 'Amazing experience! Students loved it.'
  },
  {
    id: 2,
    name: 'Christ University',
    location: 'Bangalore, Karnataka',
    date: 'November 2025',
    students: '800+',
    duration: '5 days',
    thumbnail: '/images/colleges/christ-thumb.jpg',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    highlights: ['4 PS5 Stations', '2 VR Zones', 'Driving Simulator', 'Gaming Lounge'],
    rating: 5.0,
    feedback: 'Professional setup, students had a blast!'
  },
  {
    id: 3,
    name: 'PES University',
    location: 'Bangalore, Karnataka',
    date: 'October 2025',
    students: '600+',
    duration: '4 days',
    thumbnail: '/images/colleges/pes-thumb.jpg',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    highlights: ['4 PS5 Stations', '2 VR Zones', 'Driving Simulator', 'Esports Arena'],
    rating: 4.8,
    feedback: 'Highly professional and engaging setup.'
  },
  {
    id: 4,
    name: 'RV College of Engineering',
    location: 'Bangalore, Karnataka',
    date: 'September 2025',
    students: '700+',
    duration: '5 days',
    thumbnail: '/images/colleges/rv-thumb.jpg',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    highlights: ['4 PS5 Stations', '2 VR Zones', 'Driving Simulator', 'Tech Fest'],
    rating: 4.9,
    feedback: 'Seamless execution, great team!'
  },
  {
    id: 5,
    name: 'BMS College of Engineering',
    location: 'Bangalore, Karnataka',
    date: 'August 2025',
    students: '550+',
    duration: '3 days',
    thumbnail: '/images/colleges/bms-thumb.jpg',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    highlights: ['4 PS5 Stations', '2 VR Zones', 'Driving Simulator', 'Cultural Fest'],
    rating: 4.7,
    feedback: 'Students enjoyed every moment!'
  },
  {
    id: 6,
    name: 'JSS Science and Technology University',
    location: 'Mysore, Karnataka',
    date: 'July 2025',
    students: '450+',
    duration: '4 days',
    thumbnail: '/images/colleges/jss-thumb.jpg',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    highlights: ['4 PS5 Stations', '2 VR Zones', 'Driving Simulator', 'Gaming Marathon'],
    rating: 4.8,
    feedback: 'Outstanding service and equipment!'
  }
];

// Equipment pricing
const equipmentPricing = {
  ps5: { name: 'PS5 Gaming Station', pricePerDay: 400, total: 4, icon: '🎮' },
  vr: { name: 'VR Headset Zone', pricePerDay: 800, total: 2, icon: '🥽' },
  drivingSim: { name: 'Driving Simulator', pricePerDay: 1500, total: 1, icon: '🏎️' }
};

const CollegeSetupPage = () => {
  const navigate = useNavigate();
  
  // Refs for Google Maps
  const collegeInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const mapLoadedRef = useRef(false);
  
  // State
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  
  // Booking form state
  const [collegeName, setCollegeName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [distance, setDistance] = useState(10);
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState('');
  const [numberOfDays, setNumberOfDays] = useState(1);
  
  // Google Maps state
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [distanceError, setDistanceError] = useState('');
  
  // Equipment selection
  const [ps5Count, setPs5Count] = useState(4);
  const [vrCount, setVrCount] = useState(2);
  const [includeDrivingSim, setIncludeDrivingSim] = useState(true);
  
  // UI state
  const [activeSection, setActiveSection] = useState('showcase'); // showcase or booking
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');
  
  // Calculate number of days when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setNumberOfDays(diffDays > 0 ? diffDays : 1);
    }
  }, [startDate, endDate]);
  
  // Load Google Maps API
  useEffect(() => {
    if (mapLoadedRef.current) return;
    
    const loadGoogleMapsScript = () => {
      // Check if already loaded
      if (window.google && window.google.maps) {
        mapLoadedRef.current = true;
        initializeAutocomplete();
        return;
      }
      
      // Get API key from environment variable
      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
        console.warn('Google Maps API key not configured. Autocomplete will not work.');
        console.warn('Please add REACT_APP_GOOGLE_MAPS_API_KEY to your .env file');
        return;
      }
      
      // Load script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        mapLoadedRef.current = true;
        initializeAutocomplete();
      };
      script.onerror = () => {
        console.error('Failed to load Google Maps API. Check your API key and internet connection.');
      };
      document.head.appendChild(script);
    };
    
    loadGoogleMapsScript();
  }, []);
  
  // Initialize Google Places Autocomplete
  const initializeAutocomplete = () => {
    if (!collegeInputRef.current || !window.google) return;
    
    // Configure autocomplete for educational institutions in India
    const options = {
      types: ['establishment'],
      componentRestrictions: { country: 'in' },
      fields: ['name', 'formatted_address', 'geometry', 'place_id']
    };
    
    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      collegeInputRef.current,
      options
    );
    
    // Listen for place selection
    autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
  };
  
  // Handle place selection from autocomplete
  const handlePlaceSelect = () => {
    const place = autocompleteRef.current.getPlace();
    
    if (!place.geometry) {
      setDistanceError('Please select a valid location from the dropdown');
      return;
    }
    
    setSelectedPlace(place);
    setCollegeName(place.name);
    setLocation(place.formatted_address);
    setDistanceError('');
    
    // Calculate distance
    calculateDistance(place.geometry.location);
  };
  
  // Calculate distance using Google Maps Distance Matrix API
  const calculateDistance = (destination) => {
    if (!window.google) return;
    
    setIsCalculatingDistance(true);
    setDistanceError('');
    
    const service = new window.google.maps.DistanceMatrixService();
    const origin = new window.google.maps.LatLng(
      GAMESPOT_LOCATION.lat,
      GAMESPOT_LOCATION.lng
    );
    
    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [destination],
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC
      },
      (response, status) => {
        setIsCalculatingDistance(false);
        
        if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
          const distanceInMeters = response.rows[0].elements[0].distance.value;
          const distanceInKm = Math.ceil(distanceInMeters / 1000);
          setDistance(distanceInKm);
          setDistanceError('');
        } else {
          setDistanceError('Unable to calculate distance. Please enter manually.');
          setDistance(10); // Default fallback
        }
      }
    );
  };
  
  // Reinitialize autocomplete when switching to booking mode
  useEffect(() => {
    if (showBookingForm && collegeInputRef.current && window.google) {
      setTimeout(() => {
        initializeAutocomplete();
      }, 100);
    }
  }, [showBookingForm]);
  
  // Calculate transportation cost
  const calculateTransportCost = (distanceKm) => {
    if (distanceKm <= 10) {
      return 500;
    }
    const extraKm = distanceKm - 10;
    return 500 + (extraKm * 25);
  };
  
  // Calculate total price
  const calculateTotalPrice = () => {
    const ps5Total = ps5Count * equipmentPricing.ps5.pricePerDay * numberOfDays;
    const vrTotal = vrCount * equipmentPricing.vr.pricePerDay * numberOfDays;
    const drivingSimTotal = includeDrivingSim ? equipmentPricing.drivingSim.pricePerDay * numberOfDays : 0;
    const transportTotal = calculateTransportCost(distance);
    
    return {
      ps5: ps5Total,
      vr: vrTotal,
      drivingSim: drivingSimTotal,
      transport: transportTotal,
      subtotal: ps5Total + vrTotal + drivingSimTotal,
      total: ps5Total + vrTotal + drivingSimTotal + transportTotal
    };
  };
  
  const pricing = calculateTotalPrice();
  
  // Handle video modal
  const openVideoModal = (college) => {
    setSelectedCollege(college);
    setShowVideoModal(true);
  };
  
  const closeVideoModal = () => {
    setShowVideoModal(false);
    setTimeout(() => setSelectedCollege(null), 300);
  };
  
  // Handle booking
  const handleStartBooking = () => {
    setActiveSection('booking');
    setShowBookingForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleBackToShowcase = () => {
    setActiveSection('showcase');
    setShowBookingForm(false);
  };
  
  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Calculate pricing
      const days = numberOfDays;
      const equipmentCost = (ps5Count * equipmentPricing.ps5.pricePerDay * days) +
                           (vrCount * equipmentPricing.vr.pricePerDay * days) +
                           (includeDrivingSim ? equipmentPricing.drivingSim.pricePerDay * days : 0);
      const transportCost = Math.round(distance * 15 * 2); // ₹15/km round trip
      const totalCost = equipmentCost + transportCost;

      // Prepare booking data
      const bookingData = {
        contact_name: contactPerson,
        contact_phone: phone,
        contact_email: email,
        college_name: collegeName,
        college_address: location,
        college_city: selectedPlace?.city || '',
        college_state: selectedPlace?.state || 'Kerala',
        college_latitude: selectedPlace?.lat || null,
        college_longitude: selectedPlace?.lng || null,
        event_name: `${collegeName} Gaming Event`,
        event_type: 'college_fest',
        event_start_date: startDate,
        event_end_date: endDate || startDate,
        event_duration_days: days,
        expected_students: 500,
        setup_type: 'premium',
        ps5_stations: ps5Count,
        vr_zones: vrCount,
        driving_simulator: includeDrivingSim,
        base_price: equipmentCost,
        transport_cost: transportCost,
        total_estimated_cost: totalCost,
        final_price: totalCost,
        inquiry_source: 'website'
      };

      // Make API call
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://gamespotbooking-v1-production.up.railway.app';
      const response = await fetch(`${API_BASE_URL}/api/college-bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bookingData)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Booking failed');
      }

      setBookingId(result.booking_reference || `CS-${Date.now()}`);
      setLoading(false);
      setShowSuccess(true);
      setShowBookingForm(false);
    } catch (error) {
      console.error('Booking error:', error);
      alert(error.message || 'Failed to submit booking. Please try again.');
      setLoading(false);
    }
  };
  
  const closeSuccessModal = () => {
    setShowSuccess(false);
    setActiveSection('showcase');
    // Reset form
    setCollegeName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setLocation('');
    setDistance(10);
    setStartDate(getToday());
    setEndDate('');
    setPs5Count(4);
    setVrCount(2);
    setIncludeDrivingSim(true);
  };
  
  return (
    <div className="college-setup-page">
      <Navbar />
      
      {/* Background Effects */}
      <div className="college-bg-effects">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
        <div className="bg-grid"></div>
      </div>
      
      <div className="college-container">
        {/* Hero Section */}
        <motion.div 
          className="college-hero"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="hero-badge">
            <FiZap className="badge-icon" />
            College Gaming Events
          </div>
          <h1 className="college-title">Professional Gaming Setup for Your College</h1>
          <p className="college-subtitle">
            Transform your college fest into an unforgettable gaming experience. 
            We bring premium PS5 stations, VR zones, and driving simulators right to your campus.
          </p>
          
          <div className="hero-stats">
            <div className="stat-item">
              <FiUsers className="stat-icon" />
              <div className="stat-value">15+</div>
              <div className="stat-label">Colleges</div>
            </div>
            <div className="stat-item">
              <FiAward className="stat-icon" />
              <div className="stat-value">8000+</div>
              <div className="stat-label">Happy Students</div>
            </div>
            <div className="stat-item">
              <FiStar className="stat-icon" />
              <div className="stat-value">4.9</div>
              <div className="stat-label">Avg Rating</div>
            </div>
          </div>
        </motion.div>
        
        {/* Toggle Section Buttons */}
        <div className="section-toggle">
          <button 
            className={`toggle-btn ${activeSection === 'showcase' ? 'active' : ''}`}
            onClick={() => setActiveSection('showcase')}
          >
            <FiCamera /> View Showcase
          </button>
          <button 
            className={`toggle-btn ${activeSection === 'booking' ? 'active' : ''}`}
            onClick={handleStartBooking}
          >
            <FiCalendar /> Book Setup
          </button>
        </div>
        
        {/* Main Content */}
        <AnimatePresence mode="wait">
          {activeSection === 'showcase' && !showBookingForm ? (
            <motion.div
              key="showcase"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
            >
              {/* Equipment Overview */}
              <div className="equipment-overview">
                <h2 className="section-title">Our Premium Gaming Equipment</h2>
                <div className="equipment-grid">
                  <div className="equipment-card">
                    <div className="equipment-icon">🎮</div>
                    <h3>4x PS5 Gaming Stations</h3>
                    <p>Latest games, multiplayer tournaments, 4K gaming</p>
                    <div className="equipment-price">₹400/day each</div>
                  </div>
                  <div className="equipment-card">
                    <div className="equipment-icon">🥽</div>
                    <h3>2x VR Headset Zones</h3>
                    <p>Immersive virtual reality experiences</p>
                    <div className="equipment-price">₹800/day each</div>
                  </div>
                  <div className="equipment-card featured">
                    <div className="featured-badge">Popular</div>
                    <div className="equipment-icon">🏎️</div>
                    <h3>1x Driving Simulator</h3>
                    <p>Professional racing setup with steering wheel</p>
                    <div className="equipment-price">₹1,500/day</div>
                  </div>
                </div>
              </div>
              
              {/* College Showcase */}
              <div className="colleges-showcase">
                <h2 className="section-title">Previous College Events</h2>
                <p className="section-description">
                  See how we transformed college fests into epic gaming experiences
                </p>
                
                <div className="colleges-grid">
                  {colleges.map((college, index) => (
                    <motion.div
                      key={college.id}
                      className="college-card"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      whileHover={{ y: -10 }}
                    >
                      {/* Thumbnail with play button */}
                      <div 
                        className="college-thumbnail"
                        onClick={() => openVideoModal(college)}
                      >
                        <div className="thumbnail-overlay">
                          <div className="play-button">
                            <FiPlay />
                          </div>
                        </div>
                        <div className="thumbnail-placeholder">
                          <FiCamera size={40} />
                          <span>Click to watch video</span>
                        </div>
                      </div>
                      
                      {/* College Info */}
                      <div className="college-info">
                        <div className="college-header">
                          <h3>{college.name}</h3>
                          <div className="college-rating">
                            <FiStar className="star-icon" />
                            {college.rating}
                          </div>
                        </div>
                        
                        <div className="college-meta">
                          <div className="meta-item">
                            <FiMapPin />
                            {college.location}
                          </div>
                          <div className="meta-item">
                            <FiCalendar />
                            {college.date}
                          </div>
                          <div className="meta-item">
                            <FiUsers />
                            {college.students} students
                          </div>
                          <div className="meta-item">
                            <FiClock />
                            {college.duration}
                          </div>
                        </div>
                        
                        <div className="college-highlights">
                          {college.highlights.map((highlight, i) => (
                            <span key={i} className="highlight-tag">
                              {highlight}
                            </span>
                          ))}
                        </div>
                        
                        <p className="college-feedback">"{college.feedback}"</p>
                        
                        <button 
                          className="watch-video-btn"
                          onClick={() => openVideoModal(college)}
                        >
                          <FiPlay /> Watch Video
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* CTA Section */}
              <div className="cta-section">
                <h2>Ready to Bring Gaming to Your College?</h2>
                <p>Book our complete gaming setup for your next fest or event</p>
                <button className="cta-book-btn" onClick={handleStartBooking}>
                  Book Your Setup <FiChevronRight />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="booking"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.4 }}
              className="booking-container"
            >
              <button className="back-btn" onClick={handleBackToShowcase}>
                ← Back to Showcase
              </button>
              
              <div className="booking-layout">
                {/* Left: Booking Form */}
                <div className="booking-form-section">
                  <h2 className="form-title">Book College Gaming Setup</h2>
                  
                  <form onSubmit={handleSubmitBooking} className="college-booking-form">
                    {/* College Details */}
                    <div className="form-section">
                      <h3 className="form-section-title">
                        <FiMonitor /> College Details
                      </h3>
                      
                      <div className="form-group">
                        <label className="form-label">
                          <FiMonitor className="label-icon" />
                          College Name * (Start typing to see suggestions)
                        </label>
                        <input
                          ref={collegeInputRef}
                          type="text"
                          className="form-input"
                          value={collegeName}
                          onChange={(e) => setCollegeName(e.target.value)}
                          placeholder="Start typing college name..."
                          required
                        />
                        {distanceError && (
                          <div className="form-error">
                            <FiInfo /> {distanceError}
                          </div>
                        )}
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">
                          <FiMapPin className="label-icon" />
                          College Address *
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="Will be auto-filled when you select college"
                          readOnly={selectedPlace !== null}
                          required
                        />
                        <div className="form-help">
                          <FiInfo /> Select college from dropdown to auto-fill address
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">
                          <FiTruck className="label-icon" />
                          Distance from GameSpot Kodungallur (km) *
                          {isCalculatingDistance && (
                            <span className="calculating-badge">
                              <FiLoader className="spinner-icon" /> Calculating...
                            </span>
                          )}
                        </label>
                        <div className="distance-input-wrapper">
                          <input
                            type="number"
                            className="form-input"
                            value={distance}
                            onChange={(e) => setDistance(Math.max(1, parseInt(e.target.value) || 1))}
                            min="1"
                            required
                          />
                          <div className="distance-info">
                            Transport Cost: ₹{calculateTransportCost(distance)}
                            {distance > 10 && (
                              <span className="distance-note">
                                (+₹{(distance - 10) * 25} for {distance - 10}km extra)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Contact Person */}
                    <div className="form-section">
                      <h3 className="form-section-title">
                        <FiUser /> Contact Person
                      </h3>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">
                            <FiUser className="label-icon" />
                            Full Name *
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={contactPerson}
                            onChange={(e) => setContactPerson(e.target.value)}
                            placeholder="Organizer name"
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">
                            <FiPhone className="label-icon" />
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            className="form-input"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="10-digit mobile number"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">
                          <FiMail className="label-icon" />
                          Email Address *
                        </label>
                        <input
                          type="email"
                          className="form-input"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="college@example.com"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Event Dates */}
                    <div className="form-section">
                      <h3 className="form-section-title">
                        <FiCalendar /> Event Dates
                      </h3>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Start Date *</label>
                          <input
                            type="date"
                            className="form-input"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            min={getToday()}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label className="form-label">End Date *</label>
                          <input
                            type="date"
                            className="form-input"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate}
                            required
                          />
                        </div>
                      </div>
                      
                      {numberOfDays > 0 && (
                        <div className="duration-badge">
                          <FiClock /> Event Duration: {numberOfDays} {numberOfDays === 1 ? 'day' : 'days'}
                        </div>
                      )}
                    </div>
                    
                    {/* Equipment Selection */}
                    <div className="form-section">
                      <h3 className="form-section-title">
                        <FiPackage /> Select Equipment
                      </h3>
                      
                      <div className="equipment-selector">
                        <div className="selector-item">
                          <div className="selector-header">
                            <span className="selector-icon">🎮</span>
                            <div>
                              <h4>PS5 Gaming Stations</h4>
                              <p>₹400/day per unit</p>
                            </div>
                          </div>
                          <div className="quantity-controls">
                            <button
                              type="button"
                              className="qty-btn"
                              onClick={() => setPs5Count(Math.max(0, ps5Count - 1))}
                            >
                              -
                            </button>
                            <span className="qty-value">{ps5Count}</span>
                            <button
                              type="button"
                              className="qty-btn"
                              onClick={() => setPs5Count(Math.min(4, ps5Count + 1))}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        
                        <div className="selector-item">
                          <div className="selector-header">
                            <span className="selector-icon">🥽</span>
                            <div>
                              <h4>VR Headset Zones</h4>
                              <p>₹800/day per unit</p>
                            </div>
                          </div>
                          <div className="quantity-controls">
                            <button
                              type="button"
                              className="qty-btn"
                              onClick={() => setVrCount(Math.max(0, vrCount - 1))}
                            >
                              -
                            </button>
                            <span className="qty-value">{vrCount}</span>
                            <button
                              type="button"
                              className="qty-btn"
                              onClick={() => setVrCount(Math.min(2, vrCount + 1))}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        
                        <div className="selector-item">
                          <div className="selector-header">
                            <span className="selector-icon">🏎️</span>
                            <div>
                              <h4>Driving Simulator</h4>
                              <p>₹1,500/day</p>
                            </div>
                          </div>
                          <div className="checkbox-control">
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={includeDrivingSim}
                                onChange={(e) => setIncludeDrivingSim(e.target.checked)}
                              />
                              <span>Include</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Submit Button */}
                    <button 
                      type="submit" 
                      className="submit-booking-btn"
                      disabled={loading || ps5Count === 0 && vrCount === 0 && !includeDrivingSim}
                    >
                      {loading ? (
                        <>
                          <div className="btn-spinner"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <FiCheck /> Submit Booking Request
                        </>
                      )}
                    </button>
                    
                    <p className="form-note">
                      <FiInfo /> Our team will contact you within 24 hours to confirm the booking and discuss setup details.
                    </p>
                  </form>
                </div>
                
                {/* Right: Price Summary */}
                <div className="price-summary-sticky">
                  <div className="summary-card">
                    <h3 className="summary-title">
                      <FiDollarSign /> Price Breakdown
                    </h3>
                    
                    <div className="summary-section">
                      <h4>Equipment Charges</h4>
                      
                      {ps5Count > 0 && (
                        <div className="summary-row">
                          <span>🎮 PS5 × {ps5Count} × {numberOfDays} days</span>
                          <span className="summary-amount">₹{pricing.ps5.toLocaleString()}</span>
                        </div>
                      )}
                      
                      {vrCount > 0 && (
                        <div className="summary-row">
                          <span>🥽 VR × {vrCount} × {numberOfDays} days</span>
                          <span className="summary-amount">₹{pricing.vr.toLocaleString()}</span>
                        </div>
                      )}
                      
                      {includeDrivingSim && (
                        <div className="summary-row">
                          <span>🏎️ Driving Sim × {numberOfDays} days</span>
                          <span className="summary-amount">₹{pricing.drivingSim.toLocaleString()}</span>
                        </div>
                      )}
                      
                      <div className="summary-subtotal">
                        <span>Equipment Subtotal</span>
                        <span>₹{pricing.subtotal.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="summary-divider"></div>
                    
                    <div className="summary-section">
                      <h4>Transportation</h4>
                      <div className="summary-row">
                        <span>
                          <FiTruck /> {distance}km distance
                          {distance > 10 && <span className="extra-km"> (+{distance - 10}km extra)</span>}
                        </span>
                        <span className="summary-amount">₹{pricing.transport.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="summary-divider"></div>
                    
                    <div className="summary-total">
                      <span>Total Amount</span>
                      <span className="total-amount">₹{pricing.total.toLocaleString()}</span>
                    </div>
                    
                    <div className="summary-note">
                      <FiInfo />
                      <span>Final price may vary based on specific requirements and additional services.</span>
                    </div>
                  </div>
                  
                  {/* What's Included */}
                  <div className="whats-included">
                    <h4>What's Included</h4>
                    <ul>
                      <li><FiCheck /> Professional setup & installation</li>
                      <li><FiCheck /> On-site technical support</li>
                      <li><FiCheck /> Latest games & VR experiences</li>
                      <li><FiCheck /> All cables & accessories</li>
                      <li><FiCheck /> Transportation both ways</li>
                      <li><FiCheck /> Insurance coverage</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Video Modal */}
      <AnimatePresence>
        {showVideoModal && selectedCollege && (
          <motion.div 
            className="video-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeVideoModal}
          >
            <motion.div 
              className="video-modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close-btn" onClick={closeVideoModal}>
                <FiX />
              </button>
              
              <div className="modal-header">
                <h3>{selectedCollege.name}</h3>
                <p>{selectedCollege.location}</p>
              </div>
              
              <div className="video-wrapper">
                <iframe
                  width="100%"
                  height="100%"
                  src={selectedCollege.videoUrl}
                  title={selectedCollege.name}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            className="success-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="success-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
            >
              <div className="success-animation">
                <div className="success-checkmark">
                  <FiCheck className="checkmark-icon" />
                </div>
                <div className="success-ripple"></div>
                <div className="success-ripple delay-1"></div>
              </div>
              
              <h2 className="success-title">Booking Request Submitted!</h2>
              <p className="success-subtitle">We'll contact you shortly to confirm</p>
              
              <div className="success-details">
                <div className="detail-card">
                  <div className="detail-row">
                    <span className="detail-label">Booking ID</span>
                    <span className="detail-value highlight">{bookingId}</span>
                  </div>
                  <div className="detail-divider"></div>
                  <div className="detail-row">
                    <span className="detail-label">College</span>
                    <span className="detail-value">{collegeName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Duration</span>
                    <span className="detail-value">{numberOfDays} days</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Location</span>
                    <span className="detail-value">{location}</span>
                  </div>
                  <div className="detail-divider"></div>
                  <div className="detail-row total">
                    <span className="detail-label">Total Amount</span>
                    <span className="detail-value price">₹{pricing.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <button className="btn-success-action" onClick={closeSuccessModal}>
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Footer />
    </div>
  );
};

export default CollegeSetupPage;
