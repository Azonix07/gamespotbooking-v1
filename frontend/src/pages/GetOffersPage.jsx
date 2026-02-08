import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiGift, FiClock, FiCheck, FiCopy, FiArrowRight, FiExternalLink } from 'react-icons/fi';
import { FaInstagram } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/GetOffersPage.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://gamespotbooking-v1-production.up.railway.app';

function GetOffersPage() {
  const navigate = useNavigate();

  const [instaPromo, setInstaPromo] = useState(null);
  const [instaLoading, setInstaLoading] = useState(false);
  const [instaUsername, setInstaUsername] = useState('');
  const [sharedFriends, setSharedFriends] = useState(['', '', '', '', '']);
  const [claimResult, setClaimResult] = useState(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

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
    if (!instaUsername.trim()) {
      alert('Please enter your Instagram username');
      return;
    }
    const filledFriends = sharedFriends.filter(f => f.trim());
    const requiredCount = instaPromo?.required_friends_count || 5;
    if (filledFriends.length < requiredCount) {
      alert('Please share with at least ' + requiredCount + ' friends');
      return;
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
          shared_with_friends: filledFriends,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setClaimResult(data.redemption);
      } else {
        alert(data.error || 'Failed to claim promotion. Please login first.');
      }
    } catch (err) {
      alert('Failed to claim. Please login and try again.');
    } finally {
      setClaimLoading(false);
    }
  };

  const updateFriend = (index, value) => {
    const updated = [...sharedFriends];
    updated[index] = value;
    setSharedFriends(updated);
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
    });
  };

  const openInstagram = () => {
    const handle = instaPromo?.instagram_handle || 'gamespot_kdlr';
    window.open('https://instagram.com/' + handle, '_blank', 'noopener');
  };

  const friendsCount = sharedFriends.filter(f => f.trim()).length;
  const requiredCount = instaPromo?.required_friends_count || 5;
  const progressPercent = (friendsCount / requiredCount) * 100;
  const canClaim = friendsCount >= requiredCount && instaUsername.trim();

  return (
    <div className="offers-page">
      <Navbar />

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
            Follow us on Instagram, share with friends, and unlock a free gaming hour at GameSpot!
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

            {/* Step 1 */}
            <div className="offers-step">
              <div className="offers-step-indicator">
                <div className="offers-step-num">1</div>
                <div className="offers-step-line"></div>
              </div>
              <div className="offers-step-body">
                <h3 className="offers-step-title">Follow Us on Instagram</h3>
                <p className="offers-step-desc">Tap below to follow our page and stay updated with gaming news</p>
                <button className="offers-follow-btn" onClick={openInstagram}>
                  <FaInstagram className="offers-follow-btn-icon" />
                  <span>Follow @{instaPromo?.instagram_handle || 'gamespot_kdlr'}</span>
                  <FiExternalLink />
                </button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="offers-step">
              <div className="offers-step-indicator">
                <div className={`offers-step-num ${instaUsername.trim() ? 'done' : ''}`}>
                  {instaUsername.trim() ? <FiCheck /> : '2'}
                </div>
                <div className="offers-step-line"></div>
              </div>
              <div className="offers-step-body">
                <h3 className="offers-step-title">Enter Your Instagram Username</h3>
                <div className="offers-username-wrap">
                  <span className="offers-at-sign">@</span>
                  <input
                    type="text"
                    placeholder="your_username"
                    value={instaUsername}
                    onChange={(e) => setInstaUsername(e.target.value)}
                    className="offers-username-input"
                  />
                  {instaUsername.trim() && <FiCheck className="offers-input-check" />}
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="offers-step">
              <div className="offers-step-indicator">
                <div className={`offers-step-num ${friendsCount >= requiredCount ? 'done' : ''}`}>
                  {friendsCount >= requiredCount ? <FiCheck /> : '3'}
                </div>
              </div>
              <div className="offers-step-body">
                <h3 className="offers-step-title">Share with {requiredCount} Friends</h3>
                <p className="offers-step-desc">Enter the Instagram usernames of friends you shared our page with</p>

                <div className="offers-friends-list">
                  {sharedFriends.map((friend, index) => (
                    <div key={index} className={`offers-friend-row ${friend.trim() ? 'filled' : ''}`}>
                      <span className="offers-friend-num">{index + 1}</span>
                      <input
                        type="text"
                        placeholder={'Friend ' + (index + 1) + "'s username"}
                        value={friend}
                        onChange={(e) => updateFriend(index, e.target.value)}
                        className="offers-friend-input"
                      />
                      {friend.trim() && <FiCheck className="offers-friend-check" />}
                    </div>
                  ))}
                </div>

                <div className="offers-progress">
                  <div className="offers-progress-bar">
                    <div
                      className="offers-progress-fill"
                      style={{ width: Math.min(progressPercent, 100) + '%' }}
                    ></div>
                  </div>
                  <span className="offers-progress-label">
                    {friendsCount} / {requiredCount} friends
                  </span>
                </div>
              </div>
            </div>

            {instaPromo && (
              <div className="offers-reward-preview">
                <FiGift className="offers-reward-icon" />
                <span>
                  Reward: <strong>{instaPromo.discount_type === 'percentage' ? instaPromo.discount_value + '% off' : '\u20B9' + instaPromo.discount_value + ' off'}</strong> your next booking
                </span>
              </div>
            )}

            <button
              className={`offers-claim-btn ${canClaim ? 'ready' : ''}`}
              onClick={handleClaimInstaPromo}
              disabled={claimLoading || !canClaim}
            >
              {claimLoading ? (
                <span className="offers-spinner"></span>
              ) : (
                <><FiGift /> Claim My Free Hour</>
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
