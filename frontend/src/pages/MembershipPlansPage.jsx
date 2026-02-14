import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/MembershipPlansPage.css';
import { apiFetch } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";


const MembershipPlansPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState(null);
  const [currentMembership, setCurrentMembership] = useState(null);
  const [pendingMembership, setPendingMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [flippedCards, setFlippedCards] = useState({});

  // Plan rank map for upgrade logic
  const planRankMap = {
    solo_quest: { rank: 1, category: 'story' },
    legend_mode: { rank: 2, category: 'story' },
    god_mode: { rank: 3, category: 'story' },
    ignition: { rank: 1, category: 'driving' },
    turbo: { rank: 2, category: 'driving' },
    apex: { rank: 3, category: 'driving' },
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated, authLoading]);

  const loadData = async () => {
    if (authLoading) return;
    try {
      const plansData = await apiFetch("/api/membership/plans");
      if (plansData.success) {
        setCategories(plansData.categories);
      }
      if (isAuthenticated && !isAdmin) {
        const statusData = await apiFetch("/api/membership/status");
        if (statusData.success) {
          setCurrentMembership(statusData.has_membership ? statusData.membership : null);
          setPendingMembership(statusData.has_pending ? statusData.pending_membership : null);
        }
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load membership plans");
    } finally {
      setLoading(false);
    }
  };

  const toggleFlip = (planType) => {
    setFlippedCards(prev => ({ ...prev, [planType]: !prev[planType] }));
  };

  const handleSubscribe = async (planType) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/membership" } });
      return;
    }
    try {
      setSubscribing(planType);
      setError(null);
      setSuccessMsg(null);
      const data = await apiFetch("/api/membership/subscribe", {
        method: "POST",
        body: JSON.stringify({ plan_type: planType }),
      });
      if (data.success) {
        setSuccessMsg(data.message);
        loadData();
      } else {
        setError(data.error || "Request failed");
      }
    } catch (err) {
      setError(err.message || "Request failed. Please try again.");
    } finally {
      setSubscribing(null);
    }
  };

  const handleUpgrade = async (planType) => {
    try {
      setSubscribing(planType);
      setError(null);
      setSuccessMsg(null);
      const data = await apiFetch("/api/membership/upgrade", {
        method: "POST",
        body: JSON.stringify({ plan_type: planType }),
      });
      if (data.success) {
        setSuccessMsg(data.message);
        loadData();
      } else {
        setError(data.error || "Upgrade request failed");
      }
    } catch (err) {
      setError(err.message || "Upgrade request failed.");
    } finally {
      setSubscribing(null);
    }
  };

  const getButtonState = (plan, categoryKey) => {
    const planInfo = planRankMap[plan.type];
    if (!planInfo) return { label: 'Select Plan', className: 'primary', disabled: false, action: () => handleSubscribe(plan.type) };

    // If this plan has a pending request
    if (pendingMembership && pendingMembership.plan_type === plan.type) {
      return { label: '⏳ Request Pending', className: 'pending-btn', disabled: true, action: null };
    }
    // Any pending request blocks new requests
    if (pendingMembership) {
      return { label: 'Pending Request Exists', className: 'pending-btn', disabled: true, action: null };
    }
    // If user has this plan active
    if (currentMembership && currentMembership.plan_type === plan.type) {
      return { label: '✓ Current Plan', className: 'current', disabled: true, action: null };
    }
    // If user has a plan in the same category — show upgrade or lower
    if (currentMembership) {
      const currentInfo = planRankMap[currentMembership.plan_type];
      if (currentInfo && currentInfo.category === planInfo.category) {
        if (planInfo.rank > currentInfo.rank) {
          return {
            label: `⬆ Upgrade`,
            className: 'upgrade',
            disabled: subscribing === plan.type,
            action: () => handleUpgrade(plan.type)
          };
        }
        return { label: 'Lower Tier', className: 'lower', disabled: true, action: null };
      }
    }
    // No membership in this category — request new
    return {
      label: subscribing === plan.type ? '⏳ Requesting...' : 'Select Plan',
      className: 'primary',
      disabled: subscribing === plan.type,
      action: () => handleSubscribe(plan.type)
    };
  };

  const renderPassCategory = (categoryKey, category) => {
    const isStory = categoryKey === 'story_pass';
    const themeClass = isStory ? 'story-theme' : 'driving-theme';

    return (
      <div className={`pass-category ${themeClass}`} key={categoryKey}>
        {/* Category Header */}
        <div className="pass-category-header">
          <div className="pass-category-icon">{category.icon}</div>
          <div className="pass-category-text">
            <h2>{category.title}</h2>
            <p>{category.subtitle}</p>
          </div>
        </div>

        {/* Cards Row */}
        <div className="pass-cards-row">
          {category.plans.map((plan, index) => {
            const isFlipped = flippedCards[plan.type] || false;
            const btnState = getButtonState(plan, categoryKey);
            const tierLabel = plan.tier === 'basic' ? 'BASIC' : plan.tier === 'standard' ? 'STANDARD' : 'PREMIUM';

            return (
              <div className="pass-card-wrapper" key={plan.type}>
                {plan.popular && (
                  <div className="popular-ribbon">
                    <span>POPULAR</span>
                  </div>
                )}
                <div
                  className={`pass-card ${isFlipped ? 'flipped' : ''} tier-${plan.tier}`}
                  onClick={() => toggleFlip(plan.type)}
                >
                  {/* ─── FRONT FACE ─── */}
                  <div className="pass-card-face pass-card-front" style={{ background: plan.gradient }}>
                    {/* Chip */}
                    <div className="card-chip">
                      <div className="chip-lines">
                        <div className="chip-line"></div>
                        <div className="chip-line"></div>
                        <div className="chip-line"></div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="card-front-content">
                      <div className="card-tier-badge">{tierLabel}</div>
                      <div className="card-plan-icon">{plan.chip_icon}</div>
                      <h3 className="card-plan-name">{plan.name}</h3>
                      <p className="card-plan-tagline">{plan.tagline}</p>
                    </div>

                    {/* Card Price */}
                    <div className="card-front-price">
                      <span className="price-symbol">₹</span>
                      <span className="price-value">{plan.price}</span>
                      <span className="price-period">/month</span>
                    </div>

                    {/* Card Bottom */}
                    <div className="card-front-bottom">
                      <span className="card-hours">{plan.hours} hrs</span>
                      <span className="card-divider">•</span>
                      <span className="card-rate">₹{plan.rate_per_hour}/hr</span>
                      <span className="card-divider">•</span>
                      <span className="card-daily">{plan.max_daily}</span>
                    </div>

                    {/* Tap hint */}
                    <div className="card-tap-hint">
                      <span>TAP TO VIEW DETAILS</span>
                    </div>
                  </div>

                  {/* ─── BACK FACE ─── */}
                  <div className="pass-card-face pass-card-back" style={{ '--accent': plan.accent }}>
                    <div className="card-back-header">
                      <span className="card-back-icon">{plan.chip_icon}</span>
                      <h3>{plan.name}</h3>
                      <div className="card-back-price">₹{plan.price}<span>/month</span></div>
                    </div>

                    <ul className="card-back-features">
                      {plan.features.map((feature, i) => (
                        <li key={i}>
                          <span className="feature-check" style={{ color: plan.accent }}>✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      className={`card-action-btn ${btnState.className}`}
                      style={
                        btnState.className === 'primary'
                          ? { background: plan.gradient }
                          : {}
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        if (btnState.action) btnState.action();
                      }}
                      disabled={btnState.disabled}
                    >
                      {btnState.label}
                    </button>

                    <div className="card-tap-hint back-hint">
                      <span>TAP TO FLIP BACK</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="membership-page">
        <Navbar variant="light" />
        <div className="membership-container">
          <div className="membership-loading">
            <div className="spinner"></div>
            <p>Loading membership plans...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="membership-page">
      <Navbar variant="light" />
      <div className="membership-container">

        {/* Header */}
        <div className="membership-header">
          <h1>🎮 <span>GameSpot</span> Passes</h1>
          <p>Choose your pass. Tap a card to reveal full details and subscribe.</p>
        </div>

        {/* Login prompt */}
        {!isAuthenticated && (
          <div className="membership-login-prompt">
            <div>
              <h3>🔐 Login to Subscribe</h3>
              <p>Create an account or login to request a membership pass</p>
            </div>
            <div className="login-prompt-buttons">
              <button className="login-btn-orange" onClick={() => navigate('/login', { state: { from: '/membership' } })}>
                Login
              </button>
              <button className="signup-btn-outline" onClick={() => navigate('/signup', { state: { from: '/membership' } })}>
                Sign Up
              </button>
            </div>
          </div>
        )}

        {/* Banners */}
        <AnimatePresence>
          {error && (
            <motion.div className="membership-error" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              ❌ {error}
            </motion.div>
          )}
          {successMsg && (
            <motion.div className="membership-success" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              ✅ {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active membership */}
        {currentMembership && (
          <div className="membership-status-banner active">
            <div className="status-banner-header">
              <span className="status-icon">✅</span>
              <h3>Active Pass</h3>
            </div>
            <div className="status-banner-details">
              <span>Plan: <strong>{currentMembership.plan_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong></span>
              <span>Expires: <strong>{new Date(currentMembership.end_date).toLocaleDateString()}</strong> ({currentMembership.days_remaining} days left)</span>
            </div>
          </div>
        )}

        {/* Pending request */}
        {pendingMembership && (
          <div className="membership-status-banner pending">
            <div className="status-banner-header">
              <span className="status-icon">⏳</span>
              <h3>Request Pending</h3>
            </div>
            <div className="status-banner-details">
              <span>Plan: <strong>{pendingMembership.plan_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong></span>
              <span>Visit the shop to complete payment. Admin will activate your pass.</span>
            </div>
          </div>
        )}

        {/* Pass Categories */}
        {categories && (
          <>
            {renderPassCategory('story_pass', categories.story_pass)}
            {renderPassCategory('driving_pass', categories.driving_pass)}
          </>
        )}

        {/* How It Works */}
        <div className="membership-how-it-works">
          <h3>�� How It Works</h3>
          <p className="subtitle">Simple steps to get your pass activated</p>
          <div className="how-it-works-grid">
            <div className="how-it-works-step">
              <div className="step-number">1</div>
              <div className="step-icon">📋</div>
              <h4>Pick a Pass</h4>
              <p>Tap a card, view details & select your tier</p>
            </div>
            <div className="how-it-works-step">
              <div className="step-number">2</div>
              <div className="step-icon">📩</div>
              <h4>Submit Request</h4>
              <p>Your request is sent to admin for approval</p>
            </div>
            <div className="how-it-works-step">
              <div className="step-number">3</div>
              <div className="step-icon">💰</div>
              <h4>Pay at Shop</h4>
              <p>Visit GameSpot and pay for your pass in-person</p>
            </div>
            <div className="how-it-works-step">
              <div className="step-number">4</div>
              <div className="step-icon">🎮</div>
              <h4>Start Playing</h4>
              <p>Admin activates your pass — game on!</p>
            </div>
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
};

export default MembershipPlansPage;
