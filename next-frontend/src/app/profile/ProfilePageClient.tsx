'use client';
// @ts-nocheck

import { useRouter } from 'next/navigation';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCamera,
  FiAward,
  FiGift,
  FiTrendingUp,
  FiInstagram,
  FiClock,
  FiMonitor,
  FiCheckCircle,
  FiStar,
  FiRefreshCw,
  FiX,
  FiFileText,
  FiDownload,
  FiChevronDown,
  FiChevronUp,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiCalendar
} from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, getAuthToken } from '@/services/apiClient';
import { getQuestPassStatus, getGames, requestQuestPassGameChange, cancelUserBooking } from '@/services/api';
import { formatTime12Hour } from '@/utils/helpers';
import '@/styles/ProfilePage.css';

const ProfilePage = () => {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [profileData, setProfileData] = useState(null);
  const [rewards, setRewards] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [membershipData, setMembershipData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Quest Pass state
  const [questPass, setQuestPass] = useState(null);
  const [allGames, setAllGames] = useState([]);
  const [showGameChangeModal, setShowGameChangeModal] = useState(false);
  const [newGameChoice, setNewGameChoice] = useState('');
  const [gameChangeSubmitting, setGameChangeSubmitting] = useState(false);

  // Purchase History state
  const [expandedBooking, setExpandedBooking] = useState(null);
  const [bookingFilter, setBookingFilter] = useState('all');
  const [bookingPage, setBookingPage] = useState(1);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const BOOKINGS_PER_PAGE = 5;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gamespotbooking-v1-production.up.railway.app';

  // Safe date formatter — never throws
  const formatDate = useCallback((dateStr, options = {}) => {
    try {
      if (!dateStr) return 'N/A';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('en-IN', options);
    } catch {
      return 'N/A';
    }
  }, []);

  // Check if a booking is cancellable (confirmed + more than 2 hours away)
  const isBookingCancellable = useCallback((booking) => {
    if ((booking.status || 'confirmed') !== 'confirmed') return false;
    try {
      const dateStr = booking.date;
      const timeStr = String(booking.time).substring(0, 5);
      const bookingDT = new Date(`${dateStr}T${timeStr}:00`);
      const now = new Date();
      const diffMs = bookingDT.getTime() - now.getTime();
      return diffMs >= 2 * 60 * 60 * 1000; // at least 2 hours away
    } catch {
      return false;
    }
  }, []);

  // Handle cancel booking
  const handleCancelBooking = useCallback(async (bookingId) => {
    setCancellingBookingId(bookingId);
    setError(null);
    try {
      const result = await cancelUserBooking(bookingId);
      if (result.success) {
        setBookings(prev => prev.map(b => 
          b.id === bookingId ? { ...b, status: 'cancelled' } : b
        ));
        setSuccess('Booking cancelled successfully');
        setConfirmCancelId(null);
        setExpandedBooking(null);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to cancel booking');
      setTimeout(() => setError(null), 5000);
    } finally {
      setCancellingBookingId(null);
    }
  }, []);

  // Handle change booking — cancels old one, redirects to booking page
  const handleChangeBooking = useCallback(async (booking) => {
    setCancellingBookingId(booking.id);
    setError(null);
    try {
      const result = await cancelUserBooking(booking.id);
      if (result.success) {
        // Redirect to booking page to make a new booking
        router.push('/booking');
      }
    } catch (err) {
      setError(err.message || 'Failed to cancel booking for rebooking');
      setTimeout(() => setError(null), 5000);
    } finally {
      setCancellingBookingId(null);
    }
  }, [router]);

  // Generate printable bill for a booking
  const generateBill = useCallback((booking) => {
    const billWindow = window.open('', '_blank', 'width=420,height=700');
    if (!billWindow) return;

    const deviceLines = (booking.devices || []).map(d => {
      const deviceName = d.type === 'ps5' ? `PS5 #${d.number}` : 'Driving Sim';
      return `<tr><td style="padding:6px 0;border-bottom:1px dashed #eee">${deviceName}</td><td style="padding:6px 0;border-bottom:1px dashed #eee;text-align:right">${d.players} player${d.players > 1 ? 's' : ''}</td></tr>`;
    }).join('');

    const dateStr = formatDate(booking.date, { day: 'numeric', month: 'long', year: 'numeric' });
    const bookingId = String(booking.id).padStart(5, '0');

    billWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>GameSpot Bill #${bookingId}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',system-ui,sans-serif;color:#1a1a1a;background:#fff;padding:24px;max-width:400px;margin:0 auto}
      .bill-header{text-align:center;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #ff6b35}
      .bill-logo{font-size:24px;font-weight:800;color:#ff6b35;margin-bottom:4px}
      .bill-subtitle{font-size:11px;color:#888;letter-spacing:1px;text-transform:uppercase}
      .bill-id{background:#f8f4f0;padding:8px 12px;border-radius:8px;font-size:12px;color:#666;margin:12px 0;text-align:center}
      .bill-section{margin-bottom:16px}
      .bill-section h4{font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px}
      .bill-row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px}
      .bill-row.total{font-size:16px;font-weight:700;color:#ff6b35;padding:12px 0;border-top:2px solid #1a1a1a;margin-top:8px}
      .bill-devices{width:100%;font-size:13px;border-collapse:collapse}
      .bill-footer{text-align:center;margin-top:24px;padding-top:16px;border-top:1px dashed #ddd;font-size:11px;color:#999}
      .bill-status{display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;text-transform:uppercase}
      .status-confirmed{background:#e8f5e9;color:#2e7d32}
      .status-completed{background:#e3f2fd;color:#1565c0}
      .status-cancelled{background:#fce4ec;color:#c62828}
      .points-earned{background:#fff3e0;color:#e65100;padding:8px 12px;border-radius:8px;font-size:12px;text-align:center;margin-top:12px}
      @media print{body{padding:12px}button{display:none!important}}
      .print-btn{display:block;width:100%;padding:10px;margin-top:20px;background:#ff6b35;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer}
    </style></head><body>
    <div class="bill-header">
      <div class="bill-logo">🎮 GameSpot</div>
      <div class="bill-subtitle">Gaming Lounge · Kodungallur</div>
    </div>
    <div class="bill-id">Invoice #GS-${bookingId} · <span class="bill-status status-${booking.status || 'confirmed'}">${booking.status || 'confirmed'}</span></div>
    <div class="bill-section">
      <h4>Booking Details</h4>
      <div class="bill-row"><span>Date</span><span>${dateStr}</span></div>
      <div class="bill-row"><span>Time</span><span>${formatTime12Hour(String(booking.time || '').substring(0, 5)) || 'N/A'}</span></div>
      <div class="bill-row"><span>Duration</span><span>${booking.duration || 0} minutes</span></div>
      ${booking.booked_as ? `<div class="bill-row"><span>Customer</span><span>${booking.booked_as}</span></div>` : ''}
    </div>
    <div class="bill-section">
      <h4>Devices</h4>
      <table class="bill-devices">${deviceLines || '<tr><td>No device info</td></tr>'}</table>
    </div>
    <div class="bill-section">
      <div class="bill-row total"><span>Total Amount</span><span>₹${(booking.price || 0).toFixed(2)}</span></div>
    </div>
    ${booking.points_earned > 0 ? `<div class="points-earned">⭐ ${booking.points_earned} SuperCoins earned from this booking</div>` : ''}
    <div class="bill-footer">
      <p>Thank you for gaming with us!</p>
      <p style="margin-top:4px">gamespotkdlr.com · Kodungallur, Thrissur</p>
    </div>
    <button class="print-btn" onclick="window.print()">🖨️ Print Bill</button>
    </body></html>`);
    billWindow.document.close();
  }, [formatDate]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch profile data using centralized apiFetch (handles JWT refresh + session cookies)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await apiFetch('/api/user/profile');
        
        if (data.success) {
          setProfileData(data.profile);
          setRewards(data.rewards);
          setBookings(data.bookings || []);
        } else {
          setError(data.error || 'Failed to load profile.');
        }
        
        // Fetch membership status
        try {
          const memData = await apiFetch('/api/membership/status');
          if (memData.success && memData.has_membership) {
            setMembershipData(memData.membership);
          }
        } catch (memErr) {
          console.log('No active membership');
        }

        // Fetch Quest Pass status
        try {
          const questData = await getQuestPassStatus();
          if (questData.success && (questData.has_active || questData.has_pending)) {
            setQuestPass(questData);
          }
        } catch (qErr) {
          console.log('No quest pass data');
        }

        // Fetch games list (for game change dropdown)
        try {
          const gamesData = await getGames();
          if (gamesData.success) {
            setAllGames(gamesData.games || []);
          }
        } catch (gErr) {
          console.log('Could not load games');
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError('Unable to load profile. Please try logging in again.');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && !authLoading) {
      fetchProfile();
    }
  }, [isAuthenticated, authLoading]);

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      setError(null);

      const formData = new FormData();
      formData.append('profile_picture', file);

      // For file uploads, use raw fetch with auth token (apiFetch auto-sets JSON content type)
      const uploadHeaders = {};
      const token = getAuthToken();
      if (token) uploadHeaders['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/api/user/profile-picture`, {
        method: 'POST',
        credentials: 'include',
        headers: uploadHeaders,
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setProfileData({ ...profileData, profile_picture: data.profile_picture });
        setSuccess('Profile picture updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleInstagramShare = async () => {
    try {
      setError(null);
      const data = await apiFetch('/api/rewards/instagram-share', {
        method: 'POST'
      });

      if (data.success) {
        setRewards(data.rewards);
        setSuccess(data.message);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error);
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      console.error('Instagram share error:', err);
      setError('Failed to track share');
    }
  };

  const handleRedeemReward = async (rewardType) => {
    try {
      setError(null);
      const data = await apiFetch('/api/rewards/redeem', {
        method: 'POST',
        body: JSON.stringify({ reward_type: rewardType })
      });

      if (data.success) {
        setRewards(data.rewards);
        setSuccess(data.message);
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.error);
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      console.error('Redeem error:', err);
      setError('Failed to redeem reward');
    }
  };

  // Game Change Request Handler
  const handleGameChangeRequest = async () => {
    if (!newGameChoice.trim()) {
      setError('Please select a game');
      return;
    }
    try {
      setGameChangeSubmitting(true);
      setError(null);
      const response = await requestQuestPassGameChange(newGameChoice);
      if (response.success) {
        setShowGameChangeModal(false);
        setNewGameChoice('');
        setSuccess(response.message);
        setTimeout(() => setSuccess(null), 5000);
        // Refresh quest pass status
        const questData = await getQuestPassStatus();
        if (questData.success) {
          setQuestPass(questData);
        }
      } else {
        setError(response.error || 'Game change request failed');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      setError(err.message || 'Game change request failed');
      setTimeout(() => setError(null), 5000);
    } finally {
      setGameChangeSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <>
<div className="profile-page-new">
          <div className="profile-loading">
            <div className="spinner"></div>
            <p>Loading your profile...</p>
          </div>
        </div>
      </>
    );
  }

  if (error && !profileData) {
    return (
      <>
<div className="profile-page-new">
          <div className="profile-error">
            <h2>⚠️ Profile Not Available</h2>
            <p>{error}</p>
            <button className="btn-primary" onClick={() => router.push('/')}>Go Home</button>
          </div>
        </div>
      </>
    );
  }

  // Guard against null profileData (race condition between auth check and profile fetch)
  if (!profileData) {
    return (
      <>
<div className="profile-page-new">
          <div className="profile-loading">
            <div className="spinner"></div>
            <p>Loading your profile...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
<div className="profile-page-new">
        <div className="profile-container-new">
          
          {/* Alert Messages */}
          {error && (
            <div className="alert alert-error">
              <span>⚠️ {error}</span>
            </div>
          )}
          
          {success && (
            <div className="alert alert-success">
              <FiCheckCircle /> {success}
            </div>
          )}

          <div className="profile-grid">
            
            {/* Left Sidebar - Profile Info */}
            <div className="profile-sidebar">
              
              {/* Profile Picture Card */}
              <div className="profile-card profile-pic-card">
                <div className="profile-picture-wrapper">
                  <div className="profile-picture-large">
                    {profileData?.profile_picture ? (
                      <img 
                        src={`${API_URL}/${profileData.profile_picture}`} 
                        alt="Profile" 
                      />
                    ) : (
                      <div className="profile-avatar-large">
                        {profileData?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <label className="camera-overlay" htmlFor="profile-upload">
                      {uploadingImage ? (
                        <div className="spinner-small"></div>
                      ) : (
                        <FiCamera size={24} />
                      )}
                    </label>
                    <input
                      type="file"
                      id="profile-upload"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
                <div className="profile-info-text">
                  <h2>{profileData?.name}</h2>
                  <p className="profile-member-since">
                    Member since {formatDate(profileData?.created_at, { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Contact Details Card */}
              <div className="profile-card">
                <h3 className="card-title">
                  <FiUser /> Personal Information
                </h3>
                <div className="detail-item">
                  <FiMail className="detail-icon" />
                  <div className="detail-content">
                    <span className="detail-label">Email Address</span>
                    <span className="detail-value">{profileData?.email}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <FiPhone className="detail-icon" />
                  <div className="detail-content">
                    <span className="detail-label">Phone Number</span>
                    <span className="detail-value">{profileData?.phone || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {/* Membership Card */}
              {membershipData && (
                <div className="profile-card membership-status-card">
                  <div className="membership-deco-circle" />
                  <div className="membership-header-row">
                    <div>
                      <p className="membership-category-label">
                        {membershipData.category === 'story' ? '🎮 Story Pass' : '🏎️ Driving Pass'}
                      </p>
                      <h3 className="membership-plan-name">
                        {membershipData.plan_type?.replace(/_/g, ' ')}
                      </h3>
                    </div>
                    <span className={`membership-status-badge ${membershipData.status === 'active' ? 'membership-active' : 'membership-inactive'}`}>
                      {membershipData.status}
                    </span>
                  </div>
                  
                  {/* Rate per hour */}
                  {membershipData.rate_per_hour && (
                    <div className="membership-rate">
                      <span className="membership-rate-value">
                        ₹{membershipData.rate_per_hour}
                      </span>
                      <span className="membership-rate-unit">/hour</span>
                    </div>
                  )}

                  {/* Hours Progress */}
                  <div className="membership-progress-section">
                    <div className="membership-progress-labels">
                      <span>Hours Used</span>
                      <span>
                        {parseFloat(membershipData.hours_used || 0).toFixed(1)} / {parseFloat(membershipData.total_hours || 0).toFixed(0)}h
                      </span>
                    </div>
                    <div className="membership-progress-track">
                      <div className="membership-progress-fill" style={{
                        width: `${parseFloat(membershipData.total_hours || 0) > 0 ? Math.min(100, (parseFloat(membershipData.hours_used || 0) / parseFloat(membershipData.total_hours || 1)) * 100) : 0}%`
                      }} />
                    </div>
                    <p className="membership-remaining-text">
                      {parseFloat(membershipData.hours_remaining || 0).toFixed(1)}h remaining
                    </p>
                  </div>

                  {/* Days remaining */}
                  <div className="membership-days-row">
                    <span><FiClock style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Days Remaining</span>
                    <span className="membership-days-value">
                      {membershipData.days_remaining || 0} days
                    </span>
                  </div>
                </div>
              )}

              {/* Quest Pass Card */}
              {questPass?.has_active && (
                <div className="profile-card quest-pass-card">
                  {/* Decorative circle */}
                  <div className="quest-deco-circle" />

                  {/* Header */}
                  <div className="quest-header-row">
                    <div>
                      <p className="quest-category-label">
                        🏆 Quest Pass
                      </p>
                      <h3 className="quest-plan-name">
                        Dedicated Console
                      </h3>
                    </div>
                    <span className="quest-status-badge quest-badge-active">
                      Active
                    </span>
                  </div>

                  {/* Current Game */}
                  <div className="quest-current-game">
                    <p className="quest-game-label">
                      Current Game
                    </p>
                    <p className="quest-game-name">
                      🎮 {questPass.active_pass?.game_name || 'Not set'}
                    </p>
                    <p className="quest-game-details">
                      PS5-{questPass.active_pass?.device_number} • ₹{questPass.active_pass?.play_rate || 50}/hr
                    </p>
                  </div>

                  {/* Game Change Pending Notice */}
                  {questPass.active_pass?.game_change_requested && (
                    <div className="quest-change-pending">
                      <span className="quest-pending-icon">⏳</span>
                      <div>
                        <p className="quest-pending-title">
                          Game Change Pending
                        </p>
                        <p className="quest-pending-detail">
                          Requested: <strong>{questPass.active_pass.game_change_requested}</strong>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Days Remaining */}
                  <div className="quest-days-row">
                    <span><FiClock style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Days Remaining</span>
                    <span className="quest-days-value">
                      {questPass.active_pass?.days_remaining || 0} days
                    </span>
                  </div>

                  {/* Change Game Button */}
                  {!questPass.active_pass?.game_change_requested && (
                    <button
                      className="quest-change-game-btn"
                      onClick={() => setShowGameChangeModal(true)}
                    >
                      <FiRefreshCw size={16} /> Change Game
                    </button>
                  )}
                </div>
              )}

              {/* Quest Pass Pending */}
              {questPass?.has_pending && !questPass?.has_active && (
                <div className="profile-card quest-pass-card quest-pass-pending">
                  <div className="quest-pending-header">
                    <span className="quest-pending-emoji">🏆</span>
                    <div>
                      <h3 className="quest-pending-heading">Quest Pass</h3>
                      <p className="quest-pending-subtext">Awaiting Admin Approval</p>
                    </div>
                  </div>
                  <div className="quest-pending-notice">
                    ⏳ Request pending for "<strong>{questPass.pending_pass?.game_name}</strong>"
                  </div>
                </div>
              )}

              {/* Game Change Modal */}
              {showGameChangeModal && (
                <div className="quest-game-change-overlay" onClick={() => setShowGameChangeModal(false)}>
                  <div className="quest-game-change-modal" onClick={e => e.stopPropagation()}>
                    <div className="quest-modal-header">
                      <div>
                        <h3>🎮 Change Your Game</h3>
                        <p>Select a new game for your Quest Pass console</p>
                      </div>
                      <button className="quest-modal-close" onClick={() => setShowGameChangeModal(false)}>
                        <FiX size={20} />
                      </button>
                    </div>

                    <div className="quest-modal-current">
                      <span className="quest-modal-label">Current Game</span>
                      <span className="quest-modal-game">{questPass?.active_pass?.game_name}</span>
                    </div>

                    <div className="quest-modal-select-group">
                      <label className="quest-modal-label">New Game</label>
                      <select
                        className="quest-modal-select"
                        value={newGameChoice}
                        onChange={(e) => setNewGameChoice(e.target.value)}
                      >
                        <option value="">Select a game...</option>
                        {allGames
                          .filter(g => (g.ps5_numbers || []).some(n => [1, 2, 3].includes(n)))
                          .filter(g => g.name !== questPass?.active_pass?.game_name)
                          .map(g => (
                            <option key={g.id} value={g.name}>{g.name}</option>
                          ))
                        }
                      </select>
                    </div>

                    <div className="quest-modal-note">
                      <FiRefreshCw size={14} />
                      <span>Your request will be sent to admin. They'll update your console with the new game.</span>
                    </div>

                    <button
                      className="quest-modal-submit"
                      onClick={handleGameChangeRequest}
                      disabled={gameChangeSubmitting || !newGameChoice}
                    >
                      {gameChangeSubmitting ? '⏳ Submitting...' : '✓ Request Game Change'}
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Right Content - Rewards */}
            <div className="profile-content">
              
              {/* GameSpot Points Card - Flipkart Style */}
              <div className="profile-card points-card-flipkart">
                <div className="points-header-flipkart">
                  <div className="points-icon-wrapper">
                    <FiStar className="points-star-icon" />
                  </div>
                  <div className="points-info">
                    <h3>GameSpot SuperCoins</h3>
                    <p className="points-subtitle">Earn 50% of your booking amount as points</p>
                  </div>
                </div>
                
                <div className="points-balance-flipkart">
                  <div className="points-circle-flipkart">
                    <div className="points-number">{rewards?.gamespot_points || 0}</div>
                    <div className="points-label">Points</div>
                  </div>
                  <div className="points-value-info">
                    <div className="points-worth">
                      <span className="rupee-symbol">₹</span>{rewards?.gamespot_points || 0}
                    </div>
                    <span className="points-worth-label">Worth in rewards</span>
                  </div>
                </div>

                <div className="points-info-box">
                  <FiTrendingUp className="info-icon" />
                  <div className="info-text">
                    <p><strong>How to earn points:</strong></p>
                    <ul>
                      <li>Book games & earn 50% as points (e.g., ₹100 booking = 50 points)</li>
                      <li>Share on Instagram & get 30 minutes FREE!</li>
                      <li>Redeem points for exclusive rewards</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Instagram Share Reward */}
              <div className="profile-card instagram-card">
                <div className="card-header-flex">
                  <div>
                    <h3 className="card-title">
                      <FiInstagram /> Instagram Share Reward
                    </h3>
                    <p className="card-subtitle">Share to 5 friends & get 30 minutes FREE playtime!</p>
                  </div>
                  <button 
                    className="btn-instagram"
                    onClick={handleInstagramShare}
                    disabled={rewards?.instagram_shares >= 5}
                  >
                    <FiInstagram /> Track Share
                  </button>
                </div>
                
                <div className="share-progress">
                  <div className="progress-stats">
                    <span className="progress-count">{rewards?.instagram_shares || 0}/5 Shares</span>
                    {rewards?.instagram_shares >= 5 && (
                      <span className="progress-complete">
                        <FiCheckCircle /> Complete!
                      </span>
                    )}
                  </div>
                  <div className="progress-bar-track">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${((rewards?.instagram_shares || 0) / 5) * 100}%` }}
                    />
                  </div>
                </div>

                {rewards?.instagram_shares >= 5 && (
                  <button 
                    className="btn-claim-reward"
                    onClick={() => handleRedeemReward('instagram_free_time')}
                  >
                    <FiGift /> Claim 30 Minutes Free Playtime
                  </button>
                )}
              </div>

              {/* Rewards Redemption */}
              <div className="profile-card">
                <h3 className="card-title">
                  <FiGift /> Redeem Your Points
                </h3>
                
                <div className="redemption-grid">
                  
                  {/* PS5 Extra Hour */}
                  <div className="redemption-card-new">
                    <div className="redemption-header">
                      <FiMonitor className="redemption-icon-new" />
                      <span className="redemption-badge">Popular</span>
                    </div>
                    <h4>1 Hour Extra PS5 Time</h4>
                    <p className="redemption-desc">Valid on bookings above ₹300</p>
                    <div className="redemption-points">
                      <FiAward className="points-icon-small" />
                      <span className="points-cost">500 Points</span>
                    </div>
                    {rewards?.gamespot_points >= 500 ? (
                      <button 
                        className="btn-redeem"
                        onClick={() => handleRedeemReward('ps5_extra_hour')}
                      >
                        Redeem Now
                      </button>
                    ) : (
                      <button className="btn-redeem-disabled" disabled>
                        Need {500 - (rewards?.gamespot_points || 0)} more points
                      </button>
                    )}
                  </div>

                  {/* VR Free Day */}
                  <div className="redemption-card-new premium-card">
                    <div className="redemption-header">
                      <FiMonitor className="redemption-icon-new" />
                      <span className="redemption-badge premium-badge">Premium</span>
                    </div>
                    <h4>1 Day VR Rental FREE</h4>
                    <p className="redemption-desc">Take home for 24 hours</p>
                    <div className="redemption-points">
                      <FiAward className="points-icon-small" />
                      <span className="points-cost">3000 Points</span>
                    </div>
                    {rewards?.gamespot_points >= 3000 ? (
                      <button 
                        className="btn-redeem premium-btn"
                        onClick={() => handleRedeemReward('vr_free_day')}
                      >
                        Redeem Now
                      </button>
                    ) : (
                      <button className="btn-redeem-disabled" disabled>
                        Need {3000 - (rewards?.gamespot_points || 0)} more points
                      </button>
                    )}
                  </div>

                </div>
              </div>

              {/* Booking History */}
              <div className="profile-card booking-history-card">
                <div className="booking-history-header">
                  <h3 className="card-title">
                    <FiCalendar /> Booking History
                  </h3>
                  {bookings.length > 0 && (
                    <span className="booking-count-badge">{bookings.length} total</span>
                  )}
                </div>

                {/* Filter Tabs */}
                {bookings.length > 0 && (
                  <div className="booking-filter-bar">
                    {[
                      { key: 'all', label: 'All', icon: null },
                      { key: 'completed', label: 'Completed', icon: <FiCheckCircle size={13} /> },
                      { key: 'confirmed', label: 'Upcoming', icon: <FiClock size={13} /> },
                      { key: 'cancelled', label: 'Cancelled', icon: <FiX size={13} /> },
                    ].map((tab) => {
                      const count = tab.key === 'all' ? bookings.length : bookings.filter(b => (b.status || 'confirmed') === tab.key).length;
                      return (
                        <button
                          key={tab.key}
                          className={`booking-filter-tab ${bookingFilter === tab.key ? 'active' : ''}`}
                          onClick={() => { setBookingFilter(tab.key); setBookingPage(1); setExpandedBooking(null); }}
                        >
                          {tab.icon} {tab.label}
                          <span className="filter-count">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {bookings.length === 0 ? (
                  <div className="no-bookings">
                    <div className="no-bookings-icon">🎮</div>
                    <p>No bookings yet</p>
                    <span className="no-bookings-sub">Start gaming to earn SuperCoins!</span>
                    <button className="btn-primary" onClick={() => router.push('/booking')}>
                      Book Now
                    </button>
                  </div>
                ) : (() => {
                  const filtered = bookingFilter === 'all'
                    ? bookings
                    : bookings.filter(b => (b.status || 'confirmed') === bookingFilter);
                  const totalPages = Math.ceil(filtered.length / BOOKINGS_PER_PAGE);
                  const paginated = filtered.slice((bookingPage - 1) * BOOKINGS_PER_PAGE, bookingPage * BOOKINGS_PER_PAGE);

                  if (filtered.length === 0) {
                    return (
                      <div className="no-bookings">
                        <p>No {bookingFilter} bookings found</p>
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="bookings-list">
                        {paginated.map((booking, idx) => {
                          const status = booking.status || 'confirmed';
                          const isExpanded = expandedBooking === booking.id;
                          const statusEmoji = status === 'completed' ? '✅' : status === 'confirmed' ? '🕐' : '❌';
                          const totalPlayers = booking.devices?.reduce((sum, d) => sum + (d.players || 1), 0) || 0;

                          return (
                            <div
                              key={booking.id}
                              className={`bh-card bh-status-${status} ${isExpanded ? 'bh-expanded' : ''}`}
                              style={{ animationDelay: `${idx * 0.05}s` }}
                            >
                              {/* Top row — always visible */}
                              <div className="bh-card-top" onClick={() => setExpandedBooking(isExpanded ? null : booking.id)}>
                                <div className="bh-left">
                                  <div className="bh-date-badge">
                                    <span className="bh-day">{formatDate(booking.date, { day: 'numeric' })}</span>
                                    <span className="bh-month">{formatDate(booking.date, { month: 'short' })}</span>
                                  </div>
                                  <div className="bh-info">
                                    <div className="bh-time-row">
                                      <span className="bh-time">{formatTime12Hour(String(booking.time).substring(0, 5))}</span>
                                      <span className="bh-dot">•</span>
                                      <span className="bh-duration">{booking.duration} mins</span>
                                    </div>
                                    <div className="bh-devices-mini">
                                      {booking.devices?.map((d, i) => (
                                        <span key={i} className="bh-device-chip">
                                          {d.type === 'ps5' ? `🎮 PS5 #${d.number}` : '🏎️ Sim'}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <div className="bh-right">
                                  <div className="bh-price">₹{(booking.price || 0).toFixed(0)}</div>
                                  <div className={`bh-status-pill bh-pill-${status}`}>
                                    {statusEmoji} {status}
                                  </div>
                                  <div className="bh-chevron">
                                    {isExpanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                                  </div>
                                </div>
                              </div>

                              {/* Expanded details */}
                              {isExpanded && (
                                <div className="bh-details">
                                  <div className="bh-detail-grid">
                                    <div className="bh-detail-item">
                                      <span className="bh-detail-label">Booking ID</span>
                                      <span className="bh-detail-value">#GS-{booking.id}</span>
                                    </div>
                                    <div className="bh-detail-item">
                                      <span className="bh-detail-label">Date</span>
                                      <span className="bh-detail-value">{formatDate(booking.date, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                    </div>
                                    <div className="bh-detail-item">
                                      <span className="bh-detail-label">Duration</span>
                                      <span className="bh-detail-value">{booking.duration} minutes</span>
                                    </div>
                                    <div className="bh-detail-item">
                                      <span className="bh-detail-label">Players</span>
                                      <span className="bh-detail-value">{totalPlayers} {totalPlayers === 1 ? 'player' : 'players'}</span>
                                    </div>
                                    {booking.booked_as && profileData?.name && booking.booked_as !== profileData.name && (
                                      <div className="bh-detail-item">
                                        <span className="bh-detail-label">Booked As</span>
                                        <span className="bh-detail-value">{booking.booked_as}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Devices */}
                                  <div className="bh-device-list">
                                    {booking.devices?.map((device, idx) => (
                                      <div key={idx} className="bh-device-row">
                                        <FiMonitor size={14} />
                                        <span>{device.type === 'ps5' ? `PlayStation 5 #${device.number}` : 'Driving Simulator'}</span>
                                        <span className="bh-players-tag">{device.players} {device.players > 1 ? 'players' : 'player'}</span>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Footer — price + points + actions */}
                                  <div className="bh-footer">
                                    <div className="bh-footer-left">
                                      <div className="bh-total">
                                        <span className="bh-total-label">Total Paid</span>
                                        <span className="bh-total-amount">₹{(booking.price || 0).toFixed(2)}</span>
                                      </div>
                                      {booking.points_earned > 0 && (
                                        <div className="bh-points-badge">
                                          <FiStar size={13} /> +{booking.points_earned} SuperCoins
                                        </div>
                                      )}
                                    </div>
                                    <div className="bh-footer-actions">
                                      <button
                                        className="bh-bill-btn"
                                        onClick={(e) => { e.stopPropagation(); generateBill(booking); }}
                                      >
                                        <FiFileText size={14} /> View Bill
                                      </button>
                                      {isBookingCancellable(booking) && (
                                        <>
                                          {confirmCancelId === booking.id ? (
                                            <div className="bh-cancel-confirm">
                                              <span className="bh-cancel-text">Cancel this booking?</span>
                                              <button
                                                className="bh-cancel-yes"
                                                disabled={cancellingBookingId === booking.id}
                                                onClick={(e) => { e.stopPropagation(); handleCancelBooking(booking.id); }}
                                              >
                                                {cancellingBookingId === booking.id ? '...' : 'Yes'}
                                              </button>
                                              <button
                                                className="bh-cancel-no"
                                                onClick={(e) => { e.stopPropagation(); setConfirmCancelId(null); }}
                                              >
                                                No
                                              </button>
                                            </div>
                                          ) : (
                                            <>
                                              <button
                                                className="bh-change-btn"
                                                onClick={(e) => { e.stopPropagation(); handleChangeBooking(booking); }}
                                                disabled={cancellingBookingId === booking.id}
                                              >
                                                <FiRefreshCw size={14} /> Change
                                              </button>
                                              <button
                                                className="bh-cancel-btn"
                                                onClick={(e) => { e.stopPropagation(); setConfirmCancelId(booking.id); }}
                                                disabled={cancellingBookingId === booking.id}
                                              >
                                                <FiX size={14} /> Cancel
                                              </button>
                                            </>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="bh-pagination">
                          <button
                            className="bh-page-btn"
                            disabled={bookingPage <= 1}
                            onClick={() => { setBookingPage(p => p - 1); setExpandedBooking(null); }}
                          >
                            <FiChevronLeft size={16} />
                          </button>
                          <div className="bh-page-numbers">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                              <button
                                key={num}
                                className={`bh-page-num ${bookingPage === num ? 'active' : ''}`}
                                onClick={() => { setBookingPage(num); setExpandedBooking(null); }}
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                          <button
                            className="bh-page-btn"
                            disabled={bookingPage >= totalPages}
                            onClick={() => { setBookingPage(p => p + 1); setExpandedBooking(null); }}
                          >
                            <FiChevronRight size={16} />
                          </button>
                          <span className="bh-page-info">
                            {(bookingPage - 1) * BOOKINGS_PER_PAGE + 1}–{Math.min(bookingPage * BOOKINGS_PER_PAGE, filtered.length)} of {filtered.length}
                          </span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
