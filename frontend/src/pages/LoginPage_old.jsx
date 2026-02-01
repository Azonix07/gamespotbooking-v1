import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
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
import { FaGoogle, FaApple } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import '../styles/LoginPage.css';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '548928058829-your-client-id.apps.googleusercontent.com';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAdmin, login, signup, loading: authLoading } = useAuth();
  
  // No tabs - just login
  
  // OTP Login fields
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [userName, setUserName] = useState(''); // For new users
  
  // Old login fields (keep for admin)
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  // Redirect if already authenticated
  useEffect(() => {
    // Don't redirect if we're in the middle of submitting
    if (!authLoading && isAuthenticated && !isSubmitting) {
      console.log('[LoginPage] Already authenticated, redirecting...', { isAdmin });
      if (isAdmin) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, authLoading, navigate, location.state, isSubmitting]);

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
        setSuccess(`OTP sent to ${phone}. Check console for OTP: ${data.otp}`);
        console.log('OTP:', data.otp); // For testing
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
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
          name: userName || 'Guest'
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Login successful! Redirecting...');
        
        // Use the login function from context to set authentication state
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
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError(null);
      
      // Send Google token to backend
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
        
        // Use the login function from context
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

  const handleGoogleError = () => {
    setError('Google login failed. Please try again.');
  };

  const handleAppleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Apple Sign In Web
      if (window.AppleID) {
        const data = await window.AppleID.auth.signIn();
        
        // Send Apple token to backend
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://gamespotbooking-v1-backend-production.up.railway.app'}/api/auth/apple-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            id_token: data.authorization.id_token,
            user: data.user
          }),
          credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
          setSuccess('Login successful! Redirecting...');
          
          await login(result.user.email, 'APPLE_LOGIN', result);
          
          setTimeout(() => {
            const from = location.state?.from?.pathname || '/';
            navigate(from, { replace: true });
          }, 500);
        } else {
          setError(result.error || 'Apple login failed');
        }
      } else {
        setError('Apple Sign In is not available in this browser');
      }
    } catch (err) {
      setError('Apple login failed. Please try again.');
      console.error('Apple login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    // Prevent double submission
    if (loading || isSubmitting) {
      console.log('[LoginPage] Already submitting, ignoring duplicate submission');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setLoading(true);
      setError(null);
      
      console.log('[LoginPage] Starting login process...');
      
      const result = await login(identifier, password);
      
      console.log('[LoginPage] Login result:', result);
      
      if (result.success) {
        console.log('[LoginPage] Login successful, navigating...', { userType: result.userType });
        
        // Small delay to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (result.userType === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          const from = location.state?.from?.pathname || '/';
          navigate(from, { replace: true });
        }
      } else {
        console.error('[LoginPage] Login failed:', result.error);
        setError(result.error || 'Login failed');
        setIsSubmitting(false); // Reset on failure
      }
      
    } catch (err) {
      console.error('[LoginPage] Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
      setIsSubmitting(false); // Reset on error
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    // Prevent double submission
    if (loading || isSubmitting) {
      console.log('[LoginPage] Already submitting, ignoring duplicate submission');
      return;
    }
    
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
      setIsSubmitting(true);
      setLoading(true);
      setError(null);
      
      console.log('[LoginPage] Starting signup process...');
      
      const result = await signup({
        name: signupName,
        email: signupEmail,
        phone: signupPhone,
        password: signupPassword,
        confirmPassword: confirmPassword
      });
      
      console.log('[LoginPage] Signup result:', result);
      
      if (result.success) {
        setSuccess('Account created successfully! Redirecting...');
        
        // Small delay before redirect
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        console.error('[LoginPage] Signup failed:', result.error);
        setError(result.error || 'Registration failed');
        setIsSubmitting(false); // Reset on failure
      }
      
    } catch (err) {
      console.error('[LoginPage] Signup error:', err);
      setError(err.message || 'Registration failed. Please try again.');
      setIsSubmitting(false); // Reset on error
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
            <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP}>
              <h2 className="form-title">Welcome Back!</h2>
              <p className="form-subtitle">Login with your mobile number</p>

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
                      Your Name (for new users)
                    </label>
                    <div className="input-wrapper">
                      <FiUser className="input-icon" />
                      <input
                        id="userName"
                        type="text"
                        className="form-input"
                        placeholder="Enter your name (optional)"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        autoComplete="name"
                      />
                    </div>
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
                <div className="text-center">
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
