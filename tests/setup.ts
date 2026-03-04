/**
 * Global test setup for TripSlip monorepo
 * Runs before all tests to configure the testing environment
 */

import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import { testEnvironment } from '@tripslip/test-utils';

// Validate test environment before running tests
beforeAll(() => {
  try {
    testEnvironment.validateTestEnvironment();
  } catch (error) {
    console.error('Test environment validation failed:', error);
    process.exit(1);
  }
  
  // Log test environment info
  const envInfo = testEnvironment.getTestEnvironmentInfo();
  console.log('Test Environment Info:', envInfo);
  
  // Set up global mocks
  setupGlobalMocks();
  
  // Configure test timeouts
  if (envInfo.isCI) {
    // Increase timeouts in CI environment
    vi.setConfig({ testTimeout: 15000, hookTimeout: 15000 });
  }
});

// Clean up after all tests
afterAll(() => {
  vi.restoreAllMocks();
  vi.clearAllTimers();
  vi.useRealTimers();
});

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

// Clean up after each test
afterEach(() => {
  // Clear any DOM changes
  document.body.innerHTML = '';
  
  // Clear local/session storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Reset any global state
  vi.clearAllTimers();
});

// Set up global mocks
function setupGlobalMocks() {
  // Mock console methods to reduce noise in tests
  const originalConsole = { ...console };
  
  // Only mock in non-debug mode
  if (!process.env.DEBUG) {
    console.log = vi.fn();
    console.info = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
  }
  
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  
  // Mock window.ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
  
  // Mock window.IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
  
  // Mock window.MutationObserver
  global.MutationObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(() => []),
  }));
  
  // Mock window.scrollTo
  window.scrollTo = vi.fn();
  
  // Mock window.alert, confirm, prompt
  window.alert = vi.fn();
  window.confirm = vi.fn(() => true);
  window.prompt = vi.fn(() => 'test');
  
  // Mock URL.createObjectURL and revokeObjectURL
  URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  URL.revokeObjectURL = vi.fn();
  
  // Mock fetch if not already mocked
  if (!global.fetch) {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
        headers: new Headers(),
      } as Response)
    );
  }
  
  // Mock crypto.randomUUID
  if (!global.crypto) {
    global.crypto = {
      randomUUID: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
    } as any;
  }
  
  // Mock performance.now
  if (!global.performance) {
    global.performance = {
      now: vi.fn(() => Date.now()),
    } as any;
  }
  
  // Mock requestAnimationFrame and cancelAnimationFrame
  global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 16));
  global.cancelAnimationFrame = vi.fn(id => clearTimeout(id));
  
  // Mock requestIdleCallback and cancelIdleCallback
  global.requestIdleCallback = vi.fn(cb => setTimeout(cb, 1));
  global.cancelIdleCallback = vi.fn(id => clearTimeout(id));
  
  // Mock localStorage and sessionStorage
  const createMockStorage = () => {
    const storage: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => storage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete storage[key];
      }),
      clear: vi.fn(() => {
        Object.keys(storage).forEach(key => delete storage[key]);
      }),
      length: 0,
      key: vi.fn((index: number) => Object.keys(storage)[index] || null),
    };
  };
  
  if (!window.localStorage) {
    Object.defineProperty(window, 'localStorage', {
      value: createMockStorage(),
      writable: true,
    });
  }
  
  if (!window.sessionStorage) {
    Object.defineProperty(window, 'sessionStorage', {
      value: createMockStorage(),
      writable: true,
    });
  }
  
  // Mock HTMLCanvasElement.getContext
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(4),
    })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(4),
    })),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
  }));
  
  // Mock HTMLCanvasElement.toDataURL
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mock');
  
  // Mock HTMLMediaElement methods
  window.HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
  window.HTMLMediaElement.prototype.pause = vi.fn();
  window.HTMLMediaElement.prototype.load = vi.fn();
  
  // Mock File and FileReader
  if (!global.File) {
    global.File = class MockFile {
      name: string;
      size: number;
      type: string;
      lastModified: number;
      
      constructor(bits: any[], filename: string, options: any = {}) {
        this.name = filename;
        this.size = bits.reduce((acc, bit) => acc + (bit.length || 0), 0);
        this.type = options.type || '';
        this.lastModified = options.lastModified || Date.now();
      }
    } as any;
  }
  
  if (!global.FileReader) {
    global.FileReader = class MockFileReader {
      result: string | ArrayBuffer | null = null;
      error: any = null;
      readyState: number = 0;
      onload: ((event: any) => void) | null = null;
      onerror: ((event: any) => void) | null = null;
      onloadend: ((event: any) => void) | null = null;
      
      readAsText(file: File) {
        setTimeout(() => {
          this.result = 'mock file content';
          this.readyState = 2;
          if (this.onload) this.onload({ target: this });
          if (this.onloadend) this.onloadend({ target: this });
        }, 10);
      }
      
      readAsDataURL(file: File) {
        setTimeout(() => {
          this.result = 'data:text/plain;base64,bW9jayBmaWxlIGNvbnRlbnQ=';
          this.readyState = 2;
          if (this.onload) this.onload({ target: this });
          if (this.onloadend) this.onloadend({ target: this });
        }, 10);
      }
      
      abort() {
        this.readyState = 2;
      }
    } as any;
  }
}

// Global test utilities
declare global {
  var __TEST__: boolean;
  var __DEV__: boolean;
  var __PROD__: boolean;
}

// Export setup function for manual use
export { setupGlobalMocks };