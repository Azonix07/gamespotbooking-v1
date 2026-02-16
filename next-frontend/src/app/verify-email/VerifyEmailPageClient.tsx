'use client';
// @ts-nocheck

import { usePathname, useSearchParams } from 'next/navigation';

import Link from 'next/link';

import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiMail } from 'react-icons/fi';
import { apiFetch } from '@/services/apiClient';
import '@/styles/LoginPage.css';

const VerifyEmailPage = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError('Invalid verification link. No token provided.');
      setLoading(false);
      return;
    }

    const verifyEmail = async () => {
      try {
        const data = await apiFetch(`/api/verify-email?token=${encodeURIComponent(token)}`);
        if (data.success) {
          setSuccess(data.message || 'Email verified successfully! You can now login.');
        } else {
          setError(data.error || 'Verification failed. The link may have expired.');
        }
      } catch (err) {
        setError(err.message || 'Verification failed. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="login-page">
<div className="login-container">
        <div className="login-card" style={{ maxWidth: '440px', textAlign: 'center' }}>
          <div className="login-header">
            <h2 className="form-title">Email Verification</h2>
          </div>

          {loading && (
            <div style={{ padding: '2rem 0' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 1rem', width: '40px', height: '40px' }}></div>
              <p style={{ color: '#b0b0b0', fontSize: '0.95rem' }}>Verifying your email...</p>
            </div>
          )}

          {success && (
            <>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem', fontSize: '2rem'
              }}>
                <FiCheckCircle color="#22c55e" size={36} />
              </div>
              <div className="alert alert-success">
                <FiCheckCircle className="alert-icon" />
                <span>{success}</span>
              </div>
              <Link href="/login" 
                className="btn-primary" 
                style={{ display: 'inline-flex', textDecoration: 'none', marginTop: '1rem', padding: '0.75rem 2rem' }}
              >
                Go to Login
              </Link>
            </>
          )}

          {error && (
            <>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem', fontSize: '2rem'
              }}>
                <FiAlertCircle color="#ef4444" size={36} />
              </div>
              <div className="alert alert-error">
                <FiAlertCircle className="alert-icon" />
                <span>{error}</span>
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/signup" 
                  className="btn-primary" 
                  style={{ display: 'inline-flex', textDecoration: 'none', padding: '0.75rem 1.5rem' }}
                >
                  <FiMail style={{ marginRight: '0.4rem' }} /> Sign Up Again
                </Link>
                <Link href="/login" 
                  style={{ 
                    display: 'inline-flex', textDecoration: 'none', padding: '0.75rem 1.5rem',
                    border: '1.5px solid #e5e7eb', borderRadius: '10px', color: 'var(--lp-gray)',
                    fontSize: '0.9rem', fontWeight: '500', alignItems: 'center'
                  }}
                >
                  Go to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
