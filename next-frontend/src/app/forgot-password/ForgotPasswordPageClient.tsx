'use client';
// @ts-nocheck

import Link from 'next/link';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

import React, { useState, useEffect } from 'react';
import { 
  FiMail, 
  FiLock,
  FiSend,
  FiArrowLeft,
  FiAlertCircle,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiShield
} from 'react-icons/fi';
import { apiFetch } from '@/services/apiClient';
import '@/styles/LoginPage.css';

const ForgotPasswordPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Steps: 'enter-email' | 'enter-otp' | 'new-password' | 'reset-token' | 'done'
  const [step, setStep] = useState('enter-email');

  // Form fields
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [countdown, setCountdown] = useState(0);

  // Check if URL has a reset token (legacy email link flow)
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setStep('reset-token');
    }
  }, [searchParams]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // ==================== STEP 1: Send OTP to email ====================
  const handleSendOtp = async (e) => {
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
        setStep('enter-otp');
        setSuccess(data.message || 'OTP has been sent to your email. Check your inbox!');
        setCountdown(60);
      } else {
        setError(data.error || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      const errMsg = err.message || 'Failed to send OTP. Please try again.';
      // Show a more helpful message for email delivery failures
      if (errMsg.toLowerCase().includes('email') && (errMsg.toLowerCase().includes('delivery') || errMsg.toLowerCase().includes('unavailable') || errMsg.toLowerCase().includes('failed'))) {
        setError('Email service is currently down. Please contact the shop directly to reset your password, or try again later.');
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    try {
      setLoading(true);
      setError(null);

      const data = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      if (data.success) {
        setSuccess('OTP resent! Check your inbox.');
        setCountdown(60);
      } else {
        setError(data.error || 'Failed to resend OTP.');
      }
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ==================== STEP 2: Verify OTP ====================
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const data = await apiFetch('/api/auth/verify-reset-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp })
      });

      if (data.success) {
        setStep('new-password');
        setSuccess('OTP verified! Set your new password.');
      } else {
        setError(data.error || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ==================== STEP 3: Reset password with OTP ====================
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

      const data = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email,
          otp,
          password: newPassword,
          confirmPassword
        })
      });

      if (data.success) {
        setStep('done');
        setSuccess('Password reset successful! Redirecting to login...');
        setTimeout(() => router.push('/login'), 2500);
      } else {
        setError(data.error || 'Password reset failed');
      }
    } catch (err) {
      setError(err.message || 'Password reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ==================== LEGACY: Token flow (from email link) ====================
  const handleTokenReset = async (e) => {
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

      const token = searchParams.get('token');

      const data = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          password: newPassword,
          confirmPassword
        })
      });

      if (data.success) {
        setStep('done');
        setSuccess('Password reset successful! Redirecting to login...');
        setTimeout(() => router.push('/login'), 2500);
      } else {
        setError(data.error || 'Password reset failed');
      }
    } catch (err) {
      setError(err.message || 'Password reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (pw) => {
    if (!pw) return null;
    if (pw.length < 6) return { text: 'Too Short', color: '#ef4444', width: '20%' };
    if (pw.length < 8) return { text: 'Weak', color: '#f59e0b', width: '40%' };
    if (pw.length < 12) return { text: 'Medium', color: '#eab308', width: '65%' };
    return { text: 'Strong', color: '#22c55e', width: '100%' };
  };

  const strength = getPasswordStrength(newPassword);

  // ==================== PASSWORD FIELDS (reusable) ====================
  const renderPasswordFields = () => (
    <>
      <div className="form-group">
        <label htmlFor="new-pw" className="form-label">New Password</label>
        <div className="input-wrapper" style={{ position: 'relative' }}>
          <FiLock className="input-icon" />
          <input
            id="new-pw"
            type={showPassword ? 'text' : 'password'}
            className="form-input"
            placeholder="Minimum 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoComplete="new-password"
            style={{ paddingRight: '2.75rem' }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'var(--lp-gray-light)',
              cursor: 'pointer', padding: '4px', display: 'flex'
            }}
          >
            {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
          </button>
        </div>
        {strength && (
          <div style={{ marginTop: '0.35rem' }}>
            <div style={{ height: '3px', borderRadius: '2px', background: '#e5e7eb', overflow: 'hidden' }}>
              <div style={{ width: strength.width, height: '100%', background: strength.color, transition: 'all 0.3s', borderRadius: '2px' }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: strength.color, fontWeight: '500' }}>{strength.text}</span>
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="confirm-pw" className="form-label">Confirm Password</label>
        <div className="input-wrapper">
          <FiLock className="input-icon" />
          <input
            id="confirm-pw"
            type={showPassword ? 'text' : 'password'}
            className="form-input"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
        {confirmPassword && (
          <small style={{
            color: newPassword === confirmPassword ? '#22c55e' : '#ef4444',
            fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', fontWeight: '500'
          }}>
            {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
          </small>
        )}
      </div>
    </>
  );

  // ==================== RENDER ====================
  return (
    <div className="login-page">
<div className="login-container">
        <div className="login-card" style={{ maxWidth: '440px' }}>

          {/* Header */}
          <div className="login-header">
            {step === 'done' ? (
              <>
                <h2 className="form-title">Password Reset!</h2>
                <p className="form-subtitle">You can now login with your new password</p>
              </>
            ) : step === 'reset-token' ? (
              <>
                <h2 className="form-title">Set New Password</h2>
                <p className="form-subtitle">Enter your new password below</p>
              </>
            ) : step === 'new-password' ? (
              <>
                <h2 className="form-title">Set New Password</h2>
                <p className="form-subtitle">Choose a strong password for your account</p>
              </>
            ) : step === 'enter-otp' ? (
              <>
                <h2 className="form-title">Enter OTP</h2>
                <p className="form-subtitle">Check your email for the 6-digit code</p>
              </>
            ) : (
              <>
                <h2 className="form-title">Forgot Password?</h2>
                <p className="form-subtitle">We'll send an OTP to your email to reset it</p>
              </>
            )}
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

          {/* ===== STEP 1: ENTER EMAIL ===== */}
          {step === 'enter-email' && (
            <form onSubmit={handleSendOtp}>
              <p style={{ color: 'var(--lp-gray)', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                Enter your email address and we'll send you a one-time password (OTP) to reset your password.
              </p>
              <div className="form-group">
                <label htmlFor="reset-email" className="form-label">Email Address</label>
                <div className="input-wrapper">
                  <FiMail className="input-icon" />
                  <input
                    id="reset-email"
                    type="email"
                    className="form-input"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <><div className="loading-spinner"></div> Sending OTP...</>
                ) : (
                  <><FiSend /> Send OTP</>
                )}
              </button>
            </form>
          )}

          {/* ===== STEP 2: ENTER OTP ===== */}
          {step === 'enter-otp' && (
            <form onSubmit={handleVerifyOtp}>
              <div style={{
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                color: '#c2410c'
              }}>
                <FiShield size={16} />
                <span>OTP sent to <strong>{email}</strong></span>
              </div>

              {/* OTP Input */}
              <div className="form-group">
                <label htmlFor="otp-input" className="form-label">Enter OTP</label>
                <div className="input-wrapper">
                  <FiShield className="input-icon" />
                  <input
                    id="otp-input"
                    type="text"
                    className="form-input"
                    placeholder="6-digit OTP"
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(val);
                    }}
                    required
                    maxLength={6}
                    autoComplete="one-time-code"
                    autoFocus
                    inputMode="numeric"
                    style={{ letterSpacing: '0.3em', fontWeight: '600', fontSize: '1.1rem' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={countdown > 0 || loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: countdown > 0 ? 'var(--lp-gray-light)' : 'var(--lp-primary)',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      cursor: countdown > 0 ? 'default' : 'pointer',
                      padding: 0
                    }}
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading || otp.length < 6}>
                {loading ? (
                  <><div className="loading-spinner"></div> Verifying...</>
                ) : (
                  <><FiShield /> Verify OTP</>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep('enter-email'); setOtp(''); setError(null); setSuccess(null); }}
                style={{
                  width: '100%', marginTop: '0.75rem', padding: '0.7rem',
                  background: 'transparent', border: '1.5px solid #e5e7eb',
                  borderRadius: '10px', color: 'var(--lp-gray)',
                  fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--lp-primary)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                <FiArrowLeft size={15} /> Back
              </button>
            </form>
          )}

          {/* ===== STEP 3: NEW PASSWORD (after OTP verified) ===== */}
          {step === 'new-password' && (
            <form onSubmit={handleResetPassword}>
              {renderPasswordFields()}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <><div className="loading-spinner"></div> Resetting...</>
                ) : (
                  <><FiLock /> Reset Password</>
                )}
              </button>
            </form>
          )}

          {/* ===== LEGACY: RESET VIA TOKEN (from email link) ===== */}
          {step === 'reset-token' && (
            <form onSubmit={handleTokenReset}>
              {renderPasswordFields()}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <><div className="loading-spinner"></div> Resetting...</>
                ) : (
                  <><FiLock /> Reset Password</>
                )}
              </button>
            </form>
          )}

          {/* ===== STEP: DONE ===== */}
          {step === 'done' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem', fontSize: '1.75rem'
              }}>
                🎉
              </div>
              <p style={{ color: 'var(--lp-dark)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                Your password has been updated. Redirecting to login...
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => router.push('/login')}
              >
                Go to Login
              </button>
            </div>
          )}

          {/* Back to login link */}
          {step !== 'done' && (
            <div className="signup-prompt">
              <p>
                Remember your password?{' '}
                <Link href="/login" className="form-link">
                  Back to Login
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
