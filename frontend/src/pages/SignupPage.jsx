import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FiUser,
  FiMail,
  FiPhone,
  FiLock, 
  FiUserPlus,
  FiAlertCircle,
  FiCheckCircle,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/apiClient';
import '../styles/LoginPage.css';

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup, isAuthenticated, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  // Redirect if already authenticated (but not right after a signup)
  useEffect(() => {
    if (!authLoading && isAuthenticated && !success) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, success]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email');
      return false;
    }

    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { text: '', color: '' };
    if (password.length < 6) return { text: 'Too Short', color: '#ef4444' };
    if (password.length < 8) return { text: 'Weak', color: '#f59e0b' };
    if (password.length < 12) return { text: 'Medium', color: '#eab308' };
    return { text: 'Strong', color: '#22c55e' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const result = await signup(formData);
      
      if (result.success) {
        if (result.needs_verification) {
          // Email verification required — show message, don't redirect
          setNeedsVerification(true);
          setSuccess(result.message || 'Account created! Please check your email to verify your account before logging in.');
        } else {
          setSuccess('Account created successfully! Redirecting...');
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 1500);
        }
      } else {
        setError(result.error || 'Signup failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="login-page">
        <Navbar variant="light" />
        
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <h2 className="form-title">Create Account</h2>
              <p className="form-subtitle">Sign up to get started</p>
            </div>

            {error && (
              <div className="alert alert-error">
                <FiAlertCircle className="alert-icon" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                <FiCheckCircle className="alert-icon" />
                <span>{success}</span>
              </div>
            )}

            {needsVerification && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <FiMail style={{ fontSize: '2.5rem', color: '#00e5ff', marginBottom: '0.5rem' }} />
                <p style={{ color: '#b0b0b0', fontSize: '0.95rem', marginBottom: '1rem' }}>
                  We sent a verification link to <strong style={{ color: '#fff' }}>{formData.email}</strong>. 
                  Please check your inbox and click the link to verify your account.
                </p>
                <Link to="/login" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '0.75rem 2rem' }}>
                  Go to Login
                </Link>
              </div>
            )}

            {/* Signup Form */}
            {!needsVerification && (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Full Name
                </label>
                <div className="input-wrapper">
                  <FiUser className="input-icon" />
                  <input
                    id="name"
                    type="text"
                    name="name"
                    className="form-input"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <div className="input-wrapper">
                  <FiMail className="input-icon" />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    className="form-input"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Phone Number
                </label>
                <div className="input-wrapper">
                  <FiPhone className="input-icon" />
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    className="form-input"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className="form-input"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6c757d'
                    }}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {formData.password && (
                  <small style={{ color: passwordStrength.color, fontSize: '0.85rem' }}>
                    Password strength: {passwordStrength.text}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    className="form-input"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6c757d'
                    }}
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Creating account...
                  </>
                ) : (
                  <>
                    <FiUserPlus />
                    Sign Up
                  </>
                )}
              </button>
            </form>
            )}

            {/* Login Link */}
            <div className="signup-prompt">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="form-link">
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
  );
};

export default SignupPage;
