import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { 
  FiMail, 
  FiLock, 
  FiLogIn,
  FiAlertCircle,
  FiCheckCircle,
  FiPhone
} from 'react-icons/fi';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { apiFetch, setAccessToken } from '../services/apiClient';
import '../styles/LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAdmin, login, setAuthState, loading: authLoading } = useAuth();
  
  // Email or Phone / Password Login fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Redirect if already authenticated (but not right after login)
  useEffect(() => {
    if (!authLoading && isAuthenticated && !success) {
      if (isAdmin) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, authLoading, navigate, location.state, success]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!identifier || !password) {
      setError('Please enter your email/phone and password');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await login(identifier.trim(), password);
      
      if (result.success) {
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          const from = location.state?.from?.pathname || '/';
          if (result.userType === 'admin') {
            navigate('/admin/dashboard', { replace: true });
          } else {
            navigate(from, { replace: true });
          }
        }, 500);
      } else {
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiFetch('/api/auth/google-login', {
        method: 'POST',
        body: JSON.stringify({ 
          credential: credentialResponse.credential 
        })
      });
      
      if (data.success) {
        setSuccess('Login successful! Redirecting...');
        
        // Store JWT token in memory + localStorage via setAccessToken
        if (data.token) {
          setAccessToken(data.token);
          try {
            localStorage.setItem('gamespot_logged_in', 'true');
            localStorage.setItem('gamespot_user_type', data.user_type || data.userType || 'customer');
          } catch (e) {}
        }
        
        // Set auth state directly from Google response
        setAuthState(data.user, data.user_type || data.userType || 'customer');
        
        setTimeout(() => {
          const from = location.state?.from?.pathname || '/';
          navigate(from, { replace: true });
        }, 500);
      } else {
        setError(data.error || 'Google login failed');
      }
    } catch (err) {
      setError(err.message || 'Google login failed. Please try again.');
      console.error('Google login error:', err);
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
              <h2 className="form-title">Welcome Back!</h2>
              <p className="form-subtitle">Sign in to your GameSpot account</p>
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

            {/* Email/Phone Login Form */}
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="identifier" className="form-label">
                  Email or Phone Number
                </label>
                <div className="input-wrapper">
                  {/^\+?\d[\d\s-]{6,}$/.test(identifier) ? <FiPhone className="input-icon" /> : <FiMail className="input-icon" />}
                  <input
                    id="identifier"
                    type="text"
                    className="form-input"
                    placeholder="Enter your email or phone number"
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
                    type="password"
                    className="form-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <div className="forgot-password-row">
                  <Link to="/forgot-password" className="forgot-link">
                    Forgot password?
                  </Link>
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
            </form>

            {/* Divider */}
            <div className="divider">
              <span>OR</span>
            </div>

            {/* Google Login Button */}
            <div className="social-login">
              <div className="google-btn-wrapper">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google login failed')}
                  useOneTap={false}
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                  logo_alignment="left"
                  width={340}
                  itp_support
                />
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="signup-prompt">
              <p>
                Don't have an account?{' '}
                <Link to="/signup" className="form-link">
                  Sign up here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
  );
};

export default LoginPage;
