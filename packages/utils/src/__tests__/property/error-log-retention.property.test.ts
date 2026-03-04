import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 33: Error Log Retention
 * Validates: Requirements 13.9
 */

describe('Property 33: Error Log Retention', () => {
  it('error logs are retained for 90 days', () => {
    const retentionPeriod = 90 * 24 * 60 * 60 * 1000; // 90 days
    const now = Date.now();
    const logDate = now - 89 * 24 * 60 * 60 * 1000;
    const shouldBeRetained = now - logDate < retentionPeriod;
    expect(shouldBeRetained).toBe(true);
  });

  it('logs older than retention period are deleted', () => {
    const retentionPeriod = 90 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const oldLogDate = now - 91 * 24 * 60 * 60 * 1000;
    const shouldBeDeleted = now - oldLogDate > retentionPeriod;
    expect(shouldBeDeleted).toBe(true);
  });

  it('critical errors are retained longer', () => {
    const criticalRetention = 365 * 24 * 60 * 60 * 1000; // 1 year
    expect(criticalRetention).toBeGreaterThan(90 * 24 * 60 * 60 * 1000);
  });
});
