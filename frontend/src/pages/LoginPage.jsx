import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  FiMail, 
  FiLock, 
  FiUser, 
  FiPhone, 
  FiEye, 
  FiEyeOff,
  FiLogIn,
  FiUserPlus,
  FiAlertCircle,
  FiCheckCircle
} from 'react-icons/fi';
import Navbar from '../components/Navbar';
import { apiFetch } from '../services/apiClient';
import '../styles/LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('login');
  
  // Login fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  // Signup fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const data = await apiFetch('/api/auth/check');
      
      if (data.authenticated) {
        if (data.user_type === 'admin') {
          navigate('/admin/dashboard');
        } else {
          const from = location.state?.from?.pathname || '/';
          navigate(from);
        }
      }
    } catch (err) {
      console.error('Session check error:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: identifier,
          password: password
        })
      });
      
      if (data.success) {
        if (data.user_type === 'admin') {
          navigate('/admin/dashboard');
        } else {
          const from = location.state?.from?.pathname || '/';
          navigate(from);
        }
      } else {
        setError(data.error || 'Login failed');
      }
      
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    
    if (!signupName || !signupEmail || !signupPhone || !signupPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          phone: signupPhone,
          password: signupPassword
        })
      });
      
      if (data.success) {
        setSuccess('Account created successfully! Redirecting...');
        setTimeout(() => {
          const from = location.state?.from?.pathname || '/';
          navigate(from);
        }, 1500);
      } else {
        setError(data.error || 'Registration failed');
      }
      
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Navbar />
      
      <div className="login-container">
        <div className="login-card">
          {/* Tabs */}
          <div className="tab-container">
            <button 
              className={`tab-button ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('login');
                setError(null);
                setSuccess(null);
              }}
            >
              <FiLogIn style={{ display: 'inline', marginRight: '0.5rem' }} />
              Login
            </button>
            <button 
              className={`tab-button ${activeTab === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('signup');
                setError(null);
                setSuccess(null);
              }}
            >
              <FiUserPlus style={{ display: 'inline', marginRight: '0.5rem' }} />
              Sign Up
            </button>
          </div>

          {/* Alerts */}
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

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleSubmit}>
              <h2 className="form-title">Welcome Back!</h2>
              <p className="form-subtitle">Login to access your account</p>

              <div className="form-group">
                <label htmlFor="identifier" className="form-label">
                  Email or Username
                </label>
                <div className="input-wrapper">
                  <FiMail className="input-icon" />
                  <input
                    id="identifier"
                    type="text"
                    className="form-input"
                    placeholder="Enter your email or username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    autoComplete="username"
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
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
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
                    Logging in...
                  </>
                ) : (
                  <>
                    <FiLogIn />
                    Login
                  </>
                )}
              </button>

              <div className="text-center">
                <Link to="/forgot-password" className="form-link">
                  Forgot Password?
                </Link>
              </div>
            </form>
          )}

          {/* Signup Form */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignupSubmit}>
              <h2 className="form-title">Create Account</h2>
              <p className="form-subtitle">Join GameSpot today!</p>

              <div className="form-group">
                <label htmlFor="signup-name" className="form-label">
                  Full Name
                </label>
                <div className="input-wrapper">
                  <FiUser className="input-icon" />
                  <input
                    id="signup-name"
                    type="text"
                    className="form-input"
                    placeholder="Enter your full name"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="signup-email" className="form-label">
                  Email Address
                </label>
                <div className="input-wrapper">
                  <FiMail className="input-icon" />
                  <input
                    id="signup-email"
                    type="email"
                    className="form-input"
                    placeholder="Enter your email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="signup-phone" className="form-label">
                  Phone Number
                </label>
                <div className="input-wrapper">
                  <FiPhone className="input-icon" />
                  <input
                    id="signup-phone"
                    type="tel"
                    className="form-input"
                    placeholder="Enter your phone number"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    required
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="signup-password" className="form-label">
                  Password
                </label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Create a password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                <p className="helper-text">Minimum 6 characters</p>
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password" className="form-label">
                  Confirm Password
                </label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-secondary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <FiUserPlus />
                    Create Account
                  </>
                )}
              </button>
            </form>
          )}

          <div className="divider">OR</div>

          <div className="text-center">
            {activeTab === 'login' ? (
              <p>
                Don't have an account?{' '}
                <span 
                  className="form-link"
                  onClick={() => {
                    setActiveTab('signup');
                    setError(null);
                    setSuccess(null);
                  }}
                >
                  Sign up now
                </span>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <span 
                  className="form-link"
                  onClick={() => {
                    setActiveTab('login');
                    setError(null);
                    setSuccess(null);
                  }}
                >
                  Login here
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
