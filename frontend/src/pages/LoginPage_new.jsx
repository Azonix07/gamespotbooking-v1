import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { 
  FiPhone, 
  FiLock, 
  FiUser,
  FiLogIn,
  FiAlertCircle,
  FiCheckCircle
} from 'react-icons/fi';
import { FaGoogle, FaApple } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import '../styles/LoginPage.css';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '548928058829-your-client-id.apps.googleusercontent.com';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAdmin, login, loading: authLoading } = useAuth();
  
  // OTP Login fields
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [userName, setUserName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // OTP timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (isAdmin) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, authLoading, navigate, location.state]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://gamespotbooking-v1-backend-production.up.railway.app'}/api/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setOtpSent(true);
        setOtpTimer(300); // 5 minutes
        setSuccess(`OTP sent successfully!`);
        // Show OTP in console for testing
        console.log(`🔐 OTP for ${phone}: ${data.otp}`);
        alert(`OTP sent! Check console for OTP: ${data.otp}`);
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
      console.error('OTP send error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://gamespotbooking-v1-backend-production.up.railway.app'}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone, 
          otp,
          name: userName || 'User'
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Login successful! Redirecting...');
        
        // Use login context to set state
        await login(phone, 'OTP_LOGIN', data);
        
        setTimeout(() => {
          const from = location.state?.from?.pathname || '/';
          navigate(from, { replace: true });
        }, 500);
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('Failed to verify OTP. Please try again.');
      console.error('OTP verify error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://gamespotbooking-v1-backend-production.up.railway.app'}/api/auth/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          credential: credentialResponse.credential 
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Login successful! Redirecting...');
        await login(data.user.email, 'GOOGLE_LOGIN', data);
        
        setTimeout(() => {
          const from = location.state?.from?.pathname || '/';
          navigate(from, { replace: true });
        }, 500);
      } else {
        setError(data.error || 'Google login failed');
      }
    } catch (err) {
      setError('Google login failed. Please try again.');
      console.error('Google login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setError('Apple Sign In will be available soon!');
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="login-page">
        <Navbar />
        
        <div className="login-container">
          <div className="login-card">
            <h2 className="form-title">Welcome to GameSpot!</h2>
            <p className="form-subtitle">Login to continue</p>

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

            {/* OTP Login Form */}
            <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP}>
              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Mobile Number
                </label>
                <div className="input-wrapper">
                  <FiPhone className="input-icon" />
                  <input
                    id="phone"
                    type="tel"
                    className="form-input"
                    placeholder="Enter 10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    required
                    disabled={otpSent}
                    autoComplete="tel"
                  />
                </div>
              </div>

              {otpSent && (
                <>
                  <div className="form-group">
                    <label htmlFor="otp" className="form-label">
                      Enter OTP
                    </label>
                    <div className="input-wrapper">
                      <FiLock className="input-icon" />
                      <input
                        id="otp"
                        type="text"
                        className="form-input"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        required
                        autoComplete="one-time-code"
                      />
                    </div>
                    <div className="otp-timer">
                      {otpTimer > 0 ? (
                        <span>OTP expires in {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}</span>
                      ) : (
                        <button 
                          type="button" 
                          className="form-link"
                          onClick={() => {
                            setOtpSent(false);
                            setOtp('');
                          }}
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="userName" className="form-label">
                      Your Name
                    </label>
                    <div className="input-wrapper">
                      <FiUser className="input-icon" />
                      <input
                        id="userName"
                        type="text"
                        className="form-input"
                        placeholder="Enter your name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        autoComplete="name"
                      />
                    </div>
                    <small style={{color: '#6c757d', fontSize: '0.85rem'}}>Required for new users</small>
                  </div>
                </>
              )}

              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading || (otpSent && otp.length !== 6)}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    {otpSent ? 'Verifying...' : 'Sending OTP...'}
                  </>
                ) : (
                  <>
                    <FiLogIn />
                    {otpSent ? 'Verify & Login' : 'Send OTP'}
                  </>
                )}
              </button>

              {otpSent && (
                <div className="text-center" style={{marginTop: '1rem'}}>
                  <button 
                    type="button" 
                    className="form-link"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                      setPhone('');
                    }}
                  >
                    Change Mobile Number
                  </button>
                </div>
              )}
            </form>

            {/* Divider */}
            <div className="divider">
              <span>OR</span>
            </div>

            {/* Social Login Buttons */}
            <div className="social-login">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google login failed')}
                useOneTap
                size="large"
                text="continue_with"
                shape="rectangular"
                logo_alignment="left"
                width="100%"
              />
              
              <button 
                type="button"
                className="apple-login-btn"
                onClick={handleAppleLogin}
                disabled={loading}
              >
                <FaApple style={{fontSize: '1.5rem'}} />
                Continue with Apple
              </button>
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default LoginPage;
