import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiGift, FiClock, FiCheck, FiCopy, FiArrowRight, FiExternalLink, FiShare2, FiUsers, FiCheckCircle } from 'react-icons/fi';
import { FaInstagram, FaWhatsapp } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/GetOffersPage.css';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://gamespotkdlr.com';

function GetOffersPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [instaPromo, setInstaPromo] = useState(null);
  const [instaLoading, setInstaLoading] = useState(false);
  const [instaUsername, setInstaUsername] = useState('');
  const [hasFollowed, setHasFollowed] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [hasSharedVia, setHasSharedVia] = useState({ whatsapp: false, copy: false, native: false });
  const [claimResult, setClaimResult] = useState(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    loadInstaPromo();
  }, []);

  const loadInstaPromo = async () => {
    try {
      setInstaLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/instagram-promo/active`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success && data.promotions?.length > 0) {
        setInstaPromo(data.promotions[0]);
      }
    } catch (err) {
      console.error('Error loading Instagram promo:', err);
    } finally {
      setInstaLoading(false);
    }
  };

  const handleClaimInstaPromo = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/get-offers' } });
      return;
    }
    if (!instaUsername.trim()) return;
    if (shareCount < requiredCount) return;

    // Build share evidence from the methods used
    const shareEvidence = [];
    if (hasSharedVia.whatsapp) shareEvidence.push('shared_via_whatsapp');
    if (hasSharedVia.copy) shareEvidence.push('shared_via_link_copy');
    if (hasSharedVia.native) shareEvidence.push('shared_via_native_share');
    // Pad to required count with share confirmations
    while (shareEvidence.length < requiredCount) {
      shareEvidence.push('friend_share_' + (shareEvidence.length + 1));
    }

    try {
      setClaimLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/instagram-promo/claim`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promotion_id: instaPromo.id,
          instagram_username: instaUsername.trim(),
          shared_with_friends: shareEvidence,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setClaimResult(data.redemption);
      } else {
        if (data.error && data.error.toLowerCase().includes('login')) {
          navigate('/login', { state: { from: '/get-offers' } });
        } else {
          alert(data.error || 'Failed to claim promotion.');
        }
      }
    } catch (err) {
      alert('Failed to claim. Please try again.');
    } finally {
      setClaimLoading(false);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
    });
  };

  const instaHandle = instaPromo?.instagram_handle || 'gamespot_kdlr';
  const instaUrl = 'https://instagram.com/' + instaHandle;
  const shareText = '🎮 Check out GameSpot Gaming Lounge! Follow them on Instagram and get a FREE gaming hour! 🔥\n\n👉 ' + instaUrl + '\n\nBook your slot at gamespot now!';

  const openInstagram = () => {
    window.open(instaUrl, '_blank', 'noopener');
    setTimeout(() => setHasFollowed(true), 2000);
  };

  const shareViaWhatsApp = () => {
    const waUrl = 'https://wa.me/?text=' + encodeURIComponent(shareText);
    window.open(waUrl, '_blank', 'noopener');
    setHasSharedVia(prev => ({ ...prev, whatsapp: true }));
    setShareCount(prev => Math.min(prev + 3, requiredCount));
  };

  const shareViaCopyLink = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      setHasSharedVia(prev => ({ ...prev, copy: true }));
      setShareCount(prev => Math.min(prev + 2, requiredCount));
    });
  };

  const shareViaNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'GameSpot Gaming Lounge',
          text: '🎮 Follow GameSpot on Instagram & get a FREE gaming hour!',
          url: instaUrl,
        });
        setHasSharedVia(prev => ({ ...prev, native: true }));
        setShareCount(prev => Math.min(prev + 3, requiredCount));
      } catch (e) {
        // user cancelled
      }
    }
  };

  const confirmManualShare = () => {
    if (shareCount < requiredCount) {
      setShareCount(prev => Math.min(prev + 1, requiredCount));
    }
  };

  const requiredCount = instaPromo?.required_friends_count || 5;
  const progressPercent = (shareCount / requiredCount) * 100;
  const canClaim = shareCount >= requiredCount && instaUsername.trim() && hasFollowed;

  const totalShareMethods = Object.values(hasSharedVia).filter(Boolean).length;

  return (
    <div className="offers-page">
      <Navbar variant="light" />

      <div className="offers-bg">
        <div className="offers-bg-orb offers-bg-orb-1"></div>
        <div className="offers-bg-orb offers-bg-orb-2"></div>
        <div className="offers-bg-orb offers-bg-orb-3"></div>
      </div>

      <section className="offers-hero">
        <div className="offers-hero-content">
          <div className="offers-hero-icon-wrap">
            <FaInstagram className="offers-hero-ig-icon" />
          </div>
          <h1 className="offers-hero-title">
            Follow & Get <span className="offers-highlight">Free Hour</span>
          </h1>
          <p className="offers-hero-sub">
            3 simple steps — follow, share, claim. It takes less than a minute!
          </p>
        </div>
      </section>

      <div className="offers-container">

        {claimResult ? (
          <div className="offers-success-card">
            <div className="offers-success-confetti">🎉</div>
            <h2 className="offers-success-title">You Did It!</h2>
            <p className="offers-success-desc">
              {"You've earned a "}
              <strong>
                {claimResult.discount_type === 'percentage'
                  ? claimResult.discount_value + '% discount'
                  : '\u20B9' + claimResult.discount_value + ' off'}
              </strong>
              {" on your next booking!"}
            </p>

            <div className="offers-code-box" onClick={() => copyToClipboard(claimResult.redemption_code)}>
              <span className="offers-code-text">{claimResult.redemption_code}</span>
              <span className="offers-code-action">
                {copiedCode === claimResult.redemption_code ? (
                  <><FiCheck /> Copied!</>
                ) : (
                  <><FiCopy /> Tap to copy</>
                )}
              </span>
            </div>

            <p className="offers-code-expiry">
              <FiClock /> Valid until {new Date(claimResult.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

            <button className="offers-book-btn" onClick={() => navigate('/booking')}>
              Book Now & Use Code <FiArrowRight />
            </button>
          </div>

        ) : (
          <div className="offers-flow-card">

            {/* ===== Step 1: Follow ===== */}
            <div className={`offers-step ${hasFollowed ? 'completed' : ''}`}>
              <div className="offers-step-indicator">
                <div className={`offers-step-num ${hasFollowed ? 'done' : ''}`}>
                  {hasFollowed ? <FiCheck /> : '1'}
                </div>
                <div className="offers-step-line"></div>
              </div>
              <div className="offers-step-body">
                <h3 className="offers-step-title">Follow Us on Instagram</h3>
                <p className="offers-step-desc">Tap the button, follow our page, then come back here</p>
                <div className="offers-step-actions">
                  <button className={`offers-follow-btn ${hasFollowed ? 'followed' : ''}`} onClick={openInstagram}>
                    <FaInstagram className="offers-follow-btn-icon" />
                    {hasFollowed ? (
                      <span>Following @{instaHandle}</span>
                    ) : (
                      <span>Follow @{instaHandle}</span>
                    )}
                    {hasFollowed ? <FiCheckCircle /> : <FiExternalLink />}
                  </button>
                  {!hasFollowed && (
                    <button className="offers-already-btn" onClick={() => setHasFollowed(true)}>
                      I already follow
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ===== Step 2: Username ===== */}
            <div className={`offers-step ${instaUsername.trim() ? 'completed' : ''}`}>
              <div className="offers-step-indicator">
                <div className={`offers-step-num ${instaUsername.trim() ? 'done' : ''}`}>
                  {instaUsername.trim() ? <FiCheck /> : '2'}
                </div>
                <div className="offers-step-line"></div>
              </div>
              <div className="offers-step-body">
                <h3 className="offers-step-title">Your Instagram Username</h3>
                <div className="offers-username-wrap">
                  <span className="offers-at-sign">@</span>
                  <input
                    type="text"
                    placeholder="your_username"
                    value={instaUsername}
                    onChange={(e) => setInstaUsername(e.target.value.replace(/\s/g, ''))}
                    className="offers-username-input"
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                  {instaUsername.trim() && <FiCheck className="offers-input-check" />}
                </div>
              </div>
            </div>

            {/* ===== Step 3: Share ===== */}
            <div className={`offers-step ${shareCount >= requiredCount ? 'completed' : ''}`}>
              <div className="offers-step-indicator">
                <div className={`offers-step-num ${shareCount >= requiredCount ? 'done' : ''}`}>
                  {shareCount >= requiredCount ? <FiCheck /> : '3'}
                </div>
              </div>
              <div className="offers-step-body">
                <h3 className="offers-step-title">
                  <FiShare2 style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Share with Friends
                </h3>
                <p className="offers-step-desc">
                  Share our Instagram page with your friends using any of these options
                </p>

                {/* Share Buttons */}
                <div className="offers-share-grid">
                  <button
                    className={`offers-share-btn whatsapp ${hasSharedVia.whatsapp ? 'shared' : ''}`}
                    onClick={shareViaWhatsApp}
                  >
                    <FaWhatsapp className="offers-share-btn-icon" />
                    <div className="offers-share-btn-text">
                      <span className="offers-share-btn-label">
                        {hasSharedVia.whatsapp ? 'Shared!' : 'Share via WhatsApp'}
                      </span>
                      <span className="offers-share-btn-sub">Send to friends & groups</span>
                    </div>
                    {hasSharedVia.whatsapp && <FiCheckCircle className="offers-share-done" />}
                  </button>

                  <button
                    className={`offers-share-btn copylink ${hasSharedVia.copy ? 'shared' : ''}`}
                    onClick={shareViaCopyLink}
                  >
                    <FiCopy className="offers-share-btn-icon" />
                    <div className="offers-share-btn-text">
                      <span className="offers-share-btn-label">
                        {copiedLink ? 'Link Copied!' : hasSharedVia.copy ? 'Link Copied!' : 'Copy Share Link'}
                      </span>
                      <span className="offers-share-btn-sub">Paste anywhere you like</span>
                    </div>
                    {hasSharedVia.copy && <FiCheckCircle className="offers-share-done" />}
                  </button>

                  {typeof navigator.share === 'function' && (
                    <button
                      className={`offers-share-btn native ${hasSharedVia.native ? 'shared' : ''}`}
                      onClick={shareViaNative}
                    >
                      <FiShare2 className="offers-share-btn-icon" />
                      <div className="offers-share-btn-text">
                        <span className="offers-share-btn-label">
                          {hasSharedVia.native ? 'Shared!' : 'More Options'}
                        </span>
                        <span className="offers-share-btn-sub">Telegram, Messages, etc.</span>
                      </div>
                      {hasSharedVia.native && <FiCheckCircle className="offers-share-done" />}
                    </button>
                  )}
                </div>

                {/* Manual confirm for remaining */}
                {totalShareMethods > 0 && shareCount < requiredCount && (
                  <div className="offers-manual-confirm">
                    <p className="offers-manual-text">
                      <FiUsers style={{ marginRight: 6 }} />
                      Shared with more friends? Tap below for each friend
                    </p>
                    <button className="offers-manual-btn" onClick={confirmManualShare}>
                      + I shared with another friend
                    </button>
                  </div>
                )}

                {/* Progress */}
                <div className="offers-progress">
                  <div className="offers-progress-bar">
                    <div
                      className="offers-progress-fill"
                      style={{ width: Math.min(progressPercent, 100) + '%' }}
                    ></div>
                  </div>
                  <span className="offers-progress-label">
                    {shareCount >= requiredCount ? (
                      <><FiCheckCircle style={{ marginRight: 4 }} /> Done!</>
                    ) : (
                      shareCount + ' / ' + requiredCount + ' shared'
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Reward Preview */}
            {instaPromo && (
              <div className="offers-reward-preview">
                <FiGift className="offers-reward-icon" />
                <div className="offers-reward-text">
                  <span className="offers-reward-label">Your Reward</span>
                  <strong>{instaPromo.discount_type === 'percentage' ? instaPromo.discount_value + '% off' : '\u20B9' + instaPromo.discount_value + ' off'}</strong>
                  <span> your next booking</span>
                </div>
              </div>
            )}

            {/* Checklist summary */}
            <div className="offers-checklist">
              <div className={`offers-check-item ${hasFollowed ? 'done' : ''}`}>
                <span className="offers-check-icon">{hasFollowed ? <FiCheckCircle /> : <span className="offers-check-circle"></span>}</span>
                <span>Followed on Instagram</span>
              </div>
              <div className={`offers-check-item ${instaUsername.trim() ? 'done' : ''}`}>
                <span className="offers-check-icon">{instaUsername.trim() ? <FiCheckCircle /> : <span className="offers-check-circle"></span>}</span>
                <span>Username entered</span>
              </div>
              <div className={`offers-check-item ${shareCount >= requiredCount ? 'done' : ''}`}>
                <span className="offers-check-icon">{shareCount >= requiredCount ? <FiCheckCircle /> : <span className="offers-check-circle"></span>}</span>
                <span>Shared with {requiredCount} friends</span>
              </div>
            </div>

            <button
              className={`offers-claim-btn ${canClaim ? 'ready' : ''}`}
              onClick={handleClaimInstaPromo}
              disabled={claimLoading || !canClaim}
            >
              {claimLoading ? (
                <span className="offers-spinner"></span>
              ) : canClaim ? (
                <><FiGift /> Claim My Free Hour</>
              ) : (
                <><FiGift /> Complete All Steps to Claim</>
              )}
            </button>
          </div>
        )}

        {instaPromo?.terms_conditions && (
          <div className="offers-terms">
            <p><strong>Terms & Conditions:</strong> {instaPromo.terms_conditions}</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default GetOffersPage;
