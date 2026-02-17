'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#0f172a',
      color: '#fff',
      padding: '2rem',
      textAlign: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Something went wrong
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem', maxWidth: '400px' }}>
        We hit an unexpected error. Please try again.
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={reset}
          style={{
            padding: '0.75rem 2rem',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
        <button
          onClick={() => { if (typeof window !== 'undefined') window.location.href = '/'; }}
          style={{
            padding: '0.75rem 2rem',
            background: 'transparent',
            border: '1.5px solid rgba(255,255,255,0.2)',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
