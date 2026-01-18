/**
 * Utility Functions
 * Helper functions for the frontend
 */

/**
 * Format date to YYYY-MM-DD
 */
export const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format time to HH:MM
 */
export const formatTime = (time) => {
  if (time.length === 5) return time; // Already formatted
  return time.substring(0, 5);
};

/**
 * Convert 24-hour time to 12-hour format
 */
export const formatTime12Hour = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
};

/**
 * Get today's date in YYYY-MM-DD format
 */
export const getToday = () => {
  return formatDate(new Date());
};

/**
 * Parse time string to minutes
 */
export const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert minutes to time string
 */
export const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

/**
 * Format duration in minutes to readable string
 */
export const formatDuration = (minutes) => {
  if (minutes === 30) return '30 minutes';
  if (minutes === 60) return '1 hour';
  if (minutes === 90) return '1.5 hours';
  if (minutes === 120) return '2 hours';
  return `${minutes} minutes`;
};

/**
 * Format price
 */
export const formatPrice = (price) => {
  return `₹${price.toFixed(0)}`;
};

/**
 * Validate phone number
 */
export const isValidPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10;
};

/**
 * Validate name
 */
export const isValidName = (name) => {
  return name && name.trim().length >= 2;
};
