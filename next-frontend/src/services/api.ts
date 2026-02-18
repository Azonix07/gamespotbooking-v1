/**
 * API Service — Next.js Version
 * All API calls to the backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://gamespotbooking-v1-production.up.railway.app';

const getAuthToken = (): string | null => {
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gamespot_auth_token');
    }
  } catch (e) {}
  return null;
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithCredentials = async (url: string, options: RequestInit = {}, retries = 2): Promise<any> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  let response: Response;
  try {
    response = await fetch(url, { ...options, credentials: 'include', headers, signal: controller.signal });
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      if (retries > 0) { await delay(1000); return fetchWithCredentials(url, options, retries - 1); }
      throw new Error('Request timed out. Please try again.');
    }
    // Retry on network errors (DNS failures, connection resets, etc.)
    if (retries > 0) {
      await delay(1500);
      return fetchWithCredentials(url, options, retries - 1);
    }
    throw new Error('Network error. Please check your internet connection.');
  }
  clearTimeout(timeoutId);

  // Retry on 502/503/504 (server temporarily down)
  if ([502, 503, 504].includes(response.status) && retries > 0) {
    await delay(2000);
    return fetchWithCredentials(url, options, retries - 1);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    await response.text();
    throw new Error(`Server returned non-JSON response (${response.status})`);
  }

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'API request failed');
  return data;
};

// Slots
export const getSlots = (date: string) => fetchWithCredentials(`${API_BASE_URL}/api/slots.php?date=${date}`);
export const getSlotDetails = (date: string, time: string, duration: number) =>
  fetchWithCredentials(`${API_BASE_URL}/api/slots.php?date=${date}&time=${time}&duration=${duration}`);

// Pricing
export const calculatePrice = (ps5Bookings: any[], drivingSim: boolean, durationMinutes: number) =>
  fetchWithCredentials(`${API_BASE_URL}/api/pricing.php`, {
    method: 'POST',
    body: JSON.stringify({ ps5_bookings: ps5Bookings, driving_sim: drivingSim, duration_minutes: durationMinutes }),
  });

// Bookings
export const createBooking = (bookingData: any) =>
  fetchWithCredentials(`${API_BASE_URL}/api/bookings.php`, { method: 'POST', body: JSON.stringify(bookingData) });
export const getAllBookings = () => fetchWithCredentials(`${API_BASE_URL}/api/bookings.php`);
export const updateBooking = (id: number, updates: any) =>
  fetchWithCredentials(`${API_BASE_URL}/api/bookings.php?id=${id}`, { method: 'PUT', body: JSON.stringify(updates) });
export const deleteBooking = (id: number) =>
  fetchWithCredentials(`${API_BASE_URL}/api/bookings.php?id=${id}`, { method: 'DELETE' });

// Admin
export const adminLogin = (username: string, password: string) =>
  fetchWithCredentials(`${API_BASE_URL}/api/admin.php?action=login`, { method: 'POST', body: JSON.stringify({ username, password }) });
export const adminLogout = () =>
  fetchWithCredentials(`${API_BASE_URL}/api/admin.php?action=logout`, { method: 'POST' });
export const checkAdminSession = () => fetchWithCredentials(`${API_BASE_URL}/api/admin.php?action=check`);

// Auth
export const signup = (userData: any) =>
  fetchWithCredentials(`${API_BASE_URL}/api/auth/signup`, { method: 'POST', body: JSON.stringify(userData) });
export const login = (identifier: string, password: string) =>
  fetchWithCredentials(`${API_BASE_URL}/api/auth/login`, { method: 'POST', body: JSON.stringify({ username: identifier, password }) });
export const logout = () => fetchWithCredentials(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' });
export const checkSession = () => fetchWithCredentials(`${API_BASE_URL}/api/auth/check`);
export const forgotPassword = (email: string) =>
  fetchWithCredentials(`${API_BASE_URL}/api/auth/forgot-password`, { method: 'POST', body: JSON.stringify({ email }) });
export const resetPassword = (token: string, password: string, confirmPassword: string) =>
  fetchWithCredentials(`${API_BASE_URL}/api/auth/reset-password`, { method: 'POST', body: JSON.stringify({ token, password, confirmPassword }) });
export const getCurrentUser = () => fetchWithCredentials(`${API_BASE_URL}/api/auth/me`);

// Membership
export const getMembershipPlans = () => fetchWithCredentials(`${API_BASE_URL}/api/membership/plans`);
export const subscribeMembership = (planType: string) =>
  fetchWithCredentials(`${API_BASE_URL}/api/membership/subscribe`, { method: 'POST', body: JSON.stringify({ plan_type: planType }) });
export const getMembershipStatus = () => fetchWithCredentials(`${API_BASE_URL}/api/membership/status`);
export const cancelMembership = () => fetchWithCredentials(`${API_BASE_URL}/api/membership/cancel`, { method: 'POST' });
export const getMembershipHistory = () => fetchWithCredentials(`${API_BASE_URL}/api/membership/history`);
export const requestMembershipUpgrade = (planType: string) =>
  fetchWithCredentials(`${API_BASE_URL}/api/membership/upgrade`, { method: 'POST', body: JSON.stringify({ plan_type: planType }) });
export const requestDedicatedGame = (gameName: string) =>
  fetchWithCredentials(`${API_BASE_URL}/api/membership/request-game`, { method: 'POST', body: JSON.stringify({ game_name: gameName }) });

// Admin Management
export const getAdminUsers = () => fetchWithCredentials(`${API_BASE_URL}/api/admin/users`);
export const getAdminMemberships = () => fetchWithCredentials(`${API_BASE_URL}/api/admin/memberships`);
export const approveMembership = (id: number) =>
  fetchWithCredentials(`${API_BASE_URL}/api/admin/membership/approve/${id}`, { method: 'POST' });
export const rejectMembership = (id: number) =>
  fetchWithCredentials(`${API_BASE_URL}/api/admin/membership/reject/${id}`, { method: 'POST' });
export const approveGameRequest = (id: number) =>
  fetchWithCredentials(`${API_BASE_URL}/api/admin/membership/approve-game/${id}`, { method: 'POST' });
export const rejectGameRequest = (id: number) =>
  fetchWithCredentials(`${API_BASE_URL}/api/admin/membership/reject-game/${id}`, { method: 'POST' });
export const getAdminStats = () => fetchWithCredentials(`${API_BASE_URL}/api/admin/stats`);

// Financial Management
export const getFinancialSummary = () => fetchWithCredentials(`${API_BASE_URL}/api/admin/financial-summary`);
export const getExpenses = (dateFrom?: string, dateTo?: string, category?: string) => {
  const params = new URLSearchParams();
  if (dateFrom) params.append('date_from', dateFrom);
  if (dateTo) params.append('date_to', dateTo);
  if (category) params.append('category', category);
  const qs = params.toString();
  return fetchWithCredentials(`${API_BASE_URL}/api/admin/expenses${qs ? '?' + qs : ''}`);
};
export const addExpense = (data: { expense_date: string; category: string; description: string; amount: number }) =>
  fetchWithCredentials(`${API_BASE_URL}/api/admin/expenses`, { method: 'POST', body: JSON.stringify(data) });
export const deleteExpense = (id: number) =>
  fetchWithCredentials(`${API_BASE_URL}/api/admin/expenses/${id}`, { method: 'DELETE' });

// Games
export const getGames = (ps5Filter: string | null = null) => {
  const url = ps5Filter ? `${API_BASE_URL}/api/games?ps5=${ps5Filter}` : `${API_BASE_URL}/api/games`;
  return fetchWithCredentials(url);
};
export const getRecommendations = () => fetchWithCredentials(`${API_BASE_URL}/api/games/recommendations`);
export const recommendGame = (gameName: string, description = '') =>
  fetchWithCredentials(`${API_BASE_URL}/api/games/recommend`, { method: 'POST', body: JSON.stringify({ game_name: gameName, description }) });
export const voteForGame = (recommendationId: number) =>
  fetchWithCredentials(`${API_BASE_URL}/api/games/vote`, { method: 'POST', body: JSON.stringify({ recommendation_id: recommendationId }) });

// Theme
export const getTheme = () => fetchWithCredentials(`${API_BASE_URL}/api/admin/theme`);
export const updateTheme = (theme: string) =>
  fetchWithCredentials(`${API_BASE_URL}/api/admin/theme`, { method: 'POST', body: JSON.stringify({ theme }) });

// Analytics
export const trackPageVisit = async (page: string, referrer = typeof document !== 'undefined' ? document.referrer : '') => {
  try {
    await fetchWithCredentials(`${API_BASE_URL}/api/analytics/track`, { method: 'POST', body: JSON.stringify({ page, referrer }) });
  } catch (error) { /* silently ignore */ }
};
export const getAnalytics = () => fetchWithCredentials(`${API_BASE_URL}/api/analytics/stats`);

// Feedback
export const submitFeedback = (data: any) =>
  fetchWithCredentials(`${API_BASE_URL}/api/feedback/submit`, { method: 'POST', body: JSON.stringify(data) });

// Rentals
export const getRentals = () => fetchWithCredentials(`${API_BASE_URL}/api/rentals`);
export const getRentalStats = () => fetchWithCredentials(`${API_BASE_URL}/api/rentals/stats`);

// College
export const getCollegeBookings = () => fetchWithCredentials(`${API_BASE_URL}/api/college-bookings`);
export const getCollegeStats = () => fetchWithCredentials(`${API_BASE_URL}/api/college-bookings/stats`);

// Profile & Rewards
export const getUserProfile = () => fetchWithCredentials(`${API_BASE_URL}/api/user/profile`);

// User Booking Management
export const cancelUserBooking = (bookingId: number) =>
  fetchWithCredentials(`${API_BASE_URL}/api/user/bookings/${bookingId}/cancel`, { method: 'POST' });

export const googleLogin = (credential: string) =>
  fetchWithCredentials(`${API_BASE_URL}/api/auth/google-login`, { method: 'POST', body: JSON.stringify({ credential }) });

// Party Booking
export const createPartyBooking = (data: any) =>
  fetchWithCredentials(`${API_BASE_URL}/api/party-booking`, { method: 'POST', body: JSON.stringify(data) });
export const getPartyBookings = () => fetchWithCredentials(`${API_BASE_URL}/api/party-booking`);
export const deletePartyBooking = (id: number) =>
  fetchWithCredentials(`${API_BASE_URL}/api/party-booking?id=${id}`, { method: 'DELETE' });

// Quest Pass
export const getQuestPassInfo = () => fetchWithCredentials(`${API_BASE_URL}/api/quest-pass/info`);
export const getQuestPassStatus = () => fetchWithCredentials(`${API_BASE_URL}/api/quest-pass/status`);
export const subscribeQuestPass = (gameName: string) =>
  fetchWithCredentials(`${API_BASE_URL}/api/quest-pass/subscribe`, { method: 'POST', body: JSON.stringify({ game_name: gameName }) });
export const requestQuestPassGameChange = (gameName: string) =>
  fetchWithCredentials(`${API_BASE_URL}/api/quest-pass/change-game`, { method: 'POST', body: JSON.stringify({ game_name: gameName }) });

// Admin Quest Pass
export const getAdminQuestPasses = () => fetchWithCredentials(`${API_BASE_URL}/api/admin/quest-pass`);
export const approveQuestPass = (passId: number, deviceNumber: number, notes = '') =>
  fetchWithCredentials(`${API_BASE_URL}/api/admin/quest-pass/approve/${passId}`, { method: 'POST', body: JSON.stringify({ device_number: deviceNumber, notes }) });
export const rejectQuestPass = (passId: number, reason = '') =>
  fetchWithCredentials(`${API_BASE_URL}/api/admin/quest-pass/reject/${passId}`, { method: 'POST', body: JSON.stringify({ reason }) });
export const updateQuestProgress = (passId: number, hoursPlayed: number, progressNotes: string) =>
  fetchWithCredentials(`${API_BASE_URL}/api/admin/quest-pass/progress/${passId}`, { method: 'POST', body: JSON.stringify({ hours_played: hoursPlayed, progress_notes: progressNotes }) });
export const approveQuestPassGameChange = (passId: number) =>
  fetchWithCredentials(`${API_BASE_URL}/api/admin/quest-pass/approve-game-change/${passId}`, { method: 'POST' });
export const rejectQuestPassGameChange = (passId: number) =>
  fetchWithCredentials(`${API_BASE_URL}/api/admin/quest-pass/reject-game-change/${passId}`, { method: 'POST' });

// Instagram Promo
export const getOfferClaims = (status?: string) => {
  const url = status ? `${API_BASE_URL}/api/admin/instagram-promo/redemptions?status=${status}` : `${API_BASE_URL}/api/admin/instagram-promo/redemptions`;
  return fetchWithCredentials(url);
};
export const approveOfferClaim = (id: number, notes = '') =>
  fetchWithCredentials(`${API_BASE_URL}/api/admin/instagram-promo/verify/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'verified', notes }) });
export const rejectOfferClaim = (id: number, notes = '') =>
  fetchWithCredentials(`${API_BASE_URL}/api/admin/instagram-promo/verify/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'rejected', notes }) });
