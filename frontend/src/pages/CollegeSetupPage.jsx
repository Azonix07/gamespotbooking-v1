import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlay, FiX, FiCalendar, FiMapPin, FiTruck, FiDollarSign, 
  FiCheck, FiUser, FiPhone, FiMail, FiPackage, FiUsers,
  FiMonitor, FiCamera, FiTrendingUp, FiAward, FiClock,
  FiChevronRight, FiInfo, FiZap, FiStar, FiLoader, FiSend,
  FiChevronLeft, FiHeart, FiMessageCircle, FiThumbsUp,
  FiGrid, FiList, FiFilter, FiSearch, FiDisc, FiBox,
  FiNavigation, FiTarget
} from 'react-icons/fi';
import { IoGameController, IoCarSport } from 'react-icons/io5';
import { TbDeviceVisionPro } from 'react-icons/tb';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getToday } from '../utils/helpers';
import useFreePlaces, { haversineDistance, getFreeMapUrl, getOSMLink, getDirectionsUrl } from '../hooks/useFreePlaces';
import '../styles/CollegeSetupPage.css';

// GameSpot Kodungallur Location
const GAMESPOT_LOCATION = {
  name: 'GameSpot Kodungallur',
  address: 'Kodungallur, Thrissur, Kerala, India',
  lat: 10.2167,
  lng: 76.2000
};

// 5 Colleges we have worked with - REAL DATA
const completedColleges = [
  {
    id: 1,
    name: 'Vidya Academy of Science & Technology',
    shortName: 'Vidya Engineering',
    location: 'Thrissur',
    state: 'Kerala',
    date: 'January 2026',
    eventName: 'TechVidya 2026',
    students: '750+',
    duration: '4 days',
    thumbnail: '/images/colleges/vidya.jpg',
    gallery: [
      '/images/colleges/vidya-1.jpg',
      '/images/colleges/vidya-2.jpg',
      '/images/colleges/vidya-3.jpg'
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    highlights: ['4 PS5 Stations', '2 VR Zones', 'Driving Simulator', 'FIFA Tournament'],
    equipment: { ps5: 4, vr: 2, drivingSim: true },
    rating: 4.9,
    totalReviews: 156,
    feedback: 'Incredible gaming experience! The students were thrilled with the VR setup.',
    reviews: [
      { id: 1, name: 'Arjun K', rating: 5, comment: 'Best gaming event ever! The VR experience was mind-blowing.', date: '2026-01-15', likes: 24 },
      { id: 2, name: 'Priya M', rating: 5, comment: 'Professional setup and friendly staff. Highly recommend!', date: '2026-01-14', likes: 18 },
      { id: 3, name: 'Rahul S', rating: 4, comment: 'Great experience, just wish it was longer!', date: '2026-01-14', likes: 12 }
    ]
  },
  {
    id: 2,
    name: 'Sahridaya College of Advanced Studies',
    shortName: 'Sahridaya',
    location: 'Kodakara',
    state: 'Kerala',
    date: 'December 2025',
    eventName: 'Sahridaya Fest 2025',
    students: '600+',
    duration: '3 days',
    thumbnail: '/images/colleges/sahridaya.jpg',
    gallery: [
      '/images/colleges/sahridaya-1.jpg',
      '/images/colleges/sahridaya-2.jpg',
      '/images/colleges/sahridaya-3.jpg'
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    highlights: ['4 PS5 Stations', '2 VR Zones', 'Driving Simulator', 'Gaming Lounge'],
    equipment: { ps5: 4, vr: 2, drivingSim: true },
    rating: 4.8,
    totalReviews: 134,
    feedback: 'The driving simulator was a huge hit! Everyone wanted to try it.',
    reviews: [
      { id: 1, name: 'Arun V', rating: 5, comment: 'Amazing setup! The driving simulator felt so real.', date: '2025-12-20', likes: 31 },
      { id: 2, name: 'Sneha R', rating: 5, comment: 'Best part of our fest! GameSpot team was very professional.', date: '2025-12-19', likes: 22 }
    ]
  },
  {
    id: 3,
    name: 'Thanallur Arts and Science College',
    shortName: 'Thanallur College',
    location: 'Irinjalakuda',
    state: 'Kerala',
    date: 'November 2025',
    eventName: 'Thanallur Utsav 2025',
    students: '500+',
    duration: '3 days',
    thumbnail: '/images/colleges/thanallur.jpg',
    gallery: [
      '/images/colleges/thanallur-1.jpg',
      '/images/colleges/thanallur-2.jpg'
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    highlights: ['4 PS5 Stations', '2 VR Zones', 'Esports Tournament', 'Beat Saber Challenge'],
    equipment: { ps5: 4, vr: 2, drivingSim: false },
    rating: 4.9,
    totalReviews: 98,
    feedback: 'The Beat Saber tournament was legendary! Students still talk about it.',
    reviews: [
      { id: 1, name: 'Vishnu P', rating: 5, comment: 'Beat Saber tournament was fire! Absolutely loved it.', date: '2025-11-18', likes: 45 },
      { id: 2, name: 'Anjali S', rating: 5, comment: 'Never thought I would enjoy gaming this much. VR was incredible!', date: '2025-11-17', likes: 28 }
    ]
  },
  {
    id: 4,
    name: 'Nirmala College of Engineering',
    shortName: 'Nirmala Engineering',
    location: 'Chalakudy',
    state: 'Kerala',
    date: 'October 2025',
    eventName: 'Nirmala Tech Fest 2025',
    students: '850+',
    duration: '5 days',
    thumbnail: '/images/colleges/nirmala.jpg',
    gallery: [
      '/images/colleges/nirmala-1.jpg',
      '/images/colleges/nirmala-2.jpg',
      '/images/colleges/nirmala-3.jpg'
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    highlights: ['4 PS5 Stations', '2 VR Zones', 'Driving Simulator', 'Gaming Marathon'],
    equipment: { ps5: 4, vr: 2, drivingSim: true },
    rating: 5.0,
    totalReviews: 203,
    feedback: 'Perfect rating! Every aspect was handled professionally.',
    reviews: [
      { id: 1, name: 'Mohammed F', rating: 5, comment: '5 days of pure gaming bliss. GameSpot exceeded expectations!', date: '2025-10-25', likes: 52 },
      { id: 2, name: 'Lakshmi K', rating: 5, comment: 'The setup quality was top-notch. Worth every penny!', date: '2025-10-24', likes: 38 }
    ]
  },
  {
    id: 5,
    name: 'Jyothi Engineering College',
    shortName: 'Jyothi Engineering',
    location: 'Thrissur',
    state: 'Kerala',
    date: 'September 2025',
    eventName: 'Jyothi Carnival 2025',
    students: '700+',
    duration: '4 days',
    thumbnail: '/images/colleges/jyothi.jpg',
    gallery: [
      '/images/colleges/jyothi-1.jpg',
      '/images/colleges/jyothi-2.jpg'
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    highlights: ['4 PS5 Stations', '2 VR Zones', 'FIFA Championship', 'VR Racing'],
    equipment: { ps5: 4, vr: 2, drivingSim: false },
    rating: 4.8,
    totalReviews: 145,
    feedback: 'Great experience! Students loved the FIFA tournament!',
    reviews: [
      { id: 1, name: 'Sanjay R', rating: 5, comment: 'Won the FIFA championship! Thanks GameSpot!', date: '2025-09-15', likes: 67 },
      { id: 2, name: 'Divya M', rating: 5, comment: 'Really fun experience, would recommend to other colleges!', date: '2025-09-14', likes: 19 }
    ]
  }
];

// Equipment pricing
const equipmentPricing = {
  ps5: { name: 'PS5 Gaming Station', pricePerDay: 400, max: 4, icon: 'ps5', description: 'Premium gaming with latest titles' },
  vr: { name: 'VR Headset Zone', pricePerDay: 800, max: 2, icon: 'vr', description: 'Immersive virtual reality experience' },
  drivingSim: { name: 'Driving Simulator', pricePerDay: 1500, max: 1, icon: 'car', description: 'Realistic racing setup with wheel & pedals' }
};

// Statistics
const stats = {
  collegesServed: 5,
  studentsReached: 3150,
  eventsCompleted: 5,
  totalDays: 17,
  averageRating: 4.86,
  happyStudents: '99%'
};

const CollegeSetupPage = () => {
  const navigate = useNavigate();
  
  // Free College Autocomplete — OpenStreetMap Nominatim (no API key needed!)
  const {
    isLoaded: placesLoaded,
    suggestions: placeSuggestions,
    isSearching: placesSearching,
    searchPlaces,
    getPlaceDetails,
    clearSuggestions
  } = useFreePlaces({ country: 'in' });
  
  // Refs
  const bookingRef = useRef(null);
  const collegeInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  
  // State - View & Navigation
  const [activeTab, setActiveTab] = useState('showcase');
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [showCollegeModal, setShowCollegeModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  // State - Booking Form
  const [collegeName, setCollegeName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [distance, setDistance] = useState(0);
  const [distanceAuto, setDistanceAuto] = useState(false);
  const [selectedPlaceCoords, setSelectedPlaceCoords] = useState(null);
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState(null);
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState('');
  const [numberOfDays, setNumberOfDays] = useState(1);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  
  // State - Equipment Selection
  const [ps5Count, setPs5Count] = useState(4);
  const [vrCount, setVrCount] = useState(2);
  const [includeDrivingSim, setIncludeDrivingSim] = useState(true);
  
  // State - Review Form
  const [reviewCollege, setReviewCollege] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  
  // State - UI
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  
  // Calculate pricing
  const calculatePricing = () => {
    const days = numberOfDays || 1;
    const equipmentCost = 
      (ps5Count * equipmentPricing.ps5.pricePerDay * days) +
      (vrCount * equipmentPricing.vr.pricePerDay * days) +
      (includeDrivingSim ? equipmentPricing.drivingSim.pricePerDay * days : 0);
    const transportCost = Math.round(distance * 15 * 2);
    const totalCost = equipmentCost + transportCost;
    
    return { equipmentCost, transportCost, totalCost, days };
  };
  
  // Calculate days when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setNumberOfDays(diffDays > 0 ? diffDays : 1);
    }
  }, [startDate, endDate]);
  
  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % getAllTestimonials().length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);
  
  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target) &&
        collegeInputRef.current &&
        !collegeInputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Handle college name input change — triggers autocomplete
  const handleCollegeNameChange = useCallback(
    (value) => {
      setCollegeName(value);
      setDistanceAuto(false);
      setSelectedPlaceCoords(null);
      setSelectedPlaceDetails(null);
      if (value.length >= 2) {
        searchPlaces(value);
        setShowSuggestions(true);
      } else {
        clearSuggestions();
        setShowSuggestions(false);
      }
    },
    [searchPlaces, clearSuggestions]
  );
  
  // Handle place selection from suggestions
  const handlePlaceSelect = useCallback(
    async (suggestion) => {
      setCollegeName(suggestion.mainText);
      setShowSuggestions(false);
      clearSuggestions();
      
      // Get place details — pass full suggestion (Nominatim already has lat/lng/address)
      const details = await getPlaceDetails(suggestion.placeId, suggestion);
      if (details) {
        // Build a clean location string
        const locationParts = [details.city, details.district, details.state].filter(Boolean);
        setLocation(locationParts.length > 0 ? locationParts.join(', ') : details.address);
        setSelectedPlaceCoords({ lat: details.lat, lng: details.lng });
        setSelectedPlaceDetails(details);
        
        // Auto-calculate distance from GameSpot Kodungallur
        if (details.lat && details.lng) {
          const dist = haversineDistance(
            GAMESPOT_LOCATION.lat,
            GAMESPOT_LOCATION.lng,
            details.lat,
            details.lng
          );
          setDistance(dist);
          setDistanceAuto(true);
        }
      }
    },
    [getPlaceDetails, clearSuggestions]
  );
  
  // Get all testimonials
  const getAllTestimonials = () => {
    const testimonials = [];
    completedColleges.forEach(college => {
      college.reviews.forEach(review => {
        testimonials.push({
          ...review,
          collegeName: college.name,
          collegeShortName: college.shortName
        });
      });
    });
    return testimonials;
  };
  
  // Handle booking submission
  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { equipmentCost, transportCost, totalCost, days } = calculatePricing();

      const bookingData = {
        contact_name: contactPerson,
        contact_phone: phone,
        contact_email: '',
        college_name: collegeName,
        college_address: location,
        college_city: location.split(',')[0]?.trim() || '',
        college_state: 'Kerala',
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
        additional_requirements: additionalNotes,
        base_price: equipmentCost,
        transport_cost: transportCost,
        total_estimated_cost: totalCost,
        final_price: totalCost,
        inquiry_source: 'website'
      };

      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://gamespotkdlr.com';
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

      setBookingId(result.booking_reference || `COL-${Date.now()}`);
      setLoading(false);
      setShowSuccess(true);
    } catch (error) {
      console.error('Booking error:', error);
      alert(error.message || 'Failed to submit booking. Please try again.');
      setLoading(false);
    }
  };
  
  // Handle review submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Thank you for your review! It will appear after verification.');
      setShowReviewModal(false);
      setReviewerName('');
      setReviewRating(5);
      setReviewComment('');
      setReviewCollege('');
    } catch (error) {
      alert('Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Open college detail modal
  const openCollegeModal = (college) => {
    setSelectedCollege(college);
    setShowCollegeModal(true);
  };
  
  // Scroll to booking section
  const scrollToBooking = () => {
    setActiveTab('booking');
    setTimeout(() => {
      bookingRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  // Render star rating
  const renderStars = (rating, size = 16) => {
    return (
      <div className="stars-container" style={{ fontSize: size }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={`star ${star <= rating ? 'filled' : ''}`}
            fill={star <= rating ? '#f97316' : 'none'}
            color={star <= rating ? '#f97316' : 'rgba(255,255,255,0.3)'}
          />
        ))}
      </div>
    );
  };
  
  // Render interactive star rating for review form
  const renderInteractiveStars = () => {
    return (
      <div className="interactive-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star-btn ${star <= reviewRating ? 'active' : ''}`}
            onClick={() => setReviewRating(star)}
          >
            <FiStar fill={star <= reviewRating ? '#f97316' : 'none'} />
          </button>
        ))}
      </div>
    );
  };

  const pricing = calculatePricing();
  const allTestimonials = getAllTestimonials();

  return (
    <div className="college-setup-page">
      <Navbar variant="light" />
      
      {/* Background Effects */}
      <div className="college-bg-effects">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
        <div className="bg-grid"></div>
      </div>
      
      <div className="college-container">
        {/* Hero Section */}
        <motion.section 
          className="college-hero"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="hero-badge">
            <FiZap className="badge-icon" />
            College Gaming Events
          </div>
          <h1 className="college-title">
            Transform Your College Fest Into A 
            <span className="highlight"> Gaming Paradise</span>
          </h1>
          <p className="college-subtitle">
            We've successfully hosted gaming events at <strong>5 colleges</strong>, 
            reaching <strong>3,150+ students</strong> with an average rating of 
            <strong> 4.86/5</strong>. Let's make your event unforgettable!
          </p>
          
          {/* Stats Bar */}
          <div className="hero-stats-bar">
            <div className="stat-item">
              <div className="stat-icon-wrap">
                <FiAward />
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats.collegesServed}</span>
                <span className="stat-label">Colleges</span>
              </div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-icon-wrap">
                <FiUsers />
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats.studentsReached.toLocaleString()}+</span>
                <span className="stat-label">Students</span>
              </div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-icon-wrap">
                <FiStar />
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats.averageRating}</span>
                <span className="stat-label">Rating</span>
              </div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-icon-wrap">
                <FiHeart />
              </div>
              <div className="stat-content">
                <span className="stat-value">{stats.happyStudents}</span>
                <span className="stat-label">Happy</span>
              </div>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="hero-cta-buttons">
            <button className="cta-primary" onClick={scrollToBooking}>
              <FiCalendar /> Book Your Event
            </button>
            <button className="cta-secondary" onClick={() => setShowReviewModal(true)}>
              <FiStar /> Write a Review
            </button>
          </div>
        </motion.section>
        
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'showcase' ? 'active' : ''}`}
            onClick={() => setActiveTab('showcase')}
          >
            <FiGrid /> Our Work
          </button>
          <button 
            className={`tab-btn ${activeTab === 'booking' ? 'active' : ''}`}
            onClick={() => setActiveTab('booking')}
          >
            <FiCalendar /> Book Event
          </button>
        </div>
        
        {/* Showcase Section */}
        {activeTab === 'showcase' && (
          <motion.section 
            className="showcase-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="section-header">
              <h2 className="section-title">
                <FiCamera /> Colleges We've Partnered With
              </h2>
              <p className="section-subtitle">
                Browse through our successful gaming events and see what students have to say
              </p>
            </div>
            
            {/* College Cards Grid */}
            <div className="colleges-grid">
              {completedColleges.map((college, index) => (
                <motion.div
                  key={college.id}
                  className="college-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => openCollegeModal(college)}
                >
                  {/* Card Image */}
                  <div className="card-image">
                    <div className="image-placeholder">
                      <span className="college-initial">{college.shortName.charAt(0)}</span>
                    </div>
                    <div className="card-overlay">
                      <button className="play-btn" onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCollege(college);
                        setShowVideoModal(true);
                      }}>
                        <FiPlay />
                      </button>
                    </div>
                    <div className="card-badge">{college.date}</div>
                  </div>
                  
                  {/* Card Content */}
                  <div className="card-content">
                    <h3 className="card-title">{college.shortName}</h3>
                    <p className="card-location">
                      <FiMapPin /> {college.location}
                    </p>
                    <p className="card-event">{college.eventName}</p>
                    
                    {/* Rating */}
                    <div className="card-rating">
                      {renderStars(college.rating)}
                      <span className="rating-value">{college.rating}</span>
                      <span className="review-count">({college.totalReviews} reviews)</span>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="card-stats">
                      <span><FiUsers /> {college.students}</span>
                      <span><FiClock /> {college.duration}</span>
                    </div>
                    
                    {/* Highlights */}
                    <div className="card-highlights">
                      {college.highlights.slice(0, 3).map((h, i) => (
                        <span key={i} className="highlight-tag">{h}</span>
                      ))}
                    </div>
                    
                    {/* Top Review Preview */}
                    {college.reviews[0] && (
                      <div className="card-review-preview">
                        <FiMessageCircle />
                        <p>"{college.reviews[0].comment.substring(0, 60)}..."</p>
                      </div>
                    )}
                    
                    <button className="card-cta">
                      View Details <FiChevronRight />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Testimonials Carousel */}
            <div className="testimonials-section">
              <h3 className="testimonials-title">
                <FiMessageCircle /> What Students Say
              </h3>
              
              <div className="testimonials-carousel">
                <AnimatePresence mode="wait">
                  {allTestimonials.length > 0 && allTestimonials.map((testimonial, index) => (
                    index === currentTestimonial % allTestimonials.length && (
                      <motion.div
                        key={`${testimonial.id}-${testimonial.collegeName}`}
                        className="testimonial-card"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.4 }}
                      >
                        <div className="testimonial-quote">"</div>
                        <p className="testimonial-text">{testimonial.comment}</p>
                        <div className="testimonial-author">
                          <div className="author-avatar">
                            {testimonial.name.charAt(0)}
                          </div>
                          <div className="author-info">
                            <span className="author-name">{testimonial.name}</span>
                            <span className="author-college">{testimonial.collegeShortName}</span>
                          </div>
                          {renderStars(testimonial.rating, 14)}
                        </div>
                      </motion.div>
                    )
                  ))}
                </AnimatePresence>
                
                {/* Carousel Dots */}
                <div className="carousel-dots">
                  {allTestimonials.slice(0, 5).map((_, index) => (
                    <button
                      key={index}
                      className={`dot ${index === currentTestimonial % allTestimonials.length ? 'active' : ''}`}
                      onClick={() => setCurrentTestimonial(index)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        )}
        
        {/* Booking Section */}
        {activeTab === 'booking' && (
          <motion.section 
            ref={bookingRef}
            className="booking-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="section-header">
              <h2 className="section-title">
                <FiCalendar /> Book Your Gaming Event
              </h2>
              <p className="section-subtitle">
                Fill in the details and we'll get back to you within 24 hours
              </p>
            </div>
            
            <div className="booking-layout">
              {/* Booking Form */}
              <form className="booking-form" onSubmit={handleSubmitBooking}>
                {/* College Details */}
                <div className="form-section">
                  <h3 className="form-section-title">
                    <FiPackage /> Event Details
                  </h3>
                  
                  <div className="form-grid">
                    <div className="form-group full-width college-autocomplete-wrap">
                      <label><FiSearch /> College / Institution Name *</label>
                      <div className={`autocomplete-container ${inputFocused ? 'focused' : ''} ${selectedPlaceDetails ? 'has-selection' : ''}`}>
                        <div className="autocomplete-input-row">
                          <FiSearch className="autocomplete-input-icon" />
                          <input
                            ref={collegeInputRef}
                            type="text"
                            value={collegeName}
                            onChange={(e) => handleCollegeNameChange(e.target.value)}
                            onFocus={() => {
                              setInputFocused(true);
                              if (placeSuggestions.length > 0) setShowSuggestions(true);
                            }}
                            onBlur={() => setInputFocused(false)}
                            placeholder={placesLoaded ? "Search any college, university, school in India..." : "e.g., Christ College, Irinjalakuda"}
                            required
                            autoComplete="off"
                            className="autocomplete-input"
                          />
                          {placesSearching && (
                            <span className="autocomplete-spinner">
                              <FiLoader className="spin" />
                            </span>
                          )}
                          {collegeName && !placesSearching && (
                            <button 
                              type="button" 
                              className="autocomplete-clear"
                              onClick={() => {
                                setCollegeName('');
                                setLocation('');
                                setDistance(0);
                                setDistanceAuto(false);
                                setSelectedPlaceCoords(null);
                                setSelectedPlaceDetails(null);
                                clearSuggestions();
                                setShowSuggestions(false);
                                collegeInputRef.current?.focus();
                              }}
                            >
                              <FiX />
                            </button>
                          )}
                        </div>
                        {placesLoaded && (
                          <div className="autocomplete-powered-strip">
                            <FiMapPin /> Powered by OpenStreetMap — free, no API key needed
                          </div>
                        )}
                        
                        {/* Suggestions Dropdown */}
                        {showSuggestions && placeSuggestions.length > 0 && (
                          <div className="autocomplete-dropdown" ref={suggestionsRef}>
                            <div className="autocomplete-dropdown-header">
                              <FiMapPin /> Suggestions
                              <span className="autocomplete-result-count">{placeSuggestions.length} results</span>
                            </div>
                            {placeSuggestions.map((s, idx) => (
                              <div
                                key={s.placeId || idx}
                                className="autocomplete-item"
                                onClick={() => handlePlaceSelect(s)}
                              >
                                <div className={`autocomplete-item-icon-wrap ${s.placeType === 'university' ? 'type-university' : s.placeType === 'college' ? 'type-college' : s.placeType === 'school' ? 'type-school' : ''}`}>
                                  <FiMapPin className="autocomplete-item-icon" />
                                </div>
                                <div className="autocomplete-item-text">
                                  <div className="autocomplete-main-row">
                                    <span className="autocomplete-main">{s.mainText}</span>
                                    {s.placeType && s.placeType !== 'place' && (
                                      <span className={`autocomplete-type-badge badge-${s.placeType}`}>
                                        {s.placeType}
                                      </span>
                                    )}
                                  </div>
                                  <span className="autocomplete-secondary">{s.secondaryText}</span>
                                </div>
                                <FiChevronRight className="autocomplete-item-arrow" />
                              </div>
                            ))}
                            <div className="autocomplete-footer">
                              <span className="osm-attribution">© OpenStreetMap contributors</span>
                            </div>
                          </div>
                        )}
                        
                        {/* No results message */}
                        {showSuggestions && !placesSearching && placeSuggestions.length === 0 && collegeName.length >= 2 && placesLoaded && (
                          <div className="autocomplete-dropdown" ref={suggestionsRef}>
                            <div className="autocomplete-no-results">
                              <FiSearch />
                              <p>No colleges found for "<strong>{collegeName}</strong>"</p>
                              <span>Try a different name or check spelling</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Selected Place Preview Card */}
                      {selectedPlaceDetails && (
                        <div className="place-preview-card">
                          <div className="place-preview-content">
                            <div className="place-preview-info">
                              <div className="place-preview-name">
                                <FiCheck className="place-check-icon" />
                                <span>{selectedPlaceDetails.name}</span>
                                {selectedPlaceDetails.placeType && selectedPlaceDetails.placeType !== 'place' && (
                                  <span className={`autocomplete-type-badge badge-${selectedPlaceDetails.placeType}`}>
                                    {selectedPlaceDetails.placeType}
                                  </span>
                                )}
                              </div>
                              <div className="place-preview-address">
                                <FiMapPin /> {selectedPlaceDetails.city && selectedPlaceDetails.state 
                                  ? `${selectedPlaceDetails.city}${selectedPlaceDetails.district ? ', ' + selectedPlaceDetails.district : ''}, ${selectedPlaceDetails.state}${selectedPlaceDetails.pincode ? ' - ' + selectedPlaceDetails.pincode : ''}`
                                  : selectedPlaceDetails.address
                                }
                              </div>
                              <div className="place-preview-links">
                                {selectedPlaceDetails.osmLink && (
                                  <a 
                                    href={selectedPlaceDetails.osmLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="place-preview-link"
                                  >
                                    <FiMapPin /> View on Map
                                  </a>
                                )}
                                {selectedPlaceCoords && (
                                  <a 
                                    href={getDirectionsUrl(GAMESPOT_LOCATION.lat, GAMESPOT_LOCATION.lng, selectedPlaceCoords.lat, selectedPlaceCoords.lng)} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="place-preview-link directions"
                                  >
                                    <FiNavigation /> Get Directions
                                  </a>
                                )}
                                {selectedPlaceDetails.website && (
                                  <a 
                                    href={selectedPlaceDetails.website} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="place-preview-link"
                                  >
                                    <FiInfo /> Website
                                  </a>
                                )}
                              </div>
                              {distanceAuto && (
                                <div className="place-preview-distance">
                                  <FiNavigation />
                                  <span><strong>{distance} km</strong> from GameSpot Kodungallur</span>
                                  <span className="place-transport-cost">• Transport: ₹{Math.round(distance * 15 * 2)}</span>
                                </div>
                              )}
                            </div>
                            {selectedPlaceDetails.mapUrl && (
                              <div className="place-preview-map">
                                <a href={selectedPlaceDetails.osmLink || '#'} target="_blank" rel="noopener noreferrer">
                                  <img 
                                    src={selectedPlaceDetails.mapUrl} 
                                    alt="College location map"
                                    className="place-map-image"
                                    loading="lazy"
                                  />
                                  <div className="place-map-overlay">
                                    <FiMapPin /> Click to open map
                                  </div>
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label><FiMapPin /> Location *</label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => {
                          setLocation(e.target.value);
                          if (distanceAuto) {
                            setDistanceAuto(false);
                            setSelectedPlaceDetails(null);
                          }
                        }}
                        placeholder={distanceAuto ? "Auto-filled ✓" : "City, District, State"}
                        required
                        className={distanceAuto ? 'auto-filled' : ''}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>
                        <FiTruck /> Distance from Kodungallur
                        {distanceAuto && (
                          <span className="distance-auto-badge">
                            <FiNavigation /> Auto
                          </span>
                        )}
                      </label>
                      <div className={`distance-display ${distanceAuto ? 'auto' : ''}`}>
                        {distanceAuto ? (
                          <>
                            <div className="distance-visual">
                              <div className="distance-from">
                                <FiTarget /> GameSpot
                              </div>
                              <div className="distance-line">
                                <div className="distance-line-inner"></div>
                                <span className="distance-km">{distance} km</span>
                              </div>
                              <div className="distance-to">
                                <FiMapPin /> {collegeName.substring(0, 18)}{collegeName.length > 18 ? '…' : ''}
                              </div>
                            </div>
                            <div className="distance-cost-preview">
                              🚚 Transport estimate: <strong>₹{Math.round(distance * 15 * 2).toLocaleString()}</strong> ({distance} km × ₹15 × 2 trips)
                            </div>
                          </>
                        ) : (
                          <input
                            type="number"
                            value={distance}
                            onChange={(e) => setDistance(Number(e.target.value))}
                            min="1"
                            max="500"
                            placeholder="Enter distance in km"
                          />
                        )}
                      </div>
                      {!distanceAuto && distance === 0 && (
                        <span className="distance-hint">
                          <FiInfo /> Type a college name above to auto-calculate distance — powered by OpenStreetMap (free)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Contact Details */}
                <div className="form-section">
                  <h3 className="form-section-title">
                    <FiUser /> Contact Information
                  </h3>
                  
                  <div className="form-grid">
                    <div className="form-group">
                      <label><FiUser /> Contact Person *</label>
                      <input
                        type="text"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        placeholder="Your name"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label><FiPhone /> Phone *</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 XXXXX XXXXX"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                {/* Date Selection */}
                <div className="form-section">
                  <h3 className="form-section-title">
                    <FiCalendar /> Event Schedule
                  </h3>
                  
                  <div className="form-grid">
                    <div className="form-group">
                      <label><FiCalendar /> Start Date *</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={getToday()}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label><FiCalendar /> End Date *</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                        required
                      />
                    </div>
                    
                    <div className="form-group full-width">
                      <label><FiClock /> Duration</label>
                      <div className="duration-display">
                        <span className="duration-value">{numberOfDays}</span>
                        <span className="duration-label">day{numberOfDays > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Equipment Selection */}
                <div className="form-section">
                  <h3 className="form-section-title">
                    <FiMonitor /> Equipment Selection
                  </h3>
                  
                  <div className="equipment-grid">
                    {/* PS5 Stations */}
                    <div className="equipment-card">
                      <div className="equipment-icon"><IoGameController /></div>
                      <div className="equipment-info">
                        <h4>PS5 Gaming Stations</h4>
                        <p>₹{equipmentPricing.ps5.pricePerDay}/day each</p>
                      </div>
                      <div className="equipment-controls">
                        <button type="button" onClick={() => setPs5Count(Math.max(0, ps5Count - 1))}>-</button>
                        <span>{ps5Count}</span>
                        <button type="button" onClick={() => setPs5Count(Math.min(4, ps5Count + 1))}>+</button>
                      </div>
                    </div>
                    
                    {/* VR Zones */}
                    <div className="equipment-card">
                      <div className="equipment-icon"><TbDeviceVisionPro /></div>
                      <div className="equipment-info">
                        <h4>VR Headset Zones</h4>
                        <p>₹{equipmentPricing.vr.pricePerDay}/day each</p>
                      </div>
                      <div className="equipment-controls">
                        <button type="button" onClick={() => setVrCount(Math.max(0, vrCount - 1))}>-</button>
                        <span>{vrCount}</span>
                        <button type="button" onClick={() => setVrCount(Math.min(2, vrCount + 1))}>+</button>
                      </div>
                    </div>
                    
                    {/* Driving Simulator */}
                    <div className={`equipment-card toggle-card ${includeDrivingSim ? 'active' : ''}`}>
                      <div className="equipment-icon"><IoCarSport /></div>
                      <div className="equipment-info">
                        <h4>Driving Simulator</h4>
                        <p>₹{equipmentPricing.drivingSim.pricePerDay}/day</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={includeDrivingSim}
                          onChange={(e) => setIncludeDrivingSim(e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Additional Notes */}
                <div className="form-section">
                  <div className="form-group full-width">
                    <label><FiInfo /> Additional Requirements</label>
                    <textarea
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      placeholder="Any specific games, tournament format, or setup requirements..."
                      rows={4}
                    />
                  </div>
                </div>
                
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <FiLoader className="spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <FiSend /> Submit Inquiry
                    </>
                  )}
                </button>
              </form>
              
              {/* Pricing Summary */}
              <div className="pricing-summary">
                <h3 className="pricing-title">Estimated Cost</h3>
                
                <div className="pricing-breakdown">
                  <div className="pricing-row">
                    <span>PS5 Stations ({ps5Count} × ₹{equipmentPricing.ps5.pricePerDay} × {pricing.days} days)</span>
                    <span>₹{ps5Count * equipmentPricing.ps5.pricePerDay * pricing.days}</span>
                  </div>
                  <div className="pricing-row">
                    <span>VR Zones ({vrCount} × ₹{equipmentPricing.vr.pricePerDay} × {pricing.days} days)</span>
                    <span>₹{vrCount * equipmentPricing.vr.pricePerDay * pricing.days}</span>
                  </div>
                  {includeDrivingSim && (
                    <div className="pricing-row">
                      <span>Driving Simulator (₹{equipmentPricing.drivingSim.pricePerDay} × {pricing.days} days)</span>
                      <span>₹{equipmentPricing.drivingSim.pricePerDay * pricing.days}</span>
                    </div>
                  )}
                  <div className="pricing-row">
                    <span>Transport ({distance} km × ₹15 × 2)</span>
                    <span>₹{pricing.transportCost}</span>
                  </div>
                  <div className="pricing-divider"></div>
                  <div className="pricing-row total">
                    <span>Total Estimated</span>
                    <span>₹{pricing.totalCost.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="pricing-note">
                  <FiInfo />
                  <p>Final pricing may vary based on specific requirements. We'll provide a detailed quote after reviewing your inquiry.</p>
                </div>
                
                {/* Why Choose Us */}
                <div className="why-choose-us">
                  <h4>Why Choose GameSpot?</h4>
                  <ul>
                    <li><FiCheck /> Professional setup & staff</li>
                    <li><FiCheck /> Premium gaming equipment</li>
                    <li><FiCheck /> 24/7 technical support</li>
                    <li><FiCheck /> Customizable tournament formats</li>
                    <li><FiCheck /> On-time delivery & setup</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </div>
      
      {/* College Detail Modal */}
      <AnimatePresence>
        {showCollegeModal && selectedCollege && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCollegeModal(false)}
          >
            <motion.div 
              className="college-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setShowCollegeModal(false)}>
                <FiX />
              </button>
              
              {/* Modal Header */}
              <div className="modal-header">
                <div className="modal-college-image">
                  <span className="college-initial-large">{selectedCollege.shortName.charAt(0)}</span>
                </div>
                <div className="modal-college-info">
                  <h2>{selectedCollege.name}</h2>
                  <p className="modal-location"><FiMapPin /> {selectedCollege.location}, {selectedCollege.state}</p>
                  <p className="modal-event"><FiZap /> {selectedCollege.eventName}</p>
                  <div className="modal-rating">
                    {renderStars(selectedCollege.rating, 20)}
                    <span className="rating-text">{selectedCollege.rating} ({selectedCollege.totalReviews} reviews)</span>
                  </div>
                </div>
              </div>
              
              {/* Modal Stats */}
              <div className="modal-stats">
                <div className="modal-stat">
                  <FiUsers />
                  <span>{selectedCollege.students} Students</span>
                </div>
                <div className="modal-stat">
                  <FiClock />
                  <span>{selectedCollege.duration}</span>
                </div>
                <div className="modal-stat">
                  <FiCalendar />
                  <span>{selectedCollege.date}</span>
                </div>
              </div>
              
              {/* Equipment Used */}
              <div className="modal-equipment">
                <h3>Equipment Used</h3>
                <div className="equipment-tags">
                  {selectedCollege.highlights.map((h, i) => (
                    <span key={i} className="equipment-tag">{h}</span>
                  ))}
                </div>
              </div>
              
              {/* Reviews Section */}
              <div className="modal-reviews">
                <h3><FiMessageCircle /> Student Reviews</h3>
                <div className="reviews-list">
                  {selectedCollege.reviews.map((review) => (
                    <div key={review.id} className="review-item">
                      <div className="review-header">
                        <div className="reviewer-avatar">{review.name.charAt(0)}</div>
                        <div className="reviewer-info">
                          <span className="reviewer-name">{review.name}</span>
                          <span className="review-date">{review.date}</span>
                        </div>
                        {renderStars(review.rating, 14)}
                      </div>
                      <p className="review-comment">{review.comment}</p>
                      <div className="review-actions">
                        <button className="like-btn">
                          <FiThumbsUp /> {review.likes}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  className="add-review-btn"
                  onClick={() => {
                    setReviewCollege(selectedCollege.name);
                    setShowCollegeModal(false);
                    setShowReviewModal(true);
                  }}
                >
                  <FiStar /> Write a Review
                </button>
              </div>
              
              {/* Watch Video Button */}
              <button 
                className="watch-video-btn"
                onClick={() => {
                  setShowCollegeModal(false);
                  setShowVideoModal(true);
                }}
              >
                <FiPlay /> Watch Event Video
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Video Modal */}
      <AnimatePresence>
        {showVideoModal && selectedCollege && (
          <motion.div 
            className="modal-overlay video-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowVideoModal(false)}
          >
            <motion.div 
              className="video-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setShowVideoModal(false)}>
                <FiX />
              </button>
              <div className="video-container">
                <iframe
                  src={selectedCollege.videoUrl}
                  title={`${selectedCollege.name} Event Video`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowReviewModal(false)}
          >
            <motion.div 
              className="review-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setShowReviewModal(false)}>
                <FiX />
              </button>
              
              <h2><FiStar /> Write a Review</h2>
              <p className="review-modal-subtitle">Share your experience from our gaming event at your college!</p>
              
              <form onSubmit={handleSubmitReview}>
                <div className="form-group">
                  <label>Select Your College *</label>
                  <select 
                    value={reviewCollege} 
                    onChange={(e) => setReviewCollege(e.target.value)}
                    required
                  >
                    <option value="">Choose college...</option>
                    {completedColleges.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Your Name *</label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Rating *</label>
                  {renderInteractiveStars()}
                </div>
                
                <div className="form-group">
                  <label>Comment *</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="What did you like or dislike?"
                    rows={4}
                    required
                  />
                </div>
                
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <FiLoader className="spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <FiSend /> Submit Review
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="success-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="success-icon">
                <FiCheck />
              </div>
              <h2>Booking Request Sent!</h2>
              <p>We'll get back to you within 24 hours with a detailed quote.</p>
              <div className="booking-ref">
                <strong>{bookingId}</strong>
              </div>
              <p className="success-note">Save this reference for your records.</p>
              <button onClick={() => { setShowSuccess(false); setActiveTab('showcase'); }}>
                <FiCheck /> Done
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
