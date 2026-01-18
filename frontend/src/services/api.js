/**
 * API Service
 * Handles all API calls to the backend
 */

const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Fetch with credentials for session management
 */
const fetchWithCredentials = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }
  
  return data;
};

// ============================================================================
// Slots API
// ============================================================================

export const getSlots = async (date) => {
  return fetchWithCredentials(`${API_BASE_URL}/slots.php?date=${date}`);
};

export const getSlotDetails = async (date, time, duration) => {
  return fetchWithCredentials(
    `${API_BASE_URL}/slots.php?date=${date}&time=${time}&duration=${duration}`
  );
};

// ============================================================================
// Pricing API
// ============================================================================

export const calculatePrice = async (ps5Bookings, drivingSim, durationMinutes) => {
  return fetchWithCredentials(`${API_BASE_URL}/pricing.php`, {
    method: 'POST',
    body: JSON.stringify({
      ps5_bookings: ps5Bookings,
      driving_sim: drivingSim,
      duration_minutes: durationMinutes,
    }),
  });
};

// ============================================================================
// Bookings API
// ============================================================================

export const createBooking = async (bookingData) => {
  return fetchWithCredentials(`${API_BASE_URL}/bookings.php`, {
    method: 'POST',
    body: JSON.stringify(bookingData),
  });
};

export const getAllBookings = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/bookings.php`);
};

export const updateBooking = async (bookingId, updates) => {
  return fetchWithCredentials(`${API_BASE_URL}/bookings.php?id=${bookingId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

export const deleteBooking = async (bookingId) => {
  return fetchWithCredentials(`${API_BASE_URL}/bookings.php?id=${bookingId}`, {
    method: 'DELETE',
  });
};

// ============================================================================
// Admin API (Legacy - keeping for compatibility)
// ============================================================================

export const adminLogin = async (username, password) => {
  return fetchWithCredentials(`${API_BASE_URL}/admin.php?action=login`, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
};

export const adminLogout = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/admin.php?action=logout`, {
    method: 'POST',
  });
};

export const checkAdminSession = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/admin.php?action=check`);
};

// ============================================================================
// User Authentication API (New Unified System)
// ============================================================================

export const signup = async (userData) => {
  return fetchWithCredentials(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const login = async (identifier, password) => {
  return fetchWithCredentials(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ username: identifier, password }),
  });
};

export const logout = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
  });
};

export const checkSession = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/auth/check`);
};

export const forgotPassword = async (email) => {
  return fetchWithCredentials(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

export const resetPassword = async (token, password, confirmPassword) => {
  return fetchWithCredentials(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ token, password, confirmPassword }),
  });
};

export const getCurrentUser = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/auth/me`);
};

// ============================================================================
// Membership API
// ============================================================================

export const getMembershipPlans = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/membership/plans`);
};

export const subscribeMembership = async (planType) => {
  return fetchWithCredentials(`${API_BASE_URL}/membership/subscribe`, {
    method: 'POST',
    body: JSON.stringify({ plan_type: planType }),
  });
};

export const getMembershipStatus = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/membership/status`);
};

export const cancelMembership = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/membership/cancel`, {
    method: 'POST',
  });
};

export const getMembershipHistory = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/membership/history`);
};

// ============================================================================
// Admin Management API (New - for users, memberships, stats)
// ============================================================================

export const getAdminUsers = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/admin/users`);
};

export const getAdminMemberships = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/admin/memberships`);
};

export const getAdminStats = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/admin/stats`);
};

// ============================================================================
// Games API (Catalog, Recommendations, Voting)
// ============================================================================

export const getGames = async (ps5Filter = null) => {
  const url = ps5Filter 
    ? `${API_BASE_URL}/games?ps5=${ps5Filter}`
    : `${API_BASE_URL}/games`;
  return fetchWithCredentials(url);
};

export const getRecommendations = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/games/recommendations`);
};

export const recommendGame = async (gameName, description = '') => {
  return fetchWithCredentials(`${API_BASE_URL}/games/recommend`, {
    method: 'POST',
    body: JSON.stringify({ game_name: gameName, description }),
  });
};


export const voteForGame = async (recommendationId) => {
  return fetchWithCredentials(`${API_BASE_URL}/games/vote`, {
    method: 'POST',
    body: JSON.stringify({ recommendation_id: recommendationId }),
  });
};

export const getGamesStats = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/games/stats`);
};

// ============================================================================
// Theme API
// ============================================================================

export const getTheme = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/admin/theme`);
};

export const updateTheme = async (theme) => {
  return fetchWithCredentials(`${API_BASE_URL}/admin/theme`, {
    method: 'POST',
    body: JSON.stringify({ theme }),
  });
};

// ============================================================================
// Analytics API
// ============================================================================

export const trackPageVisit = async (page, referrer = document.referrer) => {
  try {
    await fetchWithCredentials(`${API_BASE_URL}/analytics/track`, {
      method: 'POST',
      body: JSON.stringify({ page, referrer }),
    });
  } catch (error) {
    // Silently fail - don't disrupt user experience
    console.error('Analytics tracking error:', error);
  }
};

export const getAnalytics = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/analytics/stats`);
};

// ============================================================================
// Feedback API
// ============================================================================

export const submitFeedback = async (feedbackData) => {
  return fetchWithCredentials(`${API_BASE_URL}/feedback/submit`, {
    method: 'POST',
    body: JSON.stringify(feedbackData),
  });
};

export const getAllFeedback = async (statusFilter = 'all', typeFilter = 'all') => {
  return fetchWithCredentials(
    `${API_BASE_URL}/feedback/all?status=${statusFilter}&type=${typeFilter}`
  );
};

export const updateFeedbackStatus = async (feedbackId, status, adminNotes = '') => {
  return fetchWithCredentials(`${API_BASE_URL}/feedback/${feedbackId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, admin_notes: adminNotes }),
  });
};

export const deleteFeedback = async (feedbackId) => {
  return fetchWithCredentials(`${API_BASE_URL}/feedback/${feedbackId}`, {
    method: 'DELETE',
  });
};

export const getFeedbackStats = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/feedback/stats`);
};






