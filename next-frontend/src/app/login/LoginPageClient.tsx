'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiMail, FiLock, FiLogIn, FiAlertCircle, FiCheckCircle, FiPhone } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/services/apiClient';
import '@/styles/LoginPage.css';

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isAdmin, login, loading: authLoading } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated && !success) {
      if (isAdmin) {
        router.replace('/admin/dashboard');
      } else {
        const from = searchParams.get('from') || '/';
        router.replace(from);
      }
    }
  }, [isAuthenticated, isAdmin, authLoading, router, searchParams, success]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) { setError('Please enter your email/phone and password'); return; }
    try {
      setLoading(true); setError(null);
      const result = await login(identifier.trim(), password);
      if (result.success) {
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          const from = searchParams.get('from') || '/';
          if (result.userType === 'admin') router.replace('/admin/dashboard');
          else router.replace(from);
        }, 150);
      } else {
        const errMsg = result.error || 'Login failed. Please check your credentials.';
        setError(errMsg);
        setShowResendVerification(errMsg.toLowerCase().includes('not verified'));
      }
    } catch { setError('Login failed. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleResendVerification = async () => {
    const emailValue = identifier.trim();
    if (!emailValue || !emailValue.includes('@')) { setError('Please enter your email address to resend verification.'); return; }
    try {
      setResendLoading(true); setError(null);
      const data = await apiFetch('/api/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email: emailValue }) });
      if (data.auto_verified) setSuccess('Your account has been verified! You can now login.');
      else setSuccess(data.message || 'Verification email sent! Please check your inbox.');
      setShowResendVerification(false);
    } catch (err: any) { setError(err.message || 'Failed to resend verification email.'); }
    finally { setResendLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h2 className="form-title">Welcome Back!</h2>
            <p className="form-subtitle">Sign in to your GameSpot account</p>
          </div>

          {error && (
            <div className="alert alert-error"><FiAlertCircle className="alert-icon" /><span>{error}</span></div>
          )}

          {showResendVerification && (
            <button type="button" onClick={handleResendVerification} disabled={resendLoading}
              style={{ width: '100%', padding: '0.65rem', marginBottom: '1rem', background: 'transparent', border: '1.5px solid #00e5ff', borderRadius: '10px', color: '#00e5ff', fontSize: '0.875rem', fontWeight: '500', cursor: resendLoading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <FiMail size={15} />{resendLoading ? 'Sending...' : 'Resend Verification Email'}
            </button>
          )}

          {success && (
            <div className="alert alert-success"><FiCheckCircle className="alert-icon" /><span>{success}</span></div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="identifier" className="form-label">Email or Phone Number</label>
              <div className="input-wrapper">
                {/^\+?\d[\d\s-]{6,}$/.test(identifier) ? <FiPhone className="input-icon" /> : <FiMail className="input-icon" />}
                <input id="identifier" type="text" className="form-input" placeholder="Enter your email or phone number" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoComplete="username" />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="input-wrapper">
                <FiLock className="input-icon" />
                <input id="password" type="password" className="form-input" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
              </div>
              <div className="forgot-password-row">
                <Link href="/forgot-password" className="forgot-link">Forgot password?</Link>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (<><div className="loading-spinner"></div>Logging in...</>) : (<><FiLogIn />Login</>)}
            </button>
          </form>

          <div className="signup-prompt">
            <p>Don&apos;t have an account?{' '}<Link href="/signup" className="form-link">Sign up here</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
