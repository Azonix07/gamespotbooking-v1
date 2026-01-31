import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/AdminLoginPage.css';
import { apiFetch } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";


const MembershipPlansPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [plans, setPlans] = useState([]);
  const [currentMembership, setCurrentMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const [error, setError] = useState(null);

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
        if (statusData.success && statusData.has_membership) {
          setCurrentMembership(statusData.membership);
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

      const data = await apiFetch("/api/membership/subscribe", {
        method: "POST",
        body: JSON.stringify({ plan_type: planType }),
      });

      if (data.success) {
        alert(`✅ ${data.message}\n\nYour ${planType} membership is now active!`);
        loadData();
      } else {
        setError(data.error || "Subscription failed");
      }
    } catch (err) {
      console.error("Subscribe error:", err);
      setError("Subscription failed. Please try again.");
    } finally {
      setSubscribing(null);
    }
  };


  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--dark)' }}>
        <Navbar />
        <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: 'var(--light-gray)' }}>Loading membership plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)' }}>
      <Navbar />
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            💎 Membership Plans
          </h1>
          <p style={{ color: 'var(--light-gray)', fontSize: '1.1rem' }}>
            Save money with our exclusive membership discounts on every booking
          </p>
        </div>
        
        {/* Login prompt for guests */}
        {!isAuthenticated && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            padding: '1.5rem',
            borderRadius: '1rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h3 style={{ color: '#fff', marginBottom: '0.25rem', fontSize: '1.1rem' }}>
                🔐 Login to Subscribe
              </h3>
              <p style={{ color: 'var(--light-gray)', margin: 0, fontSize: '0.9rem' }}>
                Create an account or login to activate membership discounts
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => navigate('/login', { state: { from: '/membership' } })}
                style={{ padding: '0.6rem 1.5rem' }}
              >
                Login
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => navigate('/signup', { state: { from: '/membership' } })}
                style={{ padding: '0.6rem 1.5rem' }}
              >
                Sign Up
              </button>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '2rem',
            color: '#ef4444',
            textAlign: 'center'
          }}>
            ❌ {error}
          </div>
        )}

        {currentMembership && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '2px solid rgba(34, 197, 94, 0.3)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            marginBottom: '3rem',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#22c55e', marginBottom: '0.5rem' }}>
              ✅ Active Membership
            </h3>
            <p style={{ color: 'var(--light-gray)', marginBottom: '0.5rem' }}>
              Plan: <strong style={{ color: 'var(--text-primary)' }}>
                {currentMembership.plan_type.charAt(0).toUpperCase() + currentMembership.plan_type.slice(1)}
              </strong>
            </p>
            <p style={{ color: 'var(--light-gray)', marginBottom: '0.5rem' }}>
              Discount: <strong style={{ color: '#22c55e' }}>{currentMembership.discount_percentage}%</strong>
            </p>
            <p style={{ color: 'var(--light-gray)' }}>
              Expires: <strong style={{ color: 'var(--text-primary)' }}>
                {new Date(currentMembership.end_date).toLocaleDateString()}
              </strong> ({currentMembership.days_remaining} days remaining)
            </p>
          </div>
        )}

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {plans.map((plan) => (
            <div
              key={plan.type}
              className="card"
              style={{
                position: 'relative',
                border: plan.popular ? '2px solid var(--primary)' : '1px solid var(--border)',
                transform: plan.popular ? 'scale(1.05)' : 'none',
                boxShadow: plan.popular ? '0 10px 40px rgba(99, 102, 241, 0.3)' : 'none'
              }}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--primary)',
                  color: 'white',
                  padding: '0.25rem 1rem',
                  borderRadius: '1rem',
                  fontSize: '0.85rem',
                  fontWeight: 'bold'
                }}>
                  ⭐ POPULAR
                </div>
              )}

              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                  {plan.name}
                </h3>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                  ₹{plan.price}
                </div>
                <p style={{ color: 'var(--light-gray)', fontSize: '0.9rem' }}>
                  {plan.duration_days} days
                </p>
              </div>

              <div style={{
                background: 'rgba(99, 102, 241, 0.1)',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' }}>
                  {plan.discount_percentage}% OFF
                </div>
                <p style={{ color: 'var(--light-gray)', fontSize: '0.9rem', margin: 0 }}>
                  on all bookings
                </p>
              </div>

              <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                marginBottom: '2rem',
                color: 'var(--light-gray)'
              }}>
                {plan.features.map((feature, index) => (
                  <li key={index} style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ marginRight: '0.5rem', color: '#22c55e', flexShrink: 0 }}>✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className="btn btn-primary"
                onClick={() => handleSubscribe(plan.type)}
                disabled={
                  subscribing === plan.type || 
                  (currentMembership && currentMembership.plan_type === plan.type)
                }
                style={{ width: '100%' }}
              >
                {subscribing === plan.type 
                  ? '🔄 Subscribing...' 
                  : currentMembership && currentMembership.plan_type === plan.type
                  ? '✓ Current Plan'
                  : `Subscribe Now`}
              </button>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '3rem',
          padding: '2rem',
          background: 'rgba(99, 102, 241, 0.05)',
          borderRadius: '0.75rem',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          textAlign: 'center'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>💡 How It Works</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1.5rem',
            color: 'var(--light-gray)'
          }}>
            <div>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>1️⃣</div>
              <p>Choose a plan</p>
            </div>
            <div>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>2️⃣</div>
              <p>Subscribe instantly</p>
            </div>
            <div>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>3️⃣</div>
              <p>Book & save automatically</p>
            </div>
            <div>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>4️⃣</div>
              <p>Cancel anytime</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MembershipPlansPage;
