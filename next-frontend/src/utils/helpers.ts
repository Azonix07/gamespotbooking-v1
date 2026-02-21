/** Utility Functions — Next.js Version */

/**
 * Get current time in IST (Asia/Kolkata, UTC+5:30).
 * This ensures the booking page always works relative to Kerala time,
 * regardless of the user's browser timezone (e.g. UK, US, etc.).
 */
export const getISTDate = (): Date => {
  const now = new Date();
  // Get UTC time, then add IST offset (+5:30 = 330 minutes)
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + 330 * 60000);
};

/**
 * Get IST hours and minutes as { hours, minutes }
 */
export const getISTTime = (): { hours: number; minutes: number } => {
  const ist = getISTDate();
  return { hours: ist.getHours(), minutes: ist.getMinutes() };
};

export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatTime = (time: string): string => {
  if (time.length === 5) return time;
  return time.substring(0, 5);
};

export const formatTime12Hour = (time24: string): string => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
};

export const getToday = (): string => formatDate(getISTDate());

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

export const formatDuration = (minutes: number): string => {
  if (minutes === 30) return '30 minutes';
  if (minutes === 60) return '1 hour';
  if (minutes === 90) return '1.5 hours';
  if (minutes === 120) return '2 hours';
  return `${minutes} minutes`;
};

export const formatPrice = (price: number): string => `₹${price.toFixed(0)}`;

export const isValidPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10;
};

export const isValidName = (name: string): boolean => {
  return !!name && name.trim().length >= 2;
};
