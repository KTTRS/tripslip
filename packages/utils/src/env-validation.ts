/**
 * Environment Variable Validation Utility
 * 
 * Validates required and optional environment variables at application startup
 * to prevent runtime failures and provide clear error messages.
 */

export interface EnvConfig {
  required: string[];
  optional?: string[];
}

/**
 * Validates environment variables based on the provided configuration.
 * Throws an error if any required variables are missing.
 * Logs warnings for missing optional variables.
 * 
 * @param config - Configuration object specifying required and optional env vars
 * @throws Error if any required environment variables are missing
 */
export function validateEnv(config: EnvConfig): void {
  // Helper function to get env var from either process.env or import.meta.env
  const getEnvVar = (key: string): string | undefined => {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
    // For Vite environments
    if (typeof globalThis !== 'undefined' && (globalThis as any).import?.meta?.env) {
      return (globalThis as any).import.meta.env[key];
    }
    return undefined;
  };

  const missing = config.required.filter(
    key => !getEnvVar(key) || getEnvVar(key) === ''
  );

  if (missing.length > 0) {
    const error = new Error(
      `Missing required environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}\n\n` +
      `Please check your .env file and ensure all required variables are set.`
    );
    console.error(error.message);
    throw error;
  }

  // Warn about optional missing vars
  const missingOptional = (config.optional || []).filter(
    key => !getEnvVar(key)
  );
  
  if (missingOptional.length > 0) {
    console.warn(
      `Optional environment variables not set:\n${missingOptional.map(k => `  - ${k}`).join('\n')}`
    );
  }
}

/**
 * Environment configuration for the Landing app
 */
export const LANDING_APP_ENV: EnvConfig = {
  required: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_LANDING_APP_URL'
  ],
  optional: ['VITE_SENTRY_DSN', 'VITE_GOOGLE_ANALYTICS_ID']
};

/**
 * Environment configuration for the Venue app
 */
export const VENUE_APP_ENV: EnvConfig = {
  required: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_STRIPE_PUBLISHABLE_KEY',
    'VITE_VENUE_APP_URL'
  ],
  optional: ['VITE_SENTRY_DSN', 'VITE_GOOGLE_MAPS_API_KEY']
};

/**
 * Environment configuration for the School app
 */
export const SCHOOL_APP_ENV: EnvConfig = {
  required: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_SCHOOL_APP_URL'
  ],
  optional: ['VITE_SENTRY_DSN']
};

/**
 * Environment configuration for the Teacher app
 */
export const TEACHER_APP_ENV: EnvConfig = {
  required: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_STRIPE_PUBLISHABLE_KEY',
    'VITE_TEACHER_APP_URL'
  ],
  optional: ['VITE_GOOGLE_MAPS_API_KEY', 'VITE_SENTRY_DSN']
};

/**
 * Environment configuration for the Parent app
 */
export const PARENT_APP_ENV: EnvConfig = {
  required: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_STRIPE_PUBLISHABLE_KEY',
    'VITE_PARENT_APP_URL'
  ],
  optional: ['VITE_SENTRY_DSN']
};
