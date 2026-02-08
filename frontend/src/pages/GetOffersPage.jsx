import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiGift, FiPercent, FiClock, FiCheck, FiCopy, FiChevronDown, 
  FiTag, FiStar, FiArrowRight, FiX, FiZap, FiAward,
  FiShield, FiExternalLink 
} from 'react-icons/fi';
import { FaInstagram } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/GetOffersPage.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://gamespotbooking-v1-production.up.railway.app';

function GetOffersPage() {
  const navigate = useNavigate();
  const offersRef = useRef(null);

  // Active tab
  const [activeSection, setActiveSection] = useState('deals'); // 'deals', 'promo', 'instagram'

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoResult, setPromoResult] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');

  // Instagram promo state
  const [instaPromo, setInstaPromo] = useState(null);
  const [instaLoading, setInstaLoading] = useState(false);
  const [instaUsername, setInstaUsername] = useState('');
  const [sharedFriends, setSharedFriends] = useState(['', '', '', '', '']);
  const [claimResult, setClaimResult] = useState(null);
  const [claimLoading, setClaimLoading] = useState(false);

  // My redemptions
  const [myRedemptions, setMyRedemptions] = useState([]);

  // Copied state
  const [copiedCode, setCopiedCode] = useState('');

  // Load Instagram promo on mount
  useEffect(() => {
    loadInstaPromo();
  }, []);

  const loadInstaPromo = async () => {
    try {
      setInstaLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/instagram-promo/active`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success && data.promotions?.length > 0) {
        setInstaPromo(data.promotions[0]);
      }
    } catch (err) {
      console.error('Error loading Instagram promo:', err);
    } finally {
      setInstaLoading(false);
    }
  };

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }

    try {
      setPromoLoading(true);
      setPromoError('');
      setPromoResult(null);

      const response = await fetch(`${API_BASE_URL}/api/promo/validate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.trim().toUpperCase() }),
      });

      const data = await response.json();

      if (data.success && data.valid) {
        setPromoResult(data.promo_code);
      } else {
        setPromoError(data.error || 'Invalid promo code');
      }
    } catch (err) {
      setPromoError('Failed to validate code. Please try again.');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleClaimInstaPromo = async () => {
    if (!instaUsername.trim()) {
      alert('Please enter your Instagram username');
      return;
    }

    const filledFriends = sharedFriends.filter(f => f.trim());
    const requiredCount = instaPromo?.required_friends_count || 5;

    if (filledFriends.length < requiredCount) {
      alert(`Please share with at least ${requiredCount} friends`);
      return;
    }

    try {
      setClaimLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/instagram-promo/claim`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promotion_id: instaPromo.id,
          instagram_username: instaUsername.trim(),
          shared_with_friends: filledFriends,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setClaimResult(data.redemption);
      } else {
        alert(data.error || 'Failed to claim promotion. Please login first.');
      }
    } catch (err) {
      alert('Failed to claim. Please login and try again.');
    } finally {
      setClaimLoading(false);
    }
  };

  const updateFriend = (index, value) => {
    const updated = [...sharedFriends];
    updated[index] = value;
    setSharedFriends(updated);
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
    });
  };

  const openInstagram = () => {
    const handle = instaPromo?.instagram_handle || 'gamespot_kdlr';
    window.open(`https://instagram.com/${handle}`, '_blank', 'noopener');
  };

  // Static deals data for the gaming lounge
  const deals = [
    {
      id: 1,
      title: 'Happy Hour Gaming',
      description: 'Flat 20% off on weekday sessions between 10 AM - 2 PM. Perfect for morning gamers!',
      discount: '20% OFF',
      icon: '☀️',
      tag: 'Weekdays',
      color: '#6366f1',
      validTill: 'Ongoing',
    },
    {
      id: 2,
      title: 'Squad Night Special',
      description: 'Book 3 PS5 consoles together and get the 4th hour free for the whole squad.',
      discount: '1 HR FREE',
      icon: '🎮',
      tag: 'Groups',
      color: '#8b5cf6',
      validTill: 'Ongoing',
    },
    {
      id: 3,
      title: 'Birthday Bash Package',
      description: 'Celebrate at GameSpot! 2-hour party package with snacks, decorations & gaming for up to 8 players.',
      discount: '₹1499',
      icon: '🎂',
      tag: 'Party',
      color: '#ec4899',
      validTill: 'Ongoing',
    },
    {
      id: 4,
      title: 'First Timer Offer',
      description: 'New to GameSpot? Get 30 bonus minutes free on your first booking!',
      discount: '+30 MIN',
      icon: '🆕',
      tag: 'New Users',
      color: '#10b981',
      validTill: 'Ongoing',
    },
    {
      id: 5,
      title: 'Weekend Tournament Entry',
      description: 'Free tournament entry every Saturday! Compete in FIFA, Tekken & more for prizes.',
      discount: 'FREE ENTRY',
      icon: '🏆',
      tag: 'Weekends',
      color: '#f59e0b',
      validTill: 'Every Saturday',
    },
    {
      id: 6,
      title: 'Student Discount',
      description: 'Show your college ID and get 15% off on any session. Valid all day, every day!',
      discount: '15% OFF',
      icon: '🎓',
      tag: 'Students',
      color: '#3b82f6',
      validTill: 'Always',
    },
  ];

  // Membership benefits preview
  const membershipTiers = [
    { 
      name: 'Bronze', 
      price: '₹299/mo', 
      discount: '10%', 
      perks: ['10% off all bookings', 'Priority booking access', 'Monthly newsletter'],
      color: '#CD7F32',
      icon: <FiShield />,
    },
    { 
      name: 'Silver', 
      price: '₹599/quarter', 
      discount: '15%', 
      perks: ['15% off all bookings', 'Free tournament entry', 'Exclusive events access'],
      color: '#C0C0C0',
      icon: <FiAward />,
      popular: true,
    },
    { 
      name: 'Gold', 
      price: '₹1499/year', 
      discount: '20%', 
      perks: ['20% off all bookings', 'Free birthday party hour', 'VIP lounge access'],
      color: '#FFD700',
      icon: <FiStar />,
    },
  ];

  return (
    <div className="offers-page">
      <Navbar />

      {/* Hero Section */}
      <section className="offers-hero">
        <div className="offers-hero-bg">
          <div className="offers-hero-orb offers-hero-orb-1"></div>
          <div className="offers-hero-orb offers-hero-orb-2"></div>
          <div className="offers-hero-orb offers-hero-orb-3"></div>
          <div className="offers-hero-grid"></div>
        </div>
        <div className="offers-hero-content">
          <div className="offers-hero-badge">
            <FiGift className="offers-hero-badge-icon" />
            Exclusive Deals
          </div>
          <h1 className="offers-hero-title">
            Unlock Amazing <span className="offers-title-highlight">Offers</span>
          </h1>
          <p className="offers-hero-subtitle">
            Save big on gaming sessions with our exclusive deals, promo codes, and membership perks
          </p>
          <div className="offers-hero-stats">
            <div className="offers-stat-card">
              <span className="offers-stat-value">6+</span>
              <span className="offers-stat-label">Active Deals</span>
            </div>
            <div className="offers-stat-card">
              <span className="offers-stat-value">20%</span>
              <span className="offers-stat-label">Max Discount</span>
            </div>
            <div className="offers-stat-card">
              <span className="offers-stat-value">3</span>
              <span className="offers-stat-label">Membership Tiers</span>
            </div>
          </div>
          <button 
            className="offers-hero-cta"
            onClick={() => offersRef.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            <FiChevronDown className="offers-cta-icon" />
            View Offers
          </button>
        </div>
      </section>

      {/* Main Content */}
      <div className="offers-main" ref={offersRef}>

        {/* Section Navigation */}
        <div className="offers-tab-nav">
          <button 
            className={`offers-tab-btn ${activeSection === 'deals' ? 'active' : ''}`}
            onClick={() => setActiveSection('deals')}
          >
            <FiTag />
            <span>Deals & Offers</span>
          </button>
          <button 
            className={`offers-tab-btn ${activeSection === 'promo' ? 'active' : ''}`}
            onClick={() => setActiveSection('promo')}
          >
            <FiPercent />
            <span>Promo Code</span>
          </button>
          <button 
            className={`offers-tab-btn ${activeSection === 'instagram' ? 'active' : ''}`}
            onClick={() => setActiveSection('instagram')}
          >
            <FaInstagram />
            <span>Follow & Earn</span>
          </button>
        </div>

        {/* ===== DEALS TAB ===== */}
        {activeSection === 'deals' && (
          <div className="offers-deals-section">
            {/* Deals Grid */}
            <div className="offers-section-header">
              <h2 className="offers-section-title">
                <FiZap className="offers-section-icon" />
                Current Offers
              </h2>
              <p className="offers-section-subtitle">Take advantage of these exclusive GameSpot deals</p>
            </div>

            <div className="offers-deals-grid">
              {deals.map((deal, index) => (
                <div 
                  key={deal.id} 
                  className="offers-deal-card"
                  style={{ animationDelay: `${index * 0.06}s`, '--card-accent': deal.color }}
                >
                  <div className="offers-deal-card-top">
                    <span className="offers-deal-emoji">{deal.icon}</span>
                    <span className="offers-deal-tag">{deal.tag}</span>
                  </div>
                  <div className="offers-deal-discount">{deal.discount}</div>
                  <h3 className="offers-deal-title">{deal.title}</h3>
                  <p className="offers-deal-desc">{deal.description}</p>
                  <div className="offers-deal-footer">
                    <span className="offers-deal-validity">
                      <FiClock /> {deal.validTill}
                    </span>
                    <button 
                      className="offers-deal-action"
                      onClick={() => navigate('/booking')}
                    >
                      Book Now <FiArrowRight />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Membership Preview */}
            <div className="offers-membership-section">
              <div className="offers-section-header">
                <h2 className="offers-section-title">
                  <FiAward className="offers-section-icon" />
                  Membership Plans
                </h2>
                <p className="offers-section-subtitle">Get ongoing discounts with a GameSpot membership</p>
              </div>

              <div className="offers-membership-grid">
                {membershipTiers.map((tier, index) => (
                  <div 
                    key={tier.name} 
                    className={`offers-membership-card ${tier.popular ? 'popular' : ''}`}
                    style={{ animationDelay: `${index * 0.08}s`, '--tier-color': tier.color }}
                  >
                    {tier.popular && <div className="offers-popular-badge">Most Popular</div>}
                    <div className="offers-tier-icon" style={{ color: tier.color }}>
                      {tier.icon}
                    </div>
                    <h3 className="offers-tier-name">{tier.name}</h3>
                    <div className="offers-tier-price">{tier.price}</div>
                    <div className="offers-tier-discount">
                      <FiPercent /> {tier.discount} off all bookings
                    </div>
                    <ul className="offers-tier-perks">
                      {tier.perks.map((perk, i) => (
                        <li key={i}><FiCheck /> {perk}</li>
                      ))}
                    </ul>
                    <button 
                      className="offers-tier-btn"
                      onClick={() => navigate('/membership')}
                    >
                      Get {tier.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== PROMO CODE TAB ===== */}
        {activeSection === 'promo' && (
          <div className="offers-promo-section">
            <div className="offers-section-header">
              <h2 className="offers-section-title">
                <FiPercent className="offers-section-icon" />
                Redeem Promo Code
              </h2>
              <p className="offers-section-subtitle">Have a promo code? Enter it below to unlock your bonus!</p>
            </div>

            <div className="offers-promo-card">
              <div className="offers-promo-input-row">
                <div className="offers-promo-input-wrapper">
                  <FiTag className="offers-promo-input-icon" />
                  <input
                    type="text"
                    placeholder="Enter promo code (e.g., PROMO1234AB)"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value.toUpperCase());
                      setPromoError('');
                      setPromoResult(null);
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && validatePromoCode()}
                    className="offers-promo-input"
                    maxLength={20}
                  />
                  {promoCode && (
                    <button 
                      className="offers-promo-clear"
                      onClick={() => { setPromoCode(''); setPromoResult(null); setPromoError(''); }}
                    >
                      <FiX />
                    </button>
                  )}
                </div>
                <button 
                  className="offers-promo-validate-btn"
                  onClick={validatePromoCode}
                  disabled={promoLoading || !promoCode.trim()}
                >
                  {promoLoading ? (
                    <span className="offers-btn-spinner"></span>
                  ) : (
                    <>Validate <FiArrowRight /></>
                  )}
                </button>
              </div>

              {promoError && (
                <div className="offers-promo-error">
                  <FiX /> {promoError}
                </div>
              )}

              {promoResult && (
                <div className="offers-promo-success">
                  <div className="offers-promo-success-icon">🎉</div>
                  <h3>Valid Promo Code!</h3>
                  <p>You've got <strong>+{promoResult.bonus_minutes} bonus minutes</strong> on your next booking!</p>
                  <div className="offers-promo-code-display">
                    <span>{promoResult.code}</span>
                    <button onClick={() => copyToClipboard(promoResult.code)}>
                      {copiedCode === promoResult.code ? <FiCheck /> : <FiCopy />}
                    </button>
                  </div>
                  <button 
                    className="offers-promo-book-btn"
                    onClick={() => navigate('/booking')}
                  >
                    Book Now & Apply <FiArrowRight />
                  </button>
                </div>
              )}
            </div>

            {/* How promo codes work */}
            <div className="offers-promo-info-grid">
              <div className="offers-promo-info-card">
                <div className="offers-promo-info-num">1</div>
                <h4>Get a Code</h4>
                <p>Earn promo codes through events, Instagram, or from friends</p>
              </div>
              <div className="offers-promo-info-card">
                <div className="offers-promo-info-num">2</div>
                <h4>Validate</h4>
                <p>Enter your code above to check it's valid and see the bonus</p>
              </div>
              <div className="offers-promo-info-card">
                <div className="offers-promo-info-num">3</div>
                <h4>Book & Save</h4>
                <p>Apply the code when booking to get free bonus minutes!</p>
              </div>
            </div>
          </div>
        )}

        {/* ===== INSTAGRAM TAB ===== */}
        {activeSection === 'instagram' && (
          <div className="offers-insta-section">
            <div className="offers-section-header">
              <h2 className="offers-section-title">
                <FaInstagram className="offers-section-icon" style={{ color: '#E1306C' }} />
                Follow & Earn Discount
              </h2>
              <p className="offers-section-subtitle">
                Follow our Instagram and share with friends to unlock an exclusive discount code
              </p>
            </div>

            {claimResult ? (
              /* Success — show claimed code */
              <div className="offers-insta-success-card">
                <div className="offers-insta-confetti">🎉</div>
                <h3>Congratulations!</h3>
                <p>You've earned a <strong>{claimResult.discount_type === 'percentage' ? `${claimResult.discount_value}%` : `₹${claimResult.discount_value}`}</strong> discount!</p>
                <div className="offers-insta-code-box" onClick={() => copyToClipboard(claimResult.redemption_code)}>
                  <span className="offers-insta-code-text">{claimResult.redemption_code}</span>
                  <span className="offers-insta-code-hint">
                    {copiedCode === claimResult.redemption_code ? '✓ Copied!' : 'Click to copy'}
                  </span>
                </div>
                <p className="offers-insta-code-expiry">
                  <FiClock /> Valid until {new Date(claimResult.expires_at).toLocaleDateString()}
                </p>
                <button className="offers-insta-book-btn" onClick={() => navigate('/booking')}>
                  Use Now — Book a Session <FiArrowRight />
                </button>
              </div>
            ) : (
              /* Claim flow */
              <div className="offers-insta-claim-card">
                {/* Step 1: Follow */}
                <div className="offers-insta-step">
                  <div className="offers-insta-step-header">
                    <div className="offers-insta-step-num">1</div>
                    <h4>Follow Us on Instagram</h4>
                  </div>
                  <button className="offers-insta-follow-btn" onClick={openInstagram}>
                    <FaInstagram />
                    Follow @{instaPromo?.instagram_handle || 'gamespot_kdlr'}
                    <FiExternalLink />
                  </button>
                </div>

                {/* Step 2: Enter your username */}
                <div className="offers-insta-step">
                  <div className="offers-insta-step-header">
                    <div className="offers-insta-step-num">2</div>
                    <h4>Your Instagram Username</h4>
                  </div>
                  <div className="offers-insta-input-row">
                    <span className="offers-insta-at">@</span>
                    <input
                      type="text"
                      placeholder="your_username"
                      value={instaUsername}
                      onChange={(e) => setInstaUsername(e.target.value)}
                      className="offers-insta-input"
                    />
                  </div>
                </div>

                {/* Step 3: Share with friends */}
                <div className="offers-insta-step">
                  <div className="offers-insta-step-header">
                    <div className="offers-insta-step-num">3</div>
                    <h4>Share with {instaPromo?.required_friends_count || 5} Friends</h4>
                  </div>
                  <p className="offers-insta-step-desc">
                    Enter the Instagram usernames of friends you've shared our page with
                  </p>
                  <div className="offers-insta-friends-grid">
                    {sharedFriends.map((friend, index) => (
                      <div key={index} className="offers-insta-friend-input-row">
                        <span className="offers-insta-friend-num">{index + 1}</span>
                        <input
                          type="text"
                          placeholder={`Friend ${index + 1}'s username`}
                          value={friend}
                          onChange={(e) => updateFriend(index, e.target.value)}
                          className="offers-insta-friend-input"
                        />
                        {friend.trim() && <FiCheck className="offers-insta-friend-check" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progress */}
                <div className="offers-insta-progress">
                  <div className="offers-insta-progress-bar">
                    <div 
                      className="offers-insta-progress-fill"
                      style={{ width: `${(sharedFriends.filter(f => f.trim()).length / (instaPromo?.required_friends_count || 5)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="offers-insta-progress-text">
                    {sharedFriends.filter(f => f.trim()).length} / {instaPromo?.required_friends_count || 5} friends shared
                  </span>
                </div>

                {/* Claim Button */}
                <button 
                  className="offers-insta-claim-btn"
                  onClick={handleClaimInstaPromo}
                  disabled={claimLoading || sharedFriends.filter(f => f.trim()).length < (instaPromo?.required_friends_count || 5) || !instaUsername.trim()}
                >
                  {claimLoading ? (
                    <span className="offers-btn-spinner"></span>
                  ) : (
                    <>
                      <FiGift /> Claim My Discount
                    </>
                  )}
                </button>

                {instaPromo && (
                  <p className="offers-insta-reward-preview">
                    🎁 Reward: <strong>{instaPromo.discount_type === 'percentage' ? `${instaPromo.discount_value}% off` : `₹${instaPromo.discount_value} off`}</strong> your next booking
                  </p>
                )}
              </div>
            )}

            {/* Terms */}
            {instaPromo?.terms_conditions && (
              <div className="offers-insta-terms">
                <p><strong>Terms & Conditions:</strong> {instaPromo.terms_conditions}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default GetOffersPage;
