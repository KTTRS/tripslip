/**
 * Session management utilities for parent app
 * Handles 24-hour temporary sessions for magic link authentication
 */

export interface ParentSession {
  permissionSlipId: string;
  authToken: string;
  expiresAt: string;
}

/**
 * Check if the current session is valid
 */
export function isSessionValid(): boolean {
  const expiresAt = sessionStorage.getItem('auth_expires_at');
  if (!expiresAt) return false;

  const expiryDate = new Date(expiresAt);
  return expiryDate > new Date();
}

/**
 * Get the current session
 */
export function getSession(): ParentSession | null {
  const permissionSlipId = sessionStorage.getItem('permission_slip_id');
  const authToken = sessionStorage.getItem('auth_token');
  const expiresAt = sessionStorage.getItem('auth_expires_at');

  if (!permissionSlipId || !authToken || !expiresAt) {
    return null;
  }

  if (!isSessionValid()) {
    clearSession();
    return null;
  }

  return {
    permissionSlipId,
    authToken,
    expiresAt,
  };
}

/**
 * Clear the current session
 */
export function clearSession(): void {
  sessionStorage.removeItem('permission_slip_id');
  sessionStorage.removeItem('auth_token');
  sessionStorage.removeItem('auth_expires_at');
}

/**
 * Create a new session
 */
export function createSession(permissionSlipId: string, authToken: string): void {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  
  sessionStorage.setItem('permission_slip_id', permissionSlipId);
  sessionStorage.setItem('auth_token', authToken);
  sessionStorage.setItem('auth_expires_at', expiresAt);
}
