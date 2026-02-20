/**
 * Route-level loading state for /booking.
 * Uses ONLY inline styles — no external CSS dependency.
 * This shows during client-side navigation while the booking page chunk loads.
 * On slow networks, BookingPage.css may not be available yet, so we
 * cannot rely on any CSS classes.
 */
export default function BookingLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #ffffff 0%, #fff5f0 30%, #ffe8dc 60%, #ffffff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 48,
            height: 48,
            margin: '0 auto 16px',
            border: '3px solid rgba(255,107,53,0.15)',
            borderTopColor: '#ff6b35',
            borderRadius: '50%',
            animation: 'booking-load-spin 0.8s linear infinite',
          }}
        />
        <p style={{ color: '#6c757d', fontSize: '0.95rem', margin: 0 }}>Loading booking…</p>
      </div>
      <style>{`@keyframes booking-load-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
