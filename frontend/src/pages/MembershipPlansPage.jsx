import React, { useState, useEffect, useRef } from 'react';
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
  const [cardFeedback, setCardFeedback] = useState({}); // per-card inline feedback
  const [showConfirm, setShowConfirm] = useState(null); // { planType, planName, price, action: 'subscribe'|'upgrade' }
  const messageBannerRef = useRef(null);

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

  // Scroll to message banner
  const scrollToMessage = () => {
    setTimeout(() => {
      messageBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  // Show confirmation dialog before subscribe/upgrade
  const confirmAction = (planType, planName, price, action) => {
    setShowConfirm({ planType, planName, price, action });
  };

  const executeConfirmedAction = async () => {
    if (!showConfirm) return;
    const { planType, action } = showConfirm;
    setShowConfirm(null);
    if (action === 'upgrade') {
      await doUpgrade(planType);
    } else {
      await doSubscribe(planType);
    }
  };

  const doSubscribe = async (planType) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/membership" } });
      return;
    }
    try {
      setSubscribing(planType);
      setError(null);
      setSuccessMsg(null);
      setCardFeedback(prev => ({ ...prev, [planType]: { type: 'loading', msg: 'Sending request...' } }));

      const data = await apiFetch("/api/membership/subscribe", {
        method: "POST",
        body: JSON.stringify({ plan_type: planType }),
      });
      if (data.success) {
        setSuccessMsg(data.message);
        setCardFeedback(prev => ({ ...prev, [planType]: { type: 'success', msg: 'Request sent! ✅' } }));
        scrollToMessage();
        await loadData();
      } else {
        setError(data.error || "Request failed");
        setCardFeedback(prev => ({ ...prev, [planType]: { type: 'error', msg: data.error || 'Request failed' } }));
        scrollToMessage();
      }
    } catch (err) {
      const msg = err.message || "Request failed. Please try again.";
      setError(msg);
      setCardFeedback(prev => ({ ...prev, [planType]: { type: 'error', msg } }));
      scrollToMessage();
    } finally {
      setSubscribing(null);
      // Clear card feedback after 5 seconds
      setTimeout(() => {
        setCardFeedback(prev => { const copy = { ...prev }; delete copy[planType]; return copy; });
      }, 5000);
    }
  };

  const doUpgrade = async (planType) => {
    try {
      setSubscribing(planType);
      setError(null);
      setSuccessMsg(null);
      setCardFeedback(prev => ({ ...prev, [planType]: { type: 'loading', msg: 'Sending upgrade request...' } }));

      const data = await apiFetch("/api/membership/upgrade", {
        method: "POST",
        body: JSON.stringify({ plan_type: planType }),
      });
      if (data.success) {
        setSuccessMsg(data.message);
        setCardFeedback(prev => ({ ...prev, [planType]: { type: 'success', msg: 'Upgrade request sent! ✅' } }));
        scrollToMessage();
        await loadData();
      } else {
        setError(data.error || "Upgrade request failed");
        setCardFeedback(prev => ({ ...prev, [planType]: { type: 'error', msg: data.error || 'Upgrade failed' } }));
        scrollToMessage();
      }
    } catch (err) {
      const msg = err.message || "Upgrade request failed.";
      setError(msg);
      setCardFeedback(prev => ({ ...prev, [planType]: { type: 'error', msg } }));
      scrollToMessage();
    } finally {
      setSubscribing(null);
      setTimeout(() => {
        setCardFeedback(prev => { const copy = { ...prev }; delete copy[planType]; return copy; });
      }, 5000);
    }
  };

  const handleSubscribe = (planType) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/membership" } });
      return;
    }
    // Find plan details for confirmation dialog
    const allPlans = categories ? [
      ...(categories.story_pass?.plans || []),
      ...(categories.driving_pass?.plans || [])
    ] : [];
    const plan = allPlans.find(p => p.type === planType);
    confirmAction(planType, plan?.name || planType, plan?.price || 0, 'subscribe');
  };

  const handleUpgrade = (planType) => {
    const allPlans = categories ? [
      ...(categories.story_pass?.plans || []),
      ...(categories.driving_pass?.plans || [])
    ] : [];
    const plan = allPlans.find(p => p.type === planType);
    confirmAction(planType, plan?.name || planType, plan?.price || 0, 'upgrade');
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
                >
                  {/* ─── FRONT FACE ─── */}
                  <div
                    className="pass-card-face pass-card-front"
                    style={{ background: plan.gradient, color: plan.font_color || '#ffffff' }}
                    onClick={() => toggleFlip(plan.type)}
                  >
                    {/* Card Content */}
                    <div className="card-front-content">
                      <div className="card-tier-badge" style={plan.tier === 'premium' ? { color: '#d4a017', background: 'rgba(212, 160, 23, 0.15)', border: '1px solid rgba(212, 160, 23, 0.3)' } : plan.tier === 'standard' ? { color: '#1a1a2e', background: 'rgba(0,0,0,0.12)' } : {}}>{tierLabel}</div>
                      <div className="card-plan-icon">{plan.chip_icon}</div>
                      <h3 className="card-plan-name" style={{ color: plan.font_color || '#ffffff' }}>{plan.name}</h3>
                      <p className="card-plan-tagline" style={{ color: plan.font_color ? `${plan.font_color}aa` : 'rgba(255,255,255,0.75)' }}>{plan.tagline}</p>
                    </div>

                    {/* Card Price */}
                    <div className="card-front-price" style={{ color: plan.font_color || '#ffffff' }}>
                      <span className="price-symbol">₹</span>
                      <span className="price-value">{plan.price}</span>
                      <span className="price-period">/month</span>
                    </div>

                    {/* Card Bottom */}
                    <div className="card-front-bottom" style={{ color: plan.font_color ? `${plan.font_color}cc` : 'rgba(255,255,255,0.75)', borderTopColor: plan.font_color ? `${plan.font_color}33` : 'rgba(255,255,255,0.15)' }}>
                      <span className="card-hours">{plan.hours} hrs</span>
                      <span className="card-divider">•</span>
                      <span className="card-rate">₹{plan.rate_per_hour}/hr</span>
                      <span className="card-divider">•</span>
                      <span className="card-daily">{plan.max_daily}</span>
                    </div>

                    {/* Tap hint */}
                    <div className="card-tap-hint">
                      <span style={{ color: plan.font_color ? `${plan.font_color}66` : 'rgba(255,255,255,0.4)' }}>TAP TO VIEW DETAILS</span>
                    </div>
                  </div>

                  {/* ─── BACK FACE ─── */}
                  <div className="pass-card-face pass-card-back" style={{ '--accent': plan.accent }}>
                    <div className="card-back-top">
                      <div className="card-back-action">
                        <button
                          className={`card-action-btn ${btnState.className}`}
                          style={
                            btnState.className === 'primary'
                              ? { background: plan.gradient }
                              : {}
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (btnState.action) btnState.action();
                          }}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                          }}
                          disabled={btnState.disabled || subscribing === plan.type}
                        >
                          {subscribing === plan.type ? '⏳ Sending...' : btnState.label}
                        </button>
                        {/* Inline card feedback */}
                        {cardFeedback[plan.type] && (
                          <div className={`card-inline-feedback ${cardFeedback[plan.type].type}`}>
                            {cardFeedback[plan.type].msg}
                          </div>
                        )}
                      </div>

                      <ul className="card-back-features">
                        {plan.features.map((feature, i) => (
                          <li key={i}>
                            <span className="feature-check" style={{ color: plan.accent }}>✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="card-back-bottom" onClick={() => toggleFlip(plan.type)}>
                      <div className="back-hint">
                        <span>TAP TO FLIP BACK</span>
                      </div>
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
        <div ref={messageBannerRef}>
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
        </div>

        {/* Confirmation Dialog */}
        <AnimatePresence>
          {showConfirm && (
            <motion.div
              className="membership-confirm-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(null)}
            >
              <motion.div
                className="membership-confirm-dialog"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="confirm-icon">
                  {showConfirm.action === 'upgrade' ? '⬆️' : '📋'}
                </div>
                <h3>{showConfirm.action === 'upgrade' ? 'Confirm Upgrade' : 'Confirm Plan Selection'}</h3>
                <p>
                  {showConfirm.action === 'upgrade'
                    ? `Upgrade to ${showConfirm.planName} for ₹${showConfirm.price}/month?`
                    : `Request ${showConfirm.planName} pass for ₹${showConfirm.price}/month?`
                  }
                </p>
                <p className="confirm-note">
                  Your request will be sent to the admin. Visit the shop to pay and get it activated.
                </p>
                <div className="confirm-buttons">
                  <button className="confirm-btn confirm-yes" onClick={executeConfirmedAction}>
                    {showConfirm.action === 'upgrade' ? '⬆ Yes, Upgrade' : '✓ Yes, Request Plan'}
                  </button>
                  <button className="confirm-btn confirm-no" onClick={() => setShowConfirm(null)}>
                    Cancel
                  </button>
                </div>
              </motion.div>
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
              {currentMembership.total_hours > 0 && (
                <span>Hours: <strong>{currentMembership.hours_remaining ?? (currentMembership.total_hours - (currentMembership.hours_used || 0))}/{currentMembership.total_hours} hrs remaining</strong></span>
              )}
              {currentMembership.rate_per_hour > 0 && (
                <span>Rate: <strong>₹{currentMembership.rate_per_hour}/hr</strong></span>
              )}
            </div>
            <p className="status-banner-note">You can upgrade to a higher tier within the same category below.</p>
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
