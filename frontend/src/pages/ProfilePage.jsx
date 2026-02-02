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
  FiMonitor
} from 'react-icons/fi';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import '../styles/ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [profileData, setProfileData] = useState(null);
  const [rewards, setRewards] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://gamespotbooking-v1-backend-production.up.railway.app'}/api/user/profile`, {
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
          setProfileData(data.profile);
          setRewards(data.rewards);
        } else {
          setError('Failed to load profile');
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated]);

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
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

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://gamespotbooking-v1-backend-production.up.railway.app'}/api/user/profile-picture`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Profile picture updated!');
        setProfileData({ ...profileData, profile_picture: data.profile_picture });
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
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://gamespotbooking-v1-backend-production.up.railway.app'}/api/rewards/instagram-share`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        setRewards(data.rewards);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error('Share tracking error:', err);
      setError('Failed to track share');
    }
  };

  const handleRedeemReward = async (rewardType) => {
    try {
      setError(null);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://gamespotbooking-v1-backend-production.up.railway.app'}/api/rewards/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reward_type: rewardType }),
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        setRewards(data.rewards);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error('Redeem error:', err);
      setError('Failed to redeem reward');
    }
  };

  if (loading || authLoading) {
    return (
      <div className="profile-page">
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Navbar />
      
      <div className="profile-container">
        <div className="profile-header">
          <h1>My Profile</h1>
          <p>Manage your account and rewards</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        <div className="profile-grid">
          {/* Personal Details Card */}
          <div className="profile-card">
            <div className="card-header">
              <FiUser className="header-icon" />
              <h2>Personal Details</h2>
            </div>

            <div className="profile-picture-section">
              <div className="profile-picture">
                {profileData?.profile_picture ? (
                  <img src={profileData.profile_picture} alt="Profile" />
                ) : (
                  <div className="profile-placeholder">
                    <FiUser size={48} />
                  </div>
                )}
                <label htmlFor="profile-upload" className="upload-overlay">
                  <FiCamera size={24} />
                  <input
                    id="profile-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureUpload}
                    disabled={uploadingImage}
                    style={{ display: 'none' }}
                  />
                </label>
                {uploadingImage && <div className="upload-spinner"></div>}
              </div>
              <p className="upload-hint">Click to upload photo</p>
            </div>

            <div className="detail-row">
              <FiUser className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">Name</span>
                <span className="detail-value">{profileData?.name || 'N/A'}</span>
              </div>
            </div>

            <div className="detail-row">
              <FiMail className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">Email</span>
                <span className="detail-value">{profileData?.email || 'N/A'}</span>
              </div>
            </div>

            <div className="detail-row">
              <FiPhone className="detail-icon" />
              <div className="detail-content">
                <span className="detail-label">Phone</span>
                <span className="detail-value">{profileData?.phone || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Rewards Card */}
          <div className="profile-card rewards-card">
            <div className="card-header">
              <FiAward className="header-icon" />
              <h2>Rewards & Points</h2>
            </div>

            {/* Points Display */}
            <div className="points-display">
              <div className="points-circle">
                <FiTrendingUp size={32} />
                <h3>{rewards?.gamespot_points || 0}</h3>
                <p>GameSpot Points</p>
              </div>
              <p className="points-info">
                Earn points with every booking and redeem for amazing rewards!
              </p>
            </div>

            {/* Instagram Share Reward */}
            <div className="reward-section">
              <div className="reward-header">
                <FiInstagram className="reward-icon instagram" />
                <h3>Instagram Share Reward</h3>
              </div>
              <div className="reward-content">
                <p>Share GameSpot to 5 friends on Instagram and get <strong>30 minutes free playtime!</strong></p>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{width: `${Math.min((rewards?.instagram_shares || 0) / 5 * 100, 100)}%`}}
                  ></div>
                </div>
                <p className="progress-text">{rewards?.instagram_shares || 0} / 5 shares</p>
                
                {rewards?.instagram_shares >= 5 && rewards?.free_playtime_minutes === 0 ? (
                  <button 
                    className="btn-primary btn-small"
                    onClick={() => handleRedeemReward('instagram_free_time')}
                  >
                    <FiGift /> Claim Reward
                  </button>
                ) : rewards?.free_playtime_minutes > 0 ? (
                  <div className="reward-claimed">
                    <FiClock /> {rewards.free_playtime_minutes} mins free time available!
                  </div>
                ) : (
                  <button 
                    className="btn-secondary btn-small"
                    onClick={handleInstagramShare}
                  >
                    <FiInstagram /> I Shared on Instagram
                  </button>
                )}
              </div>
            </div>

            {/* Points Redemption */}
            <div className="reward-section">
              <div className="reward-header">
                <FiGift className="reward-icon" />
                <h3>Redeem Points</h3>
              </div>
              
              <div className="redemption-options">
                {/* PS5 Extra Hour */}
                <div className="redemption-card">
                  <FiMonitor className="redemption-icon" />
                  <h4>1 Hour Extra PS5 Time</h4>
                  <p className="redemption-desc">Min booking: ₹300</p>
                  <div className="redemption-cost">
                    <FiAward /> 500 Points
                  </div>
                  {rewards?.gamespot_points >= 500 ? (
                    <button 
                      className="btn-primary btn-small"
                      onClick={() => handleRedeemReward('ps5_extra_hour')}
                    >
                      Redeem Now
                    </button>
                  ) : (
                    <button className="btn-disabled btn-small" disabled>
                      Need {500 - (rewards?.gamespot_points || 0)} more points
                    </button>
                  )}
                </div>

                {/* VR Free Day */}
                <div className="redemption-card premium">
                  <FiMonitor className="redemption-icon" />
                  <h4>1 Day VR Rental FREE</h4>
                  <p className="redemption-desc">Take home for 24 hours</p>
                  <div className="redemption-cost premium">
                    <FiAward /> 2000 Points
                  </div>
                  {rewards?.gamespot_points >= 2000 ? (
                    <button 
                      className="btn-primary btn-small"
                      onClick={() => handleRedeemReward('vr_free_day')}
                    >
                      Redeem Now
                    </button>
                  ) : (
                    <button className="btn-disabled btn-small" disabled>
                      Need {2000 - (rewards?.gamespot_points || 0)} more points
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* How to Earn Points */}
            <div className="info-box">
              <h4>How to Earn Points?</h4>
              <ul>
                <li>Earn 2% of booking amount as points</li>
                <li>Book ₹500 = Get 10 points</li>
                <li>Book ₹1000 = Get 20 points</li>
                <li>Points never expire!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
