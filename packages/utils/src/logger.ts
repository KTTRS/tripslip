import { captureMessage, captureError, addBreadcrumb } from './monitoring';
import type * as Sentry from '@sentry/react';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Production-ready logger that uses console in development and Sentry in production.
 * Provides structured logging with breadcrumbs for debugging.
 */
export class Logger {
  private isDevelopment: boolean;

  constructor() {
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

    this.isDevelopment = getEnvVar('DEV') === 'true' || getEnvVar('MODE') === 'development';
  }

  /**
   * Log debug information (development only)
   * @param message - Debug message
   * @param context - Additional context data
   */
  debug(message: string, context?: Record<string, any>): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context || '');
    }
    
    // Add breadcrumb for debugging context
    addBreadcrumb({
      message,
      level: 'debug' as Sentry.SeverityLevel,
      data: context,
    });
  }

  /**
   * Log informational messages
   * @param message - Info message
   * @param context - Additional context data
   */
  info(message: string, context?: Record<string, any>): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, context || '');
    }
    
    // Send to Sentry in production
    if (!this.isDevelopment) {
      captureMessage(message, 'info');
    }
    
    addBreadcrumb({
      message,
      level: 'info' as Sentry.SeverityLevel,
      data: context,
    });
  }

  /**
   * Log warning messages
   * @param message - Warning message
   * @param context - Additional context data
   */
  warn(message: string, context?: Record<string, any>): void {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, context || '');
    }
    
    // Send to Sentry in production
    if (!this.isDevelopment) {
      captureMessage(message, 'warning');
    }
    
    addBreadcrumb({
      message,
      level: 'warning' as Sentry.SeverityLevel,
      data: context,
    });
  }

  /**
   * Log error messages
   * @param message - Error message
   * @param error - Error object (optional)
   * @param context - Additional context data
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, error || '', context || '');
    }
    
    // Send to Sentry in production
    if (!this.isDevelopment) {
      if (error) {
        captureError(error, { ...context, message });
      } else {
        captureMessage(message, 'error');
      }
    }
    
    addBreadcrumb({
      message,
      level: 'error' as Sentry.SeverityLevel,
      data: { ...context, error: error?.message },
    });
  }

  /**
   * Set the current log level (for future filtering if needed)
   * @param level - Minimum log level to capture
   */
  setLevel(level: LogLevel): void {
    // Future implementation for log level filtering
    addBreadcrumb({
      message: `Log level set to ${level}`,
      level: 'info' as Sentry.SeverityLevel,
    });
  }
}

/**
 * Singleton logger instance for use throughout the application
 */
export const logger = new Logger();
