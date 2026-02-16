/**
 * AI Booking Assistant API Service — Next.js Version
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const sendAIMessage = async (message: string, sessionId: string | null = null, context: Record<string, any> = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ message, session_id: sessionId, context }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'AI request failed');
  }

  return response.json();
};

export const clearAISession = async (sessionId: string) => {
  const response = await fetch(`${API_BASE_URL}/api/ai/clear-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ session_id: sessionId }),
  });

  if (!response.ok) throw new Error('Failed to clear AI session');
  return response.json();
};
