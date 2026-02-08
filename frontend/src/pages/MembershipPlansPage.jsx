import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/MembershipPlansPage.css';
import { apiFetch } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";


const MembershipPlansPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [plans, setPlans] = useState([]);
  const [currentMembership, setCurrentMembership] = useState(null);
  const [pendingMembership, setPendingMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Plan rank for upgrade logic
  const planRank = { monthly: 1, quarterly: 2, annual: 3 };

  useEffect(() => {
    loadData();
  }, [isAuthenticated, authLoading]);

  const loadData = async () => {
    if (authLoading) return;
    
    try {
      // 1️⃣ Load plans (public)
      const plansData = await apiFetch("/api/membership/plans");
      if (plansData.success) {
        setPlans(plansData.plans);
      }

      // 2️⃣ If authenticated as customer, load membership status
      if (isAuthenticated && !isAdmin) {
        const statusData = await apiFetch("/api/membership/status");
        if (statusData.success) {
          if (statusData.has_membership) {
            setCurrentMembership(statusData.membership);
          } else {
            setCurrentMembership(null);
          }
          if (statusData.has_pending) {
            setPendingMembership(statusData.pending_membership);
          } else {
            setPendingMembership(null);
          }
        }
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load membership plans");
    } finally {
      setLoading(false);
    }
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
      console.error("Subscribe error:", err);
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
      console.error("Upgrade error:", err);
      setError(err.message || "Upgrade request failed. Please try again.");
    } finally {
      setSubscribing(null);
    }
  };

  const getButtonState = (plan) => {
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

    // If user has a lower plan — show upgrade
    if (currentMembership) {
      const currentRank = planRank[currentMembership.plan_type] || 0;
      const planRankVal = planRank[plan.type] || 0;
      
      if (planRankVal > currentRank) {
        return { 
          label: `⬆ Upgrade to ${plan.name.split(' ')[0]}`, 
          className: 'upgrade', 
          disabled: subscribing === plan.type, 
          action: () => handleUpgrade(plan.type) 
        };
      }
      // Lower plan than current
      return { label: 'Lower Plan', className: 'primary', disabled: true, action: null };
    }

    // No membership — request new
    return { 
      label: subscribing === plan.type ? '⏳ Requesting...' : 'Request Membership', 
      className: 'primary', 
      disabled: subscribing === plan.type,
      action: () => handleSubscribe(plan.type)
    };
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
          <h1>� <span>Membership Plans</span></h1>
          <p>Save money with exclusive membership discounts on every booking. Pay at the shop and get activated!</p>
        </div>

        {/* Login prompt for guests */}
        {!isAuthenticated && (
          <div className="membership-login-prompt">
            <div>
              <h3>🔐 Login to Request a Plan</h3>
              <p>Create an account or login to request a membership plan</p>
            </div>
            <div className="login-prompt-buttons">
              <button 
                className="login-btn-orange"
                onClick={() => navigate('/login', { state: { from: '/membership' } })}
              >
                Login
              </button>
              <button 
                className="signup-btn-outline"
                onClick={() => navigate('/signup', { state: { from: '/membership' } })}
              >
                Sign Up
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="membership-error">❌ {error}</div>
        )}

        {/* Success message */}
        {successMsg && (
          <div className="membership-success">✅ {successMsg}</div>
        )}

        {/* Active membership banner */}
        {currentMembership && (
          <div className="membership-status-banner active">
            <div className="status-banner-header">
              <span className="status-icon">✅</span>
              <h3>Active Membership</h3>
            </div>
            <div className="status-banner-details">
              <span>
                Plan: <strong>{currentMembership.plan_type.charAt(0).toUpperCase() + currentMembership.plan_type.slice(1)}</strong>
              </span>
              <span>
                Discount: <strong>{currentMembership.discount_percentage}% OFF</strong>
              </span>
              <span>
                Expires: <strong>{new Date(currentMembership.end_date).toLocaleDateString()}</strong> ({currentMembership.days_remaining} days left)
              </span>
            </div>
          </div>
        )}

        {/* Pending request banner */}
        {pendingMembership && (
          <div className="membership-status-banner pending">
            <div className="status-banner-header">
              <span className="status-icon">⏳</span>
              <h3>Membership Request Pending</h3>
            </div>
            <div className="status-banner-details">
              <span>
                Plan: <strong>{pendingMembership.plan_type.charAt(0).toUpperCase() + pendingMembership.plan_type.slice(1)}</strong>
              </span>
              <span>
                Please visit the shop to complete payment. Admin will activate your membership.
              </span>
            </div>
          </div>
        )}

        {/* Plans grid */}
        <div className="membership-plans-grid">
          {plans.map((plan) => {
            const btnState = getButtonState(plan);
            return (
              <div 
                key={plan.type} 
                className={`membership-plan-card ${plan.popular ? 'popular' : ''}`}
              >
                {plan.popular && (
                  <div className="popular-badge">⭐ MOST POPULAR</div>
                )}

                <div className="plan-card-header">
                  <h3>{plan.name}</h3>
                  <div className="plan-price">₹{plan.price}</div>
                  <div className="plan-duration">{plan.duration_days} days</div>
                </div>

                <div className="plan-discount-badge">
                  <div className="discount-value">{plan.discount_percentage}% OFF</div>
                  <div className="discount-label">on all bookings</div>
                </div>

                <ul className="plan-features">
                  {plan.features.map((feature, index) => (
                    <li key={index}>
                      <span className="check-icon">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`membership-btn ${btnState.className}`}
                  onClick={btnState.action}
                  disabled={btnState.disabled}
                >
                  {btnState.label}
                </button>
              </div>
            );
          })}
        </div>

        {/* How It Works */}
        <div className="membership-how-it-works">
          <h3>💡 How It Works</h3>
          <p className="subtitle">Simple 4-step process to get your membership activated</p>
          <div className="how-it-works-grid">
            <div className="how-it-works-step">
              <div className="step-number">1</div>
              <div className="step-icon">📋</div>
              <h4>Choose a Plan</h4>
              <p>Select the plan that fits your gaming needs</p>
            </div>
            <div className="how-it-works-step">
              <div className="step-number">2</div>
              <div className="step-icon">📩</div>
              <h4>Submit Request</h4>
              <p>Your request is sent to the admin for approval</p>
            </div>
            <div className="how-it-works-step">
              <div className="step-number">3</div>
              <div className="step-icon">💰</div>
              <h4>Pay at Shop</h4>
              <p>Visit GameSpot and pay for your plan in-person</p>
            </div>
            <div className="how-it-works-step">
              <div className="step-number">4</div>
              <div className="step-icon">🎮</div>
              <h4>Start Saving</h4>
              <p>Admin activates your plan & enjoy discounts on bookings!</p>
            </div>
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
};

export default MembershipPlansPage;
