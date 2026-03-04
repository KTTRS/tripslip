import { randomBytes } from 'crypto';

export const generateCSRFToken = (): string => {
  return randomBytes(32).toString('hex');
};

export const validateCSRFToken = (token: string, storedToken: string): boolean => {
  return token === storedToken && token.length === 64;
};

export const setCSRFCookie = (token: string): void => {
  document.cookie = `csrf_token=${token}; SameSite=Strict; Secure; Path=/`;
};

export const getCSRFToken = (): string | null => {
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? match[1] : null;
};
