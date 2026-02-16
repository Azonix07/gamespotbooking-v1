'use client';

/**
 * GameSpot Loading Animation
 * Gaming-themed loading screen with controller icon and animated progress bar.
 */
export default function GameSpotLoader({ variant = 'dark' }: { variant?: 'dark' | 'admin' }) {
  return (
    <div className={`gs-loading-screen ${variant === 'admin' ? 'gs-loading-admin' : ''}`}>
      <div className="gs-loading-icon">
        <div className="gs-loading-ring" />
        <span className="gs-loading-controller" role="img" aria-label="Loading">🎮</span>
      </div>
      <div className="gs-loading-bar-track">
        <div className="gs-loading-bar-fill" />
      </div>
      <p className="gs-loading-text">
        <span className="gs-loading-dots">Loading</span>
      </p>
    </div>
  );
}
