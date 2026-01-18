/**
 * AI Booking Assistant API Service
 * Handles communication with the AI chat endpoint
 */

const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Send a message to the AI assistant
 * @param {string} message - The user's message
 * @param {string|null} sessionId - Optional session ID for conversation continuity
 * @param {object} context - Optional context object (device, date, time, etc.)
 * @returns {Promise<object>} AI response with reply, action, context, and session_id
 */
export const sendAIMessage = async (message, sessionId = null, context = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        message,
        session_id: sessionId,
        context
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'AI request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('AI API Error:', error);
    throw error;
  }
};

/**
 * Clear the AI conversation session
 * @param {string} sessionId - The session ID to clear
 * @returns {Promise<object>} Response confirming session cleared
 */
export const clearAISession = async (sessionId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/clear-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ session_id: sessionId })
    });

    if (!response.ok) {
      throw new Error('Failed to clear AI session');
    }

    return await response.json();
  } catch (error) {
    console.error('AI Session Clear Error:', error);
    throw error;
  }
};
