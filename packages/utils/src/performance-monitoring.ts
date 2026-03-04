/**
 * Performance Monitoring Utilities
 * Track and report performance metrics
 */

import { onCLS, onFID, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';

export interface PerformanceMetrics {
  cls: number;
  fid: number;
  fcp: number;
  lcp: number;
  ttfb: number;
  timestamp: number;
  url: string;
  userAgent: string;
}

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring(
  onMetric?: (metric: Metric) => void
): void {
  const sendMetric = (metric: Metric) => {
    // Send to analytics
    if (onMetric) {
      onMetric(metric);
    }

    // Send to monitoring service
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const body = JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });

      navigator.sendBeacon('/api/metrics', body);
    }
  };

  // Track Core Web Vitals
  onCLS(sendMetric);
  onFID(sendMetric);
  onFCP(sendMetric);
  onLCP(sendMetric);
  onTTFB(sendMetric);
}

/**
 * Measure function execution time
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T
): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;

  console.debug(`[Performance] ${name}: ${duration.toFixed(2)}ms`);

  // Report if slow
  if (duration > 100) {
    console.warn(`[Performance] Slow operation: ${name} took ${duration.toFixed(2)}ms`);
  }

  return result;
}

/**
 * Measure async function execution time
 */
export async function measurePerformanceAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  console.debug(`[Performance] ${name}: ${duration.toFixed(2)}ms`);

  // Report if slow
  if (duration > 200) {
    console.warn(`[Performance] Slow async operation: ${name} took ${duration.toFixed(2)}ms`);
  }

  return result;
}

/**
 * Create a performance mark
 */
export function mark(name: string): void {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name);
  }
}

/**
 * Measure between two marks
 */
export function measure(
  name: string,
  startMark: string,
  endMark: string
): number | null {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      performance.measure(name, startMark, endMark);
      const entries = performance.getEntriesByName(name);
      if (entries.length > 0) {
        return entries[0].duration;
      }
    } catch (error) {
      console.error('Performance measurement error:', error);
    }
  }
  return null;
}

/**
 * Get navigation timing
 */
export function getNavigationTiming(): PerformanceNavigationTiming | null {
  if (typeof performance !== 'undefined' && performance.getEntriesByType) {
    const entries = performance.getEntriesByType('navigation');
    if (entries.length > 0) {
      return entries[0] as PerformanceNavigationTiming;
    }
  }
  return null;
}

/**
 * Get resource timing
 */
export function getResourceTiming(): PerformanceResourceTiming[] {
  if (typeof performance !== 'undefined' && performance.getEntriesByType) {
    return performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  }
  return [];
}

/**
 * Report slow resources
 */
export function reportSlowResources(threshold: number = 1000): void {
  const resources = getResourceTiming();
  const slowResources = resources.filter(
    (resource) => resource.duration > threshold
  );

  if (slowResources.length > 0) {
    console.warn('[Performance] Slow resources detected:', slowResources);
    slowResources.forEach((resource) => {
      console.warn(
        `  - ${resource.name}: ${resource.duration.toFixed(2)}ms`
      );
    });
  }
}

/**
 * Memory usage monitoring
 */
export function getMemoryUsage(): {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
} | null {
  if (
    typeof performance !== 'undefined' &&
    'memory' in performance &&
    performance.memory
  ) {
    const memory = performance.memory as any;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }
  return null;
}

/**
 * Monitor memory usage
 */
export function monitorMemoryUsage(interval: number = 10000): () => void {
  const intervalId = setInterval(() => {
    const memory = getMemoryUsage();
    if (memory) {
      const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
      const totalMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
      const limitMB = (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2);

      console.debug(
        `[Memory] Used: ${usedMB}MB / Total: ${totalMB}MB / Limit: ${limitMB}MB`
      );

      // Warn if memory usage is high
      const usagePercent =
        (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      if (usagePercent > 80) {
        console.warn(
          `[Memory] High memory usage: ${usagePercent.toFixed(1)}%`
        );
      }
    }
  }, interval);

  // Return cleanup function
  return () => clearInterval(intervalId);
}

/**
 * Long task monitoring
 */
export function monitorLongTasks(
  callback: (entry: PerformanceEntry) => void
): () => void {
  if (
    typeof PerformanceObserver !== 'undefined' &&
    PerformanceObserver.supportedEntryTypes?.includes('longtask')
  ) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        callback(entry);
        console.warn(
          `[Performance] Long task detected: ${entry.duration.toFixed(2)}ms`
        );
      }
    });

    observer.observe({ entryTypes: ['longtask'] });

    return () => observer.disconnect();
  }

  return () => {};
}

/**
 * Layout shift monitoring
 */
export function monitorLayoutShifts(
  callback: (entry: PerformanceEntry) => void
): () => void {
  if (
    typeof PerformanceObserver !== 'undefined' &&
    PerformanceObserver.supportedEntryTypes?.includes('layout-shift')
  ) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as any;
        if (!layoutShift.hadRecentInput) {
          callback(entry);
          if (layoutShift.value > 0.1) {
            console.warn(
              `[Performance] Significant layout shift: ${layoutShift.value.toFixed(4)}`
            );
          }
        }
      }
    });

    observer.observe({ entryTypes: ['layout-shift'] });

    return () => observer.disconnect();
  }

  return () => {};
}

/**
 * Network information
 */
export function getNetworkInformation(): {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
} | null {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };
  }
  return null;
}

/**
 * Adaptive loading based on network
 */
export function shouldLoadHighQuality(): boolean {
  const network = getNetworkInformation();
  if (!network) return true; // Default to high quality if unknown

  // Load high quality on 4G and above
  return network.effectiveType === '4g' && !network.saveData;
}

/**
 * Performance budget checker
 */
export interface PerformanceBudget {
  lcp: number; // ms
  fid: number; // ms
  cls: number; // score
  fcp: number; // ms
  ttfb: number; // ms
  bundleSize: number; // KB
}

export const DEFAULT_PERFORMANCE_BUDGET: PerformanceBudget = {
  lcp: 2500,
  fid: 100,
  cls: 0.1,
  fcp: 1800,
  ttfb: 600,
  bundleSize: 200,
};

export function checkPerformanceBudget(
  metrics: Partial<PerformanceMetrics>,
  budget: PerformanceBudget = DEFAULT_PERFORMANCE_BUDGET
): { passed: boolean; violations: string[] } {
  const violations: string[] = [];

  if (metrics.lcp && metrics.lcp > budget.lcp) {
    violations.push(`LCP: ${metrics.lcp}ms exceeds budget of ${budget.lcp}ms`);
  }

  if (metrics.fid && metrics.fid > budget.fid) {
    violations.push(`FID: ${metrics.fid}ms exceeds budget of ${budget.fid}ms`);
  }

  if (metrics.cls && metrics.cls > budget.cls) {
    violations.push(`CLS: ${metrics.cls} exceeds budget of ${budget.cls}`);
  }

  if (metrics.fcp && metrics.fcp > budget.fcp) {
    violations.push(`FCP: ${metrics.fcp}ms exceeds budget of ${budget.fcp}ms`);
  }

  if (metrics.ttfb && metrics.ttfb > budget.ttfb) {
    violations.push(`TTFB: ${metrics.ttfb}ms exceeds budget of ${budget.ttfb}ms`);
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}
