import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FiStar
} from 'react-icons/fi';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { apiFetch, getAuthToken } from '../services/apiClient';
import '../styles/ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [profileData, setProfileData] = useState(null);
  const [rewards, setRewards] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [membershipData, setMembershipData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'https://gamespotbooking-v1-production.up.railway.app';

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

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

  if (authLoading || loading) {
    return (
      <>
        <Navbar variant="light" />
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
        <Navbar variant="light" />
        <div className="profile-page-new">
          <div className="profile-error">
            <h2>⚠️ Profile Not Available</h2>
            <p>{error}</p>
            <button className="btn-primary" onClick={() => navigate('/')}>Go Home</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar variant="light" />
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
                    Member since {new Date(profileData?.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
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
                <div className="profile-card membership-status-card" style={{
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                  color: '#fff',
                  borderRadius: '16px',
                  padding: '24px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: 'rgba(255, 165, 0, 0.15)',
                    pointerEvents: 'none'
                  }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {membershipData.category === 'story' ? '🎮 Story Pass' : '🏎️ Driving Pass'}
                      </p>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0, textTransform: 'capitalize' }}>
                        {membershipData.plan_type?.replace(/_/g, ' ')}
                      </h3>
                    </div>
                    <span style={{
                      background: membershipData.status === 'active' ? '#00c853' : '#ff9800',
                      color: '#fff',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {membershipData.status}
                    </span>
                  </div>
                  
                  {/* Rate per hour */}
                  {membershipData.rate_per_hour && (
                    <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ffa500' }}>
                        ₹{membershipData.rate_per_hour}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#aaa' }}>/hour</span>
                    </div>
                  )}

                  {/* Hours Progress */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#ccc', marginBottom: '6px' }}>
                      <span>Hours Used</span>
                      <span>
                        {(membershipData.hours_used || 0).toFixed(1)} / {(membershipData.total_hours || 0).toFixed(0)}h
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      borderRadius: '4px',
                      background: 'rgba(255,255,255,0.15)',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${membershipData.total_hours > 0 ? Math.min(100, (membershipData.hours_used / membershipData.total_hours) * 100) : 0}%`,
                        height: '100%',
                        borderRadius: '4px',
                        background: 'linear-gradient(90deg, #ffa500, #ff6b35)',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '4px' }}>
                      {(membershipData.hours_remaining || 0).toFixed(1)}h remaining
                    </p>
                  </div>

                  {/* Days remaining */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#ccc' }}>
                    <span><FiClock style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Days Remaining</span>
                    <span style={{ fontWeight: '600', color: '#fff' }}>
                      {membershipData.days_remaining || 0} days
                    </span>
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
              <div className="profile-card">
                <h3 className="card-title">
                  <FiClock /> My Booking History
                </h3>
                
                {bookings.length === 0 ? (
                  <div className="no-bookings">
                    <p>No bookings yet. Start gaming to earn points!</p>
                    <button className="btn-primary" onClick={() => navigate('/booking')}>
                      Book Now
                    </button>
                  </div>
                ) : (
                  <div className="bookings-list">
                    {bookings.map((booking) => (
                      <div key={booking.id} className={`booking-item status-${booking.status || 'confirmed'}`}>
                        <div className="booking-header-row">
                          <div className="booking-date-time">
                            <FiClock className="booking-icon" />
                            <div>
                              <div className="booking-date">{new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                              <div className="booking-time">{booking.time} • {booking.duration} mins</div>
                            </div>
                          </div>
                          <div className="booking-status-badge">
                            {(booking.status || 'confirmed') === 'completed' && <FiCheckCircle />}
                            {booking.status || 'confirmed'}
                          </div>
                        </div>

                        {/* Show booked-as name if different from profile name */}
                        {booking.booked_as && profileData?.name && booking.booked_as !== profileData.name && (
                          <div className="booking-booked-as">
                            <FiUser className="booked-as-icon" />
                            <span>Booked as: <strong>{booking.booked_as}</strong></span>
                          </div>
                        )}
                        
                        <div className="booking-devices">
                          {booking.devices && booking.devices.map((device, idx) => (
                            <span key={idx} className="device-tag">
                              <FiMonitor /> {device.type === 'ps5' ? `PS5 #${device.number}` : 'Driving Sim'} ({device.players} {device.players > 1 ? 'players' : 'player'})
                            </span>
                          ))}
                        </div>
                        
                        <div className="booking-footer-row">
                          <div className="booking-price">₹{(booking.price || 0).toFixed(2)}</div>
                          {booking.points_earned > 0 && (
                            <div className="booking-points-earned">
                              <FiStar className="points-star-small" /> +{booking.points_earned} points earned
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
