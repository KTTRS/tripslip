/**
 * Mock helpers for testing
 * Provides utilities for creating and managing mocks
 */

import { vi } from 'vitest';

// Mock function helpers
export const mockHelpers = {
  // Create a mock function with return values
  createMockWithReturnValues: <T>(returnValues: T[]) => {
    const mock = vi.fn();
    returnValues.forEach((value, index) => {
      mock.mockReturnValueOnce(value);
    });
    return mock;
  },
  
  // Create a mock function with resolved promises
  createMockWithResolvedValues: <T>(resolvedValues: T[]) => {
    const mock = vi.fn();
    resolvedValues.forEach((value, index) => {
      mock.mockResolvedValueOnce(value);
    });
    return mock;
  },
  
  // Create a mock function with rejected promises
  createMockWithRejectedValues: (rejectedValues: (Error | string)[]) => {
    const mock = vi.fn();
    rejectedValues.forEach((value, index) => {
      mock.mockRejectedValueOnce(value);
    });
    return mock;
  },
  
  // Create a mock function that alternates between success and failure
  createAlternatingMock: <T>(successValue: T, errorValue: Error | string) => {
    let callCount = 0;
    return vi.fn(() => {
      callCount++;
      if (callCount % 2 === 1) {
        return Promise.resolve(successValue);
      } else {
        return Promise.reject(errorValue);
      }
    });
  },
  
  // Create a mock function that fails after N successful calls
  createFailAfterNMock: <T>(successValue: T, errorValue: Error | string, n: number) => {
    let callCount = 0;
    return vi.fn(() => {
      callCount++;
      if (callCount <= n) {
        return Promise.resolve(successValue);
      } else {
        return Promise.reject(errorValue);
      }
    });
  },
  
  // Create a mock function with delay
  createDelayedMock: <T>(value: T, delay: number) => {
    return vi.fn(() => {
      return new Promise<T>(resolve => {
        setTimeout(() => resolve(value), delay);
      });
    });
  },
  
  // Create a mock function that tracks call order
  createOrderTrackingMock: (name: string, orderTracker: string[]) => {
    return vi.fn((...args) => {
      orderTracker.push(name);
      return Promise.resolve();
    });
  },
  
  // Create a spy on object method
  createSpy: <T extends object, K extends keyof T>(
    object: T,
    method: K
  ) => {
    return vi.spyOn(object, method);
  },
  
  // Create multiple spies on object methods
  createSpies: <T extends object>(
    object: T,
    methods: (keyof T)[]
  ) => {
    const spies: Record<string, any> = {};
    methods.forEach(method => {
      spies[method as string] = vi.spyOn(object, method);
    });
    return spies;
  },
  
  // Restore all mocks
  restoreAllMocks: () => {
    vi.restoreAllMocks();
  },
  
  // Clear all mocks
  clearAllMocks: () => {
    vi.clearAllMocks();
  },
  
  // Reset all mocks
  resetAllMocks: () => {
    vi.resetAllMocks();
  },
};

// Module mocking helpers
export const moduleHelpers = {
  // Mock entire module
  mockModule: (modulePath: string, mockImplementation: any) => {
    vi.mock(modulePath, () => mockImplementation);
  },
  
  // Mock module with factory
  mockModuleWithFactory: (modulePath: string, factory: () => any) => {
    vi.mock(modulePath, factory);
  },
  
  // Mock default export
  mockDefaultExport: (modulePath: string, mockImplementation: any) => {
    vi.mock(modulePath, () => ({
      default: mockImplementation,
    }));
  },
  
  // Mock named exports
  mockNamedExports: (modulePath: string, exports: Record<string, any>) => {
    vi.mock(modulePath, () => exports);
  },
  
  // Mock partial module (keep some real exports)
  mockPartialModule: (modulePath: string, mocks: Record<string, any>) => {
    vi.mock(modulePath, async () => {
      const actual = await vi.importActual(modulePath);
      return {
        ...actual,
        ...mocks,
      };
    });
  },
  
  // Unmock module
  unmockModule: (modulePath: string) => {
    vi.unmock(modulePath);
  },
  
  // Dynamic import mock
  mockDynamicImport: (modulePath: string, mockImplementation: any) => {
    vi.mock(modulePath, () => ({
      default: mockImplementation,
    }));
  },
};

// Timer mocking helpers
export const timerHelpers = {
  // Use fake timers
  useFakeTimers: () => {
    vi.useFakeTimers();
  },
  
  // Use real timers
  useRealTimers: () => {
    vi.useRealTimers();
  },
  
  // Advance timers by time
  advanceTimersByTime: (ms: number) => {
    vi.advanceTimersByTime(ms);
  },
  
  // Advance to next timer
  advanceTimersToNextTimer: () => {
    vi.advanceTimersToNextTimer();
  },
  
  // Run all timers
  runAllTimers: () => {
    vi.runAllTimers();
  },
  
  // Run only pending timers
  runOnlyPendingTimers: () => {
    vi.runOnlyPendingTimers();
  },
  
  // Clear all timers
  clearAllTimers: () => {
    vi.clearAllTimers();
  },
  
  // Get timer count
  getTimerCount: () => {
    return vi.getTimerCount();
  },
  
  // Set system time
  setSystemTime: (time: Date | number | string) => {
    vi.setSystemTime(time);
  },
  
  // Get real system time
  getRealSystemTime: () => {
    return vi.getRealSystemTime();
  },
};

// Global mocking helpers
export const globalHelpers = {
  // Mock global variable
  mockGlobal: (name: string, value: any) => {
    const originalValue = (global as any)[name];
    (global as any)[name] = value;
    
    return () => {
      (global as any)[name] = originalValue;
    };
  },
  
  // Mock window property
  mockWindowProperty: (property: string, value: any) => {
    const originalValue = (window as any)[property];
    Object.defineProperty(window, property, {
      value,
      writable: true,
      configurable: true,
    });
    
    return () => {
      Object.defineProperty(window, property, {
        value: originalValue,
        writable: true,
        configurable: true,
      });
    };
  },
  
  // Mock document property
  mockDocumentProperty: (property: string, value: any) => {
    const originalValue = (document as any)[property];
    Object.defineProperty(document, property, {
      value,
      writable: true,
      configurable: true,
    });
    
    return () => {
      Object.defineProperty(document, property, {
        value: originalValue,
        writable: true,
        configurable: true,
      });
    };
  },
  
  // Mock console methods
  mockConsole: () => {
    const originalConsole = { ...console };
    
    console.log = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
    console.info = vi.fn();
    console.debug = vi.fn();
    
    return () => {
      Object.assign(console, originalConsole);
    };
  },
  
  // Mock fetch
  mockFetch: (responses: Array<{ url?: string; response: any; status?: number }>) => {
    const mockFetch = vi.fn();
    
    responses.forEach(({ url, response, status = 200 }) => {
      const mockResponse = {
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(response),
        text: () => Promise.resolve(JSON.stringify(response)),
        headers: new Headers(),
      };
      
      if (url) {
        mockFetch.mockImplementation((requestUrl: string) => {
          if (requestUrl.includes(url)) {
            return Promise.resolve(mockResponse);
          }
          return Promise.reject(new Error(`Unexpected URL: ${requestUrl}`));
        });
      } else {
        mockFetch.mockResolvedValue(mockResponse);
      }
    });
    
    global.fetch = mockFetch;
    
    return () => {
      vi.restoreAllMocks();
    };
  },
  
  // Mock localStorage
  mockLocalStorage: () => {
    const storage: Record<string, string> = {};
    
    const mockStorage = {
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
    
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
    });
    
    return mockStorage;
  },
  
  // Mock sessionStorage
  mockSessionStorage: () => {
    const storage: Record<string, string> = {};
    
    const mockStorage = {
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
    
    Object.defineProperty(window, 'sessionStorage', {
      value: mockStorage,
      writable: true,
    });
    
    return mockStorage;
  },
  
  // Mock URL
  mockURL: () => {
    const originalURL = window.URL;
    
    window.URL = class MockURL {
      href: string;
      origin: string;
      protocol: string;
      host: string;
      hostname: string;
      port: string;
      pathname: string;
      search: string;
      hash: string;
      
      constructor(url: string, base?: string) {
        this.href = url;
        this.origin = 'http://localhost:3000';
        this.protocol = 'http:';
        this.host = 'localhost:3000';
        this.hostname = 'localhost';
        this.port = '3000';
        this.pathname = '/';
        this.search = '';
        this.hash = '';
      }
      
      toString() {
        return this.href;
      }
      
      static createObjectURL = vi.fn(() => 'blob:mock-url');
      static revokeObjectURL = vi.fn();
    } as any;
    
    return () => {
      window.URL = originalURL;
    };
  },
  
  // Mock IntersectionObserver
  mockIntersectionObserver: () => {
    const mockIntersectionObserver = vi.fn();
    mockIntersectionObserver.mockReturnValue({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    });
    
    window.IntersectionObserver = mockIntersectionObserver;
    
    return mockIntersectionObserver;
  },
  
  // Mock ResizeObserver
  mockResizeObserver: () => {
    const mockResizeObserver = vi.fn();
    mockResizeObserver.mockReturnValue({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    });
    
    window.ResizeObserver = mockResizeObserver;
    
    return mockResizeObserver;
  },
  
  // Mock MutationObserver
  mockMutationObserver: () => {
    const mockMutationObserver = vi.fn();
    mockMutationObserver.mockReturnValue({
      observe: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: vi.fn(() => []),
    });
    
    window.MutationObserver = mockMutationObserver;
    
    return mockMutationObserver;
  },
};

// API mocking helpers
export const apiHelpers = {
  // Create REST API mock
  createRestApiMock: (baseUrl: string, endpoints: Record<string, any>) => {
    const mockFetch = vi.fn();
    
    Object.entries(endpoints).forEach(([endpoint, response]) => {
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes(`${baseUrl}${endpoint}`)) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(response),
            text: () => Promise.resolve(JSON.stringify(response)),
            headers: new Headers(),
          });
        }
        
        return Promise.reject(new Error(`Unexpected API call: ${url}`));
      });
    });
    
    global.fetch = mockFetch;
    return mockFetch;
  },
  
  // Create GraphQL API mock
  createGraphQLMock: (endpoint: string, queries: Record<string, any>) => {
    const mockFetch = vi.fn();
    
    mockFetch.mockImplementation((url: string, options?: RequestInit) => {
      if (url === endpoint && options?.method === 'POST') {
        const body = JSON.parse(options.body as string);
        const queryName = body.operationName || 'unknown';
        
        if (queries[queryName]) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ data: queries[queryName] }),
            text: () => Promise.resolve(JSON.stringify({ data: queries[queryName] })),
            headers: new Headers(),
          });
        }
      }
      
      return Promise.reject(new Error(`Unexpected GraphQL query: ${url}`));
    });
    
    global.fetch = mockFetch;
    return mockFetch;
  },
  
  // Mock API with delays
  createDelayedApiMock: (responses: Array<{ url: string; response: any; delay: number }>) => {
    const mockFetch = vi.fn();
    
    responses.forEach(({ url, response, delay }) => {
      mockFetch.mockImplementation((requestUrl: string) => {
        if (requestUrl.includes(url)) {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve(response),
                text: () => Promise.resolve(JSON.stringify(response)),
                headers: new Headers(),
              });
            }, delay);
          });
        }
        
        return Promise.reject(new Error(`Unexpected URL: ${requestUrl}`));
      });
    });
    
    global.fetch = mockFetch;
    return mockFetch;
  },
};