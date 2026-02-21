/**
 * Session ID utilities for CincyMuse chatbot
 * Generates and manages 33+ character session IDs for AWS AgentCore compatibility
 */

/**
 * Generate a cryptographically secure session ID with 33+ characters
 * Format: timestamp-random-uuid (ensures uniqueness and length requirement)
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36); // Base36 timestamp
  const randomPart = Math.random().toString(36).substring(2, 15); // Random string
  const uuid = crypto.randomUUID(); // Standard UUID (36 chars with hyphens)
  
  // Combine to ensure 33+ characters
  const sessionId = `${timestamp}-${randomPart}-${uuid}`;
  
  return sessionId;
}

/**
 * Get or create session ID from sessionStorage
 * Session ID persists across page reloads but not across browser sessions
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    // Server-side rendering - return temporary ID
    return generateSessionId();
  }

  const STORAGE_KEY = 'cincymuse_session_id';
  
  try {
    let sessionId = sessionStorage.getItem(STORAGE_KEY);
    
    if (!sessionId || sessionId.length < 33) {
      sessionId = generateSessionId();
      sessionStorage.setItem(STORAGE_KEY, sessionId);
    }
    
    return sessionId;
  } catch (error) {
    // Fallback if sessionStorage is not available
    console.warn('SessionStorage not available, using temporary session ID');
    return generateSessionId();
  }
}

/**
 * Clear the current session ID
 */
export function clearSessionId(): void {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem('cincymuse_session_id');
    } catch (error) {
      console.warn('Failed to clear session ID:', error);
    }
  }
}
