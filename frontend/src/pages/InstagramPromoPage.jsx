import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiGift, 
  FiInstagram, 
  FiShare2, 
  FiCheck, 
  FiX,
  FiInfo,
  FiAward,
  FiClock,
  FiUserCheck,
  FiLock
} from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/apiClient';
import '../styles/InstagramPromoPage.css';

const InstagramPromoPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activePromotion, setActivePromotion] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [showClaimForm, setShowClaimForm] = useState(false);
  
  // Claim form state
  const [instagramUsername, setInstagramUsername] = useState('');
  const [friendHandles, setFriendHandles] = useState(['', '']);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Debug: Log auth state on every render
  console.log('[InstagramPromo] Render:', { 
    isAuthenticated, 
    user: user?.name, 
    authLoading, 
    loading,
    activePromotion: activePromotion?.title 
  });

  // Check eligibility and load active promotion
  useEffect(() => {
    const loadPromotionData = async () => {
      // Wait for auth to be ready
      if (authLoading) {
        console.log('[InstagramPromo] Waiting for auth to load...');
        return;
      }
      
      console.log('[InstagramPromo] Auth loaded:', { isAuthenticated, user: user?.name });
      
      try {
        if (isAuthenticated && user) {
          // User is logged in - check eligibility
          console.log('[InstagramPromo] User is authenticated, checking eligibility...');
          const eligibilityResponse = await apiFetch('/api/instagram-promo/check-eligibility');
          console.log('[InstagramPromo] Eligibility response:', eligibilityResponse);
          setEligibility(eligibilityResponse);
          
          if (eligibilityResponse.promotion) {
            setActivePromotion(eligibilityResponse.promotion);
          }
        } else {
          // User not logged in - still fetch active promotions to show info
          console.log('[InstagramPromo] User not authenticated, fetching active promotions...');
          try {
            const promoResponse = await apiFetch('/api/instagram-promo/active');
            if (promoResponse.success && promoResponse.promotions.length > 0) {
              setActivePromotion(promoResponse.promotions[0]);
            }
          } catch (promoErr) {
            console.error('Error fetching promotions:', promoErr);
          }
        }
      } catch (err) {
        console.error('Error loading promotion data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPromotionData();
  }, [isAuthenticated, user, authLoading]);

  const handleClaimPromotion = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setSubmitting(true);

    try {
      // Validate inputs
      if (!instagramUsername.trim()) {
        setError('Please enter your Instagram username');
        setSubmitting(false);
        return;
      }

      const validFriends = friendHandles.filter(handle => handle.trim() !== '');
      if (validFriends.length < (activePromotion?.required_friends_count || 2)) {
        setError(`Please enter at least ${activePromotion?.required_friends_count || 2} friend's Instagram handles`);
        setSubmitting(false);
        return;
      }

      // Submit claim
      const response = await apiFetch('/api/instagram-promo/claim', {
        method: 'POST',
        body: JSON.stringify({
          promotion_id: activePromotion.id,
          instagram_username: instagramUsername.replace('@', ''),
          shared_with_friends: validFriends.map(h => h.replace('@', ''))
        })
      });

      if (response.success) {
        // Generate a promo code for this user
        try {
          const promoResponse = await apiFetch('/api/promo/generate', {
            method: 'POST',
            body: JSON.stringify({
              type: 'instagram',
              bonus_minutes: activePromotion.discount_value,
              max_uses: 1,
              expires_days: 90
            })
          });

          if (promoResponse.success) {
            setSuccessMessage(`Congratulations! You've claimed ${activePromotion.discount_value} minutes of FREE gaming! Your promo code: ${promoResponse.promo_code.code}. Use this code when booking to get your free minutes!`);
          } else {
            setSuccessMessage(`Congratulations! You've claimed ${activePromotion.discount_value} minutes of FREE gaming! Your redemption code: ${response.redemption.redemption_code}`);
          }
        } catch (promoErr) {
          console.error('Error generating promo code:', promoErr);
          setSuccessMessage(`Congratulations! You've claimed ${activePromotion.discount_value} minutes of FREE gaming! Your redemption code: ${response.redemption.redemption_code}`);
        }
        
        setShowClaimForm(false);
        
        // Refresh eligibility
        const eligibilityResponse = await apiFetch('/api/instagram-promo/check-eligibility');
        setEligibility(eligibilityResponse);
      } else {
        setError(response.error || 'Failed to claim promotion');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFriendField = () => {
    setFriendHandles([...friendHandles, '']);
  };

  const handleFriendHandleChange = (index, value) => {
    const newHandles = [...friendHandles];
    newHandles[index] = value;
    setFriendHandles(newHandles);
  };

  if (loading || authLoading) {
    console.log('[InstagramPromo] Showing loading screen:', { loading, authLoading });
    return (
      <div className="instagram-promo-page">
        <Navbar />
        <div className="container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    console.log('[InstagramPromo] User not authenticated, showing login screen:', { isAuthenticated, user: user?.name });
    return (
      <div className="instagram-promo-page">
        <Navbar />
        
        <div className="promo-bg-effects">
          <div className="promo-bg-orb promo-bg-orb-1"></div>
          <div className="promo-bg-orb promo-bg-orb-2"></div>
          <div className="promo-bg-orb promo-bg-orb-3"></div>
        </div>

        <div className="container promo-container">
          {/* Show promotion info even when not logged in */}
          {activePromotion && (
            <>
              <motion.div 
                className="promo-hero"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="promo-badge">
                  <FiGift className="badge-icon" />
                  Instagram Promotion
                </div>
                <h1 className="promo-title">
                  <FiInstagram className="title-icon instagram-icon" />
                  Win {activePromotion.discount_value} Minutes FREE Gaming!
                </h1>
                <p className="promo-subtitle">
                  Follow us on Instagram and share with {activePromotion.required_friends_count} friends to claim your reward
                </p>
              </motion.div>

              {/* How It Works Preview */}
              <motion.div 
                className="how-it-works-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{ marginBottom: '2rem' }}
              >
                <h2><FiInfo className="card-icon" /> How It Works</h2>
                <div className="steps">
                  <div className="step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <h3>Login Required</h3>
                      <p>You must be logged in to claim this promotion</p>
                    </div>
                  </div>
                  
                  <div className="step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h3>Follow Us</h3>
                      <p>Follow <strong>{activePromotion.instagram_handle}</strong> on Instagram</p>
                    </div>
                  </div>
                  
                  <div className="step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h3>Share with Friends</h3>
                      <p>Share with at least {activePromotion.required_friends_count} friends</p>
                    </div>
                  </div>
                  
                  <div className="step">
                    <div className="step-number">4</div>
                    <div className="step-content">
                      <h3>Get FREE Gaming!</h3>
                      <p>{activePromotion.discount_value} minutes FREE when you book</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}

          {/* Login Required Card */}
          <motion.div 
            className="login-required-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: activePromotion ? 0.2 : 0 }}
          >
            <FiLock className="lock-icon" />
            <h2>Login Required</h2>
            <p>You need to be logged in to claim this promotion and win free gaming time!</p>
            <div className="button-group">
              <button className="btn-primary" onClick={() => navigate('/login')}>
                Login
              </button>
              <button className="btn-secondary" onClick={() => navigate('/signup')}>
                Sign Up
              </button>
            </div>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!activePromotion) {
    return (
      <div className="instagram-promo-page">
        <Navbar />
        <div className="container promo-container">
          <motion.div 
            className="no-promo-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FiInfo className="info-icon" />
            <h2>No Active Promotions</h2>
            <p>There are currently no active Instagram promotions. Check back later!</p>
            <button className="btn-primary" onClick={() => navigate('/')}>
              Go Home
            </button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  const hasAlreadyClaimed = eligibility?.redemption && !eligibility.eligible;
  const redemption = eligibility?.redemption;

  return (
    <div className="instagram-promo-page">
      <Navbar />
      
      <div className="promo-bg-effects">
        <div className="promo-bg-orb promo-bg-orb-1"></div>
        <div className="promo-bg-orb promo-bg-orb-2"></div>
        <div className="promo-bg-orb promo-bg-orb-3"></div>
      </div>

      <div className="container promo-container">
        {/* Hero Section */}
        <motion.div 
          className="promo-hero"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="promo-badge">
            <FiGift className="badge-icon" />
            Instagram Promotion
          </div>
          <h1 className="promo-title">
            <FiInstagram className="title-icon instagram-icon" />
            Win {activePromotion.discount_value} Minutes FREE Gaming!
          </h1>
          <p className="promo-subtitle">
            Follow us on Instagram and share with {activePromotion.required_friends_count} friends to claim your reward
          </p>
        </motion.div>

        {/* Success Message */}
        <AnimatePresence>
          {successMessage && (
            <motion.div 
              className="success-alert"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <FiCheck className="alert-icon" />
              <p>{successMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div 
              className="error-alert"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <FiX className="alert-icon" />
              <p>{error}</p>
              <button className="close-btn" onClick={() => setError('')}>×</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="promo-content">
          {/* How It Works */}
          <motion.div 
            className="how-it-works-card"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2><FiInfo className="card-icon" /> How It Works</h2>
            <div className="steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Follow Us</h3>
                  <p>Follow <strong>{activePromotion.instagram_handle}</strong> on Instagram</p>
                  <a 
                    href={`https://instagram.com/${activePromotion.instagram_handle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="instagram-link"
                  >
                    <FiInstagram /> Follow Now
                  </a>
                </div>
              </div>
              
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Share with Friends</h3>
                  <p>Share our Instagram page with at least {activePromotion.required_friends_count} friends via DM or Story</p>
                </div>
              </div>
              
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Claim Your Reward</h3>
                  <p>Fill in the form below with your Instagram username and your friends' handles</p>
                </div>
              </div>
              
              <div className="step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>Book & Get Discount</h3>
                  <p>Your {activePromotion.discount_value} min FREE gaming will be automatically applied when you book!</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Status Card */}
          {hasAlreadyClaimed && redemption ? (
            <motion.div 
              className="status-card claimed"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <FiUserCheck className="status-icon" />
              <h2>Already Claimed!</h2>
              <p>You've already claimed this promotion.</p>
              
              <div className="redemption-details">
                <div className="detail-row">
                  <span className="label">Redemption Code:</span>
                  <span className="value code">{redemption.redemption_code}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Status:</span>
                  <span className={`value status ${redemption.verification_status}`}>
                    {redemption.verification_status.toUpperCase()}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Used:</span>
                  <span className="value">{redemption.is_used ? 'Yes' : 'No'}</span>
                </div>
                {redemption.expires_at && (
                  <div className="detail-row">
                    <span className="label">Expires:</span>
                    <span className="value">
                      <FiClock /> {new Date(redemption.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {!redemption.is_used && redemption.verification_status === 'verified' && (
                <div className="ready-to-book">
                  <FiAward className="award-icon" />
                  <p>Ready to redeem! Your discount will be applied automatically when you book.</p>
                  <button className="btn-primary" onClick={() => navigate('/booking')}>
                    Book Now
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              className="claim-card"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {!showClaimForm ? (
                <div className="claim-intro">
                  <FiGift className="claim-icon" />
                  <h2>Ready to Claim?</h2>
                  <p>Complete the steps above and claim your {activePromotion.discount_value} minutes of FREE gaming!</p>
                  <button 
                    className="btn-primary btn-large"
                    onClick={() => setShowClaimForm(true)}
                  >
                    <FiShare2 /> Claim Now
                  </button>
                </div>
              ) : (
                <form className="claim-form" onSubmit={handleClaimPromotion}>
                  <h2>Claim Your Reward</h2>
                  
                  <div className="form-group">
                    <label>Your Instagram Username</label>
                    <div className="input-with-icon">
                      <FiInstagram className="input-icon" />
                      <input
                        type="text"
                        placeholder="@yourusername"
                        value={instagramUsername}
                        onChange={(e) => setInstagramUsername(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Friends' Instagram Handles (minimum {activePromotion.required_friends_count})</label>
                    {friendHandles.map((handle, index) => (
                      <div key={index} className="input-with-icon" style={{ marginBottom: '0.5rem' }}>
                        <FiShare2 className="input-icon" />
                        <input
                          type="text"
                          placeholder={`@friend${index + 1}`}
                          value={handle}
                          onChange={(e) => handleFriendHandleChange(index, e.target.value)}
                          required={index < activePromotion.required_friends_count}
                        />
                      </div>
                    ))}
                    <button 
                      type="button" 
                      className="btn-add-friend"
                      onClick={handleAddFriendField}
                    >
                      + Add Another Friend
                    </button>
                  </div>

                  <div className="terms">
                    <FiInfo className="terms-icon" />
                    <small>{activePromotion.terms_conditions}</small>
                  </div>

                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="btn-secondary"
                      onClick={() => setShowClaimForm(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? 'Submitting...' : 'Claim Reward'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </div>

        {/* Terms & Conditions */}
        <motion.div 
          className="terms-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3>Terms & Conditions</h3>
          <ul>
            <li>You must be logged in to claim this promotion</li>
            <li>One redemption per user per promotion</li>
            <li>You must genuinely follow our Instagram account</li>
            <li>Share with real friends (we may verify)</li>
            <li>Discount will be automatically applied when booking while logged in</li>
            <li>Redemption code expires in 30 days</li>
            <li>Cannot be combined with other discounts</li>
            <li>GameSpot reserves the right to reject fraudulent claims</li>
          </ul>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default InstagramPromoPage;
