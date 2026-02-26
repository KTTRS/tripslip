// Monitoring and logging utilities

export interface ErrorLog {
  message: string
  stack?: string
  timestamp: Date
  userAgent: string
  url: string
  userId?: string
  severity: 'error' | 'warning' | 'info'
}

export class Monitor {
  private static instance: Monitor
  private errors: ErrorLog[] = []

  private constructor() {
    this.setupGlobalErrorHandler()
    this.setupUnhandledRejectionHandler()
  }

  static getInstance(): Monitor {
    if (!Monitor.instance) {
      Monitor.instance = new Monitor()
    }
    return Monitor.instance
  }

  private setupGlobalErrorHandler() {
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        stack: event.error?.stack,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        severity: 'error'
      })
    })
  }

  private setupUnhandledRejectionHandler() {
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        severity: 'error'
      })
    })
  }

  logError(error: ErrorLog) {
    this.errors.push(error)
    console.error('[Monitor]', error)

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorService(error)
    }
  }

  private async sendToErrorService(error: ErrorLog) {
    try {
      // Example: Send to Sentry, LogRocket, or custom endpoint
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error)
      })
    } catch (e) {
      console.error('Failed to send error to service:', e)
    }
  }

  getErrors(): ErrorLog[] {
    return [...this.errors]
  }

  clearErrors() {
    this.errors = []
  }
}

// Web Vitals monitoring
export function measureWebVitals() {
  if (typeof window === 'undefined') return

  // Largest Contentful Paint (LCP)
  new PerformanceObserver((list) => {
    const entries = list.getEntries()
    const lastEntry = entries[entries.length - 1]
    console.log('[Web Vitals] LCP:', lastEntry.renderTime || lastEntry.loadTime)
  }).observe({ entryTypes: ['largest-contentful-paint'] })

  // First Input Delay (FID)
  new PerformanceObserver((list) => {
    const entries = list.getEntries()
    entries.forEach((entry: any) => {
      console.log('[Web Vitals] FID:', entry.processingStart - entry.startTime)
    })
  }).observe({ entryTypes: ['first-input'] })

  // Cumulative Layout Shift (CLS)
  let clsScore = 0
  new PerformanceObserver((list) => {
    const entries = list.getEntries()
    entries.forEach((entry: any) => {
      if (!entry.hadRecentInput) {
        clsScore += entry.value
      }
    })
    console.log('[Web Vitals] CLS:', clsScore)
  }).observe({ entryTypes: ['layout-shift'] })
}

// Performance marks
export function mark(name: string) {
  performance.mark(name)
}

export function measure(name: string, startMark: string, endMark?: string) {
  try {
    if (endMark) {
      performance.measure(name, startMark, endMark)
    } else {
      performance.measure(name, startMark)
    }
    const measure = performance.getEntriesByName(name)[0]
    console.log(`[Performance] ${name}: ${measure.duration.toFixed(2)}ms`)
  } catch (e) {
    console.error('Failed to measure performance:', e)
  }
}
