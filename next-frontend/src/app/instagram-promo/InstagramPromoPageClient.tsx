'use client';

export default function InstagramPromoPageClient() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: 'white',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>📸 Instagram Promo</h1>
        <p style={{ fontSize: '1.1rem', opacity: 0.8 }}>Follow @gamespot on Instagram for exclusive promo codes!</p>
      </div>
    </div>
  );
}
