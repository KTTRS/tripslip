import { describe, it, expect } from 'vitest';
import { logger, Logger } from '../index';

describe('Logger Integration', () => {
  it('should export logger from package index', () => {
    expect(logger).toBeDefined();
    expect(logger).toBeInstanceOf(Logger);
  });

  it('should export Logger class from package index', () => {
    expect(Logger).toBeDefined();
    const customLogger = new Logger();
    expect(customLogger).toBeInstanceOf(Logger);
  });

  it('should have all required methods', () => {
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.setLevel).toBe('function');
  });

  it('should not throw when calling logger methods', () => {
    expect(() => logger.debug('test')).not.toThrow();
    expect(() => logger.info('test')).not.toThrow();
    expect(() => logger.warn('test')).not.toThrow();
    expect(() => logger.error('test')).not.toThrow();
  });
});
