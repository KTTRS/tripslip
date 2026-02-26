import type { Session } from '@tripslip/database';

/**
 * Session storage key
 */
const SESSION_KEY = 'tripslip_session';

/**
 * Session management utilities for client-side storage
 */
export const sessionStorage = {
  /**
   * Save session to localStorage
   */
  save(session: Session): void {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  },

  /**
   * Load session from localStorage
   */
  load(): Session | null {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (!stored) return null;
      return JSON.parse(stored) as Session;
    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  },

  /**
   * Remove session from localStorage
   */
  remove(): void {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error('Failed to remove session:', error);
    }
  },

  /**
   * Check if session is expired
   */
  isExpired(session: Session): boolean {
    if (!session.expires_at) return false;
    return new Date(session.expires_at * 1000) < new Date();
  },
};

/**
 * Temporary session storage for unauthenticated users (teachers using direct links)
 */
const TEMP_SESSION_KEY = 'tripslip_temp_session';

export const tempSessionStorage = {
  /**
   * Save temporary session data
   */
  save(data: any): void {
    try {
      window.sessionStorage.setItem(TEMP_SESSION_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save temp session:', error);
    }
  },

  /**
   * Load temporary session data
   */
  load(): any | null {
    try {
      const stored = window.sessionStorage.getItem(TEMP_SESSION_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load temp session:', error);
      return null;
    }
  },

  /**
   * Remove temporary session data
   */
  remove(): void {
    try {
      window.sessionStorage.removeItem(TEMP_SESSION_KEY);
    } catch (error) {
      console.error('Failed to remove temp session:', error);
    }
  },
};
