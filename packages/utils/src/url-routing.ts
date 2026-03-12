export type Portal = 'landing' | 'venue' | 'teacher' | 'parent' | 'school';

const PORTAL_ENV_KEYS: Record<Portal, string> = {
  landing: 'VITE_LANDING_APP_URL',
  venue: 'VITE_VENUE_APP_URL',
  teacher: 'VITE_TEACHER_APP_URL',
  parent: 'VITE_PARENT_APP_URL',
  school: 'VITE_SCHOOL_APP_URL',
};

const PORTAL_PREFIXES: Record<Portal, string> = {
  landing: '',
  venue: '/venue',
  teacher: '/teacher',
  parent: '/parent',
  school: '/school',
};

function trimSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function normalizePath(path: string): string {
  if (!path) return '/';
  return path.startsWith('/') ? path : `/${path}`;
}

function readEnv(key: string): string | undefined {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const value = (import.meta as any).env[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }

  if (typeof process !== 'undefined' && process.env) {
    const value = process.env[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }

  return undefined;
}

export function getPortalBaseUrl(portal: Portal, currentOrigin?: string): string {
  const envKey = PORTAL_ENV_KEYS[portal];
  const configured = readEnv(envKey);
  if (configured) {
    return trimSlash(configured);
  }

  const origin = trimSlash(
    currentOrigin ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
  );

  const prefix = PORTAL_PREFIXES[portal];
  return prefix ? `${origin}${prefix}` : origin;
}

export function buildPortalUrl(portal: Portal, path: string, currentOrigin?: string): string {
  const base = getPortalBaseUrl(portal, currentOrigin);
  const normalizedPath = normalizePath(path);

  // If path already contains portal prefix in fallback mode, avoid duplicating it.
  const portalPrefix = PORTAL_PREFIXES[portal];
  if (!readEnv(PORTAL_ENV_KEYS[portal]) && portalPrefix && normalizedPath.startsWith(portalPrefix + '/')) {
    return `${trimSlash(currentOrigin || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'))}${normalizedPath}`;
  }

  return `${base}${normalizedPath}`;
}

export function buildParentTripUrl(token: string, currentOrigin?: string): string {
  return buildPortalUrl('parent', `/trip/${token}`, currentOrigin);
}

export function buildTeacherTripReviewUrl(token: string, currentOrigin?: string): string {
  return buildPortalUrl('teacher', `/trip/${token}/review`, currentOrigin);
}

export function buildTeacherSignupUrl(email: string, currentOrigin?: string): string {
  return buildPortalUrl('teacher', `/signup?email=${encodeURIComponent(email)}`, currentOrigin);
}
