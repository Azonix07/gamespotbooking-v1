/**
 * API Service
 * Handles all API calls to the backend
 * Works in local + production (Railway)
 * Uses centralized token management from apiClient
 */

// 🔑 Central backend URL
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "https://gamespotbooking-v1-production.up.railway.app";

// =======================================================
// JWT Token Helper — delegates to apiClient for memory-first storage
// =======================================================

const getAuthToken = () => {
  try {
    // Import dynamically to avoid circular dependency issues
    // Falls back to localStorage for backward compatibility
    return localStorage.getItem('gamespot_auth_token');
  } catch (e) {
    return null;
  }
};

// =======================================================
// Shared fetch helper (session + JSON + JWT)
// =======================================================

const fetchWithCredentials = async (url, options = {}) => {
  // Get JWT token for mobile authentication
  const token = getAuthToken();
  
  // Build headers with optional Authorization token
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  
  // Add Authorization header if we have a token (mobile browsers)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Timeout for slow connections — 30 seconds
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  let response;
  try {
    response = await fetch(url, {
      ...options,
      credentials: "include",
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your internet connection and try again.');
    }
    throw new Error('Network error. Please check your internet connection.');
  }
  clearTimeout(timeoutId);

  // Check content type before parsing
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    await response.text();
    throw new Error(`Server returned non-JSON response (${response.status})`);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "API request failed");
  }

  return data;
};

// =======================================================
// Slots API
// =======================================================

export const getSlots = async (date) => {
  return fetchWithCredentials(`${API_BASE_URL}/api/slots.php?date=${date}`);
};

export const getSlotDetails = async (date, time, duration) => {
  return fetchWithCredentials(
    `${API_BASE_URL}/api/slots.php?date=${date}&time=${time}&duration=${duration}`
  );
};

// =======================================================
// Pricing API
// =======================================================

export const calculatePrice = async (ps5Bookings, drivingSim, durationMinutes) => {
  return fetchWithCredentials(`${API_BASE_URL}/api/pricing.php`, {
    method: "POST",
    body: JSON.stringify({
      ps5_bookings: ps5Bookings,
      driving_sim: drivingSim,
      duration_minutes: durationMinutes,
    }),
  });
};

// =======================================================
// Bookings API
// =======================================================

export const createBooking = async (bookingData) => {
  return fetchWithCredentials(`${API_BASE_URL}/api/bookings.php`, {
    method: "POST",
    body: JSON.stringify(bookingData),
  });
};

export const getAllBookings = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/api/bookings.php`);
};

export const updateBooking = async (bookingId, updates) => {
  return fetchWithCredentials(
    `${API_BASE_URL}/api/bookings.php?id=${bookingId}`,
    {
      method: "PUT",
      body: JSON.stringify(updates),
    }
  );
};

export const deleteBooking = async (bookingId) => {
  return fetchWithCredentials(
    `${API_BASE_URL}/api/bookings.php?id=${bookingId}`,
    { method: "DELETE" }
  );
};

// =======================================================
// Admin API (Legacy)
// =======================================================

export const adminLogin = async (username, password) => {
  return fetchWithCredentials(
    `${API_BASE_URL}/api/admin.php?action=login`,
    {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }
  );
};

export const adminLogout = async () => {
  return fetchWithCredentials(
    `${API_BASE_URL}/api/admin.php?action=logout`,
    { method: "POST" }
  );
};

export const checkAdminSession = async () => {
  return fetchWithCredentials(
    `${API_BASE_URL}/api/admin.php?action=check`
  );
};

// =======================================================
// User Authentication API
// =======================================================

export const signup = async (userData) => {
  return fetchWithCredentials(`${API_BASE_URL}/api/auth/signup`, {
    method: "POST",
    body: JSON.stringify(userData),
  });
};

export const login = async (identifier, password) => {
  return fetchWithCredentials(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    body: JSON.stringify({ username: identifier, password }),
  });
};

export const logout = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
  });
};

export const checkSession = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/api/auth/check`);
};

export const forgotPassword = async (email) => {
  return fetchWithCredentials(
    `${API_BASE_URL}/api/auth/forgot-password`,
    {
      method: "POST",
      body: JSON.stringify({ email }),
    }
  );
};

export const resetPassword = async (token, password, confirmPassword) => {
  return fetchWithCredentials(
    `${API_BASE_URL}/api/auth/reset-password`,
    {
      method: "POST",
      body: JSON.stringify({ token, password, confirmPassword }),
    }
  );
};

export const getCurrentUser = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/api/auth/me`);
};

// =======================================================
// Membership API
// =======================================================

export const getMembershipPlans = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/api/membership/plans`);
};

export const subscribeMembership = async (planType) => {
  return fetchWithCredentials(
    `${API_BASE_URL}/api/membership/subscribe`,
    {
      method: "POST",
      body: JSON.stringify({ plan_type: planType }),
    }
  );
};

export const getMembershipStatus = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/api/membership/status`);
};

export const cancelMembership = async () => {
  return fetchWithCredentials(
    `${API_BASE_URL}/api/membership/cancel`,
    { method: "POST" }
  );
};

export const getMembershipHistory = async () => {
  return fetchWithCredentials(
    `${API_BASE_URL}/api/membership/history`
  );
};

export const requestMembershipUpgrade = async (planType) => {
  return fetchWithCredentials(
    `${API_BASE_URL}/api/membership/upgrade`,
    {
      method: "POST",
      body: JSON.stringify({ plan_type: planType }),
    }
  );
};

// =======================================================
// Admin Management API
// =======================================================

export const getAdminUsers = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/api/admin/users`);
};

export const getAdminMemberships = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/api/admin/memberships`);
};

export const approveMembership = async (membershipId) => {
  return fetchWithCredentials(
    `${API_BASE_URL}/api/admin/membership/approve/${membershipId}`,
    { method: "POST" }
  );
};

export const rejectMembership = async (membershipId) => {
  return fetchWithCredentials(
    `${API_BASE_URL}/api/admin/membership/reject/${membershipId}`,
    { method: "POST" }
  );
};

export const getAdminStats = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/api/admin/stats`);
};

// =======================================================
// Games API
// =======================================================

export const getGames = async (ps5Filter = null) => {
  const url = ps5Filter
    ? `${API_BASE_URL}/api/games?ps5=${ps5Filter}`
    : `${API_BASE_URL}/api/games`;
  return fetchWithCredentials(url);
};

export const getRecommendations = async () => {
  return fetchWithCredentials(
    `${API_BASE_URL}/api/games/recommendations`
  );
};

export const recommendGame = async (gameName, description = "") => {
  return fetchWithCredentials(
    `${API_BASE_URL}/api/games/recommend`,
    {
      method: "POST",
      body: JSON.stringify({ game_name: gameName, description }),
    }
  );
};

export const voteForGame = async (recommendationId) => {
  return fetchWithCredentials(`${API_BASE_URL}/api/games/vote`, {
    method: "POST",
    body: JSON.stringify({ recommendation_id: recommendationId }),
  });
};

export const getGamesStats = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/api/games/stats`);
};

// =======================================================
// Theme API
// =======================================================

export const getTheme = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/api/admin/theme`);
};

export const updateTheme = async (theme) => {
  return fetchWithCredentials(`${API_BASE_URL}/api/admin/theme`, {
    method: "POST",
    body: JSON.stringify({ theme }),
  });
};

// =======================================================
// Analytics API
// =======================================================

export const trackPageVisit = async (page, referrer = document.referrer) => {
  try {
    await fetchWithCredentials(`${API_BASE_URL}/api/analytics/track`, {
      method: "POST",
      body: JSON.stringify({ page, referrer }),
    });
  } catch (error) {
    // Silently ignore analytics errors — table may not exist yet
  }
};

export const getAnalytics = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/api/analytics/stats`);
};

// =======================================================
// Feedback API
// =======================================================

export const submitFeedback = async (feedbackData) => {
  return fetchWithCredentials(`${API_BASE_URL}/api/feedback/submit`, {
    method: "POST",
    body: JSON.stringify(feedbackData),
  });
};

export const getAllFeedback = async (
  statusFilter = "all",
  typeFilter = "all"
) => {
  return fetchWithCredentials(
    `${API_BASE_URL}/api/feedback/all?status=${statusFilter}&type=${typeFilter}`
  );
};

export const updateFeedbackStatus = async (
  feedbackId,
  status,
  adminNotes = ""
) => {
  return fetchWithCredentials(
    `${API_BASE_URL}/api/feedback/${feedbackId}/status`,
    {
      method: "PUT",
      body: JSON.stringify({ status, admin_notes: adminNotes }),
    }
  );
};

export const deleteFeedback = async (feedbackId) => {
  return fetchWithCredentials(
    `${API_BASE_URL}/api/feedback/${feedbackId}`,
    { method: "DELETE" }
  );
};

export const getFeedbackStats = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/api/feedback/stats`);
};
// =======================
// Rentals API
// =======================
export const getRentals = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/api/rentals`);
};

export const getRentalStats = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/api/rentals/stats`);
};

// =======================
// College Bookings API
// =======================
export const getCollegeBookings = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/api/college-bookings`);
};

export const getCollegeStats = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/api/college-bookings/stats`);
};

// =======================
// Game Leaderboard API
// =======================
export const getGameLeaderboard = async (period = "all", limit = 100) => {
  return fetchWithCredentials(
    `${API_BASE_URL}/api/game/leaderboard?period=${period}&limit=${limit}`
  );
};

export const getGameStats = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/api/game/stats`);
};

// =======================================================
// User Profile & Rewards API
// =======================================================

export const getUserProfile = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/api/user/profile`);
};

export const uploadProfilePicture = async (formData) => {
  const token = getAuthToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const response = await fetch(`${API_BASE_URL}/api/user/profile-picture`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: formData
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Upload failed');
  return data;
};

export const trackInstagramShare = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/api/rewards/instagram-share`, {
    method: "POST",
  });
};

export const redeemReward = async (rewardType) => {
  return fetchWithCredentials(`${API_BASE_URL}/api/rewards/redeem`, {
    method: "POST",
    body: JSON.stringify({ reward_type: rewardType }),
  });
};

export const googleLogin = async (credential) => {
  return fetchWithCredentials(`${API_BASE_URL}/api/auth/google-login`, {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
};

// =======================================================
// Party Booking API
// =======================================================

export const createPartyBooking = async (bookingData) => {
  return fetchWithCredentials(`${API_BASE_URL}/api/party-booking`, {
    method: "POST",
    body: JSON.stringify(bookingData),
  });
};

export const getPartyBookings = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/api/party-booking`);
};

export const deletePartyBooking = async (bookingId) => {
  return fetchWithCredentials(
    `${API_BASE_URL}/api/party-booking?id=${bookingId}`,
    { method: "DELETE" }
  );
};

// =======================================================
// Quest Pass (Story Mode Membership) API
// =======================================================

export const getQuestPassInfo = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/api/quest-pass/info`);
};

export const getQuestPassStatus = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/api/quest-pass/status`);
};

export const subscribeQuestPass = async (gameName) => {
  return fetchWithCredentials(`${API_BASE_URL}/api/quest-pass/subscribe`, {
    method: "POST",
    body: JSON.stringify({ game_name: gameName }),
  });
};

export const cancelQuestPass = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/api/quest-pass/cancel`, {
    method: "POST",
  });
};

export const requestQuestPassGameChange = async (gameName) => {
  return fetchWithCredentials(`${API_BASE_URL}/api/quest-pass/change-game`, {
    method: "POST",
    body: JSON.stringify({ game_name: gameName }),
  });
};

export const getAdminQuestPasses = async () => {
  return fetchWithCredentials(`${API_BASE_URL}/api/admin/quest-pass`);
};

export const approveQuestPass = async (passId, deviceNumber, notes = '') => {
  return fetchWithCredentials(`${API_BASE_URL}/api/admin/quest-pass/approve/${passId}`, {
    method: "POST",
    body: JSON.stringify({ device_number: deviceNumber, notes }),
  });
};

export const rejectQuestPass = async (passId, reason = '') => {
  return fetchWithCredentials(`${API_BASE_URL}/api/admin/quest-pass/reject/${passId}`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
};

export const updateQuestProgress = async (passId, hoursPlayed, progressNotes) => {
  return fetchWithCredentials(`${API_BASE_URL}/api/admin/quest-pass/progress/${passId}`, {
    method: "POST",
    body: JSON.stringify({ hours_played: hoursPlayed, progress_notes: progressNotes }),
  });
};

export const approveQuestPassGameChange = async (passId) => {
  return fetchWithCredentials(`${API_BASE_URL}/api/admin/quest-pass/approve-game-change/${passId}`, {
    method: "POST",
  });
};

export const rejectQuestPassGameChange = async (passId) => {
  return fetchWithCredentials(`${API_BASE_URL}/api/admin/quest-pass/reject-game-change/${passId}`, {
    method: "POST",
  });
};
