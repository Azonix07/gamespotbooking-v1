/**
 * Central API Client
 * Handles ALL backend communication
 */

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://gamespotbooking-v1-production.up.railway.app";

export const apiFetch = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "API request failed");
  }

  return data;
};
