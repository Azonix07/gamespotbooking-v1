import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { apiFetch } from '../services/apiClient';
import '../styles/AdminLoginPage.css';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState('request'); // 'request' or 'reset'
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Check if URL has reset token
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      setStep('reset');
    }
  }, [location]);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const data = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      
      if (data.success) {
        setSuccess('If the email exists, a reset link has been sent. Please check your email (or console in dev mode).');
      } else {
        setError(data.error || 'Failed to send reset email');
      }
      
    } catch (err) {
      setError(err.message || 'Failed to send reset email. Please try again.');
      console.error('Reset request error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      
      const data = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          password: newPassword,
          confirmPassword
        })
      });
      
      if (data.success) {
        setSuccess('Password reset successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.error || 'Password reset failed');
      }
      
    } catch (err) {
      setError(err.message || 'Password reset failed. Please try again.');
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)' }}>
      <Navbar showCenter={false} />
      <div className="container">
        <div className="card" style={{ maxWidth: '500px', margin: '4rem auto' }}>
          <h2 className="card-title" style={{ textAlign: 'center' }}>
            {step === 'request' ? '🔑 Forgot Password' : '🔒 Reset Password'}
          </h2>
          
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              color: '#ef4444'
            }}>
              ❌ {error}
            </div>
          )}
          
          {success && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              color: '#22c55e'
            }}>
              ✅ {success}
            </div>
          )}
          
          {step === 'request' ? (
            <form onSubmit={handleRequestReset}>
              <p style={{ color: 'var(--light-gray)', marginBottom: '1.5rem' }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
              
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  autoComplete="email"
                  autoFocus
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  {loading ? '🔄 Sending...' : '📧 Send Reset Link'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/login')}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <p style={{ color: 'var(--light-gray)', marginBottom: '1.5rem' }}>
                Enter your new password below.
              </p>
              
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    style={{ paddingRight: '3rem' }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--light-gray)',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      fontSize: '1.2rem'
                    }}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                />
                {confirmPassword && (
                  <small style={{ 
                    color: newPassword === confirmPassword ? '#22c55e' : '#ef4444',
                    fontSize: '0.85rem',
                    marginTop: '0.25rem',
                    display: 'block'
                  }}>
                    {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </small>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  {loading ? '🔄 Resetting...' : '🔒 Reset Password'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/login')}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          
          <div style={{ 
            marginTop: '2rem', 
            padding: '1.5rem', 
            background: 'rgba(99, 102, 241, 0.05)', 
            borderRadius: '0.5rem',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, color: 'var(--light-gray)' }}>
              Remember your password?{' '}
              <Link 
                to="/login" 
                style={{ 
                  color: 'var(--primary)', 
                  textDecoration: 'none', 
                  fontWeight: 'bold' 
                }}
              >
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
