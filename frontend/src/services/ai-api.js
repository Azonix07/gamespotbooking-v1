/**
 * AI Booking Assistant API Service
 * Handles communication with the AI chat endpoint
 * Works in local + production (Railway)
 */

// 🔑 Use the SAME central backend URL
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://gamespotbooking-v1-production.up.railway.app";

// =======================================================
// Send message to AI assistant
// =======================================================

export const sendAIMessage = async (
  message,
  sessionId = null,
  context = {}
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        message,
        session_id: sessionId,
        context,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "AI request failed");
    }

    return await response.json();
  } catch (error) {
    console.error("AI API Error:", error);
    throw error;
  }
};

// =======================================================
// Clear AI session
// =======================================================

export const clearAISession = async (sessionId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/ai/clear-session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ session_id: sessionId }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to clear AI session");
    }

    return await response.json();
  } catch (error) {
    console.error("AI Session Clear Error:", error);
    throw error;
  }
};
