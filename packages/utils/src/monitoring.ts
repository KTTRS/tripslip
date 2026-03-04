import * as Sentry from '@sentry/react';

export interface MonitoringConfig {
  dsn: string;
  environment: 'development' | 'staging' | 'production';
  release?: string;
  tracesSampleRate?: number;
}

export interface ErrorContext {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  appName?: string;
  route?: string;
  requestId?: string;
  sessionId?: string;
  timestamp?: string;
  userAgent?: string;
  url?: string;
  referrer?: string;
  [key: string]: any;
}

export interface RequestResponseContext {
  method?: string;
  url?: string;
  statusCode?: number;
  requestBody?: any;
  responseBody?: any;
  headers?: Record<string, string>;
  duration?: number;
}

export const initMonitoring = (config: MonitoringConfig) => {
  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    tracesSampleRate: config.tracesSampleRate || 0.1,
    integrations: [
      // Note: BrowserTracing and Replay integrations may need to be imported separately
      // new Sentry.BrowserTracing(),
      // new Sentry.Replay({
      //   maskAllText: true,
      //   blockAllMedia: true,
      // }),
    ],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      // Add environment context to all events
      if (event.extra) {
        event.extra.environment = {
          userAgent: navigator.userAgent,
          url: window.location.href,
          referrer: document.referrer,
          timestamp: new Date().toISOString(),
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
        };
      }
      return event;
    },
  });
};

export const captureError = (error: Error, context?: ErrorContext) => {
  // Set user context if provided
  if (context?.userId) {
    Sentry.setUser({
      id: context.userId,
      email: context.userEmail,
      username: context.userEmail,
    });
  }

  // Add tags for filtering
  const tags: Record<string, string> = {};
  if (context?.appName) tags.app = context.appName;
  if (context?.userRole) tags.role = context.userRole;
  if (context?.route) tags.route = context.route;

  Sentry.withScope((scope) => {
    // Set tags
    Object.entries(tags).forEach(([key, value]) => {
      scope.setTag(key, value);
    });

    // Set context
    if (context) {
      scope.setContext('error_context', context);
    }

    // Set level based on error type
    if (error.name === 'ValidationError') {
      scope.setLevel('warning');
    } else if (error.name === 'NetworkError') {
      scope.setLevel('error');
    } else if (error.name === 'PaymentError') {
      scope.setLevel('fatal');
    }

    Sentry.captureException(error);
  });
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info', context?: ErrorContext) => {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('message_context', context);
      
      // Add tags
      if (context.appName) scope.setTag('app', context.appName);
      if (context.userRole) scope.setTag('role', context.userRole);
      if (context.route) scope.setTag('route', context.route);
    }

    Sentry.captureMessage(message, level);
  });
};

export const setUser = (user: { id: string; email?: string; username?: string; role?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username || user.email,
  });

  // Add user role as tag for filtering
  if (user.role) {
    Sentry.setTag('user_role', user.role);
  }
};

export const addBreadcrumb = (breadcrumb: Sentry.Breadcrumb) => {
  Sentry.addBreadcrumb(breadcrumb);
};

export const addUserActionBreadcrumb = (action: string, data?: Record<string, any>) => {
  Sentry.addBreadcrumb({
    message: `User action: ${action}`,
    category: 'user',
    level: 'info',
    data,
    timestamp: Date.now() / 1000,
  });
};

export const addNavigationBreadcrumb = (from: string, to: string) => {
  Sentry.addBreadcrumb({
    message: `Navigation: ${from} → ${to}`,
    category: 'navigation',
    level: 'info',
    data: { from, to },
    timestamp: Date.now() / 1000,
  });
};

export const addApiRequestBreadcrumb = (context: RequestResponseContext) => {
  Sentry.addBreadcrumb({
    message: `API ${context.method} ${context.url}`,
    category: 'http',
    level: context.statusCode && context.statusCode >= 400 ? 'error' : 'info',
    data: {
      method: context.method,
      url: context.url,
      status_code: context.statusCode,
      duration: context.duration,
    },
    timestamp: Date.now() / 1000,
  });
};

export const captureApiError = (error: Error, context: RequestResponseContext & ErrorContext) => {
  // Add API-specific context
  const apiContext = {
    ...context,
    api_request: {
      method: context.method,
      url: context.url,
      status_code: context.statusCode,
      duration: context.duration,
    },
  };

  // Sanitize request/response bodies (remove sensitive data)
  if (context.requestBody) {
    apiContext.requestBody = sanitizeApiData(context.requestBody);
  }
  if (context.responseBody) {
    apiContext.responseBody = sanitizeApiData(context.responseBody);
  }

  captureError(error, apiContext);
};

export const setAppContext = (appName: string, version?: string) => {
  Sentry.setTag('app_name', appName);
  if (version) {
    Sentry.setTag('app_version', version);
  }

  Sentry.setContext('app', {
    name: appName,
    version,
    build_time: process.env.VITE_BUILD_TIME,
    commit_hash: process.env.VITE_COMMIT_HASH,
  });
};

export const startTransaction = (name: string, op: string) => {
  // Note: startTransaction is deprecated in newer Sentry versions
  // Consider using Sentry.startSpan or Sentry.withActiveSpan instead
  return {
    name,
    op,
    finish: () => {},
    setTag: () => {},
    setData: () => {}
  } as any;
};

export const addPerformanceContext = (context: {
  loadTime?: number;
  renderTime?: number;
  apiCalls?: number;
  cacheHits?: number;
  memoryUsage?: number;
}) => {
  Sentry.setContext('performance', context);
};

// Helper function to sanitize API data (remove sensitive information)
function sanitizeApiData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'cookie',
    'session',
    'credit_card',
    'ssn',
    'social_security',
  ];

  const sanitized = { ...data };

  const sanitizeObject = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          result[key] = '[REDACTED]';
        } else {
          result[key] = sanitizeObject(value);
        }
      }
      return result;
    }

    return obj;
  };

  return sanitizeObject(sanitized);
}
