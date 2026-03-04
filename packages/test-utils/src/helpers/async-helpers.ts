/**
 * Async testing helpers
 * Provides utilities for testing asynchronous operations
 */

import { vi } from 'vitest';
import { waitFor } from '@testing-library/react';

// Promise and async operation helpers
export const asyncHelpers = {
  // Wait for a condition to be true
  waitForCondition: async (
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const result = await condition();
      if (result) {
        return;
      }
      await asyncHelpers.delay(interval);
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  },
  
  // Create a delay
  delay: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  // Create a resolved promise
  resolvedPromise: <T>(value: T): Promise<T> => {
    return Promise.resolve(value);
  },
  
  // Create a rejected promise
  rejectedPromise: (error: Error | string): Promise<never> => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    return Promise.reject(errorObj);
  },
  
  // Create a promise that resolves after a delay
  delayedResolve: <T>(value: T, delay: number): Promise<T> => {
    return new Promise(resolve => {
      setTimeout(() => resolve(value), delay);
    });
  },
  
  // Create a promise that rejects after a delay
  delayedReject: (error: Error | string, delay: number): Promise<never> => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    return new Promise((_, reject) => {
      setTimeout(() => reject(errorObj), delay);
    });
  },
  
  // Test async function with timeout
  withTimeout: async <T>(
    asyncFn: () => Promise<T>,
    timeout: number = 5000
  ): Promise<T> => {
    return Promise.race([
      asyncFn(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout);
      }),
    ]);
  },
  
  // Retry async operation
  retry: async <T>(
    asyncFn: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await asyncFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxAttempts) {
          throw lastError;
        }
        
        await asyncHelpers.delay(delay);
      }
    }
    
    throw lastError!;
  },
  
  // Test concurrent operations
  concurrent: async <T>(
    operations: Array<() => Promise<T>>
  ): Promise<T[]> => {
    return Promise.all(operations.map(op => op()));
  },
  
  // Test sequential operations
  sequential: async <T>(
    operations: Array<() => Promise<T>>
  ): Promise<T[]> => {
    const results: T[] = [];
    
    for (const operation of operations) {
      const result = await operation();
      results.push(result);
    }
    
    return results;
  },
  
  // Mock async function with controllable resolution
  createControllablePromise: <T>() => {
    let resolve: (value: T) => void;
    let reject: (error: Error) => void;
    
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    
    return {
      promise,
      resolve: resolve!,
      reject: reject!,
    };
  },
  
  // Test promise cancellation
  createCancellablePromise: <T>(
    asyncFn: (signal: AbortSignal) => Promise<T>
  ) => {
    const controller = new AbortController();
    const promise = asyncFn(controller.signal);
    
    return {
      promise,
      cancel: () => controller.abort(),
      signal: controller.signal,
    };
  },
};

// Mock async service helpers
export const mockAsyncService = {
  // Create a mock service that resolves after delay
  createDelayedService: <T>(
    responses: T[],
    delay: number = 100
  ) => {
    let callCount = 0;
    
    return vi.fn(async (...args: any[]) => {
      await asyncHelpers.delay(delay);
      const response = responses[callCount % responses.length];
      callCount++;
      return response;
    });
  },
  
  // Create a mock service that fails intermittently
  createFlakeyService: <T>(
    successResponse: T,
    errorResponse: Error,
    failureRate: number = 0.3
  ) => {
    return vi.fn(async (...args: any[]) => {
      await asyncHelpers.delay(Math.random() * 100);
      
      if (Math.random() < failureRate) {
        throw errorResponse;
      }
      
      return successResponse;
    });
  },
  
  // Create a mock service that times out
  createTimeoutService: (timeoutMs: number = 5000) => {
    return vi.fn(async (...args: any[]) => {
      await asyncHelpers.delay(timeoutMs + 100);
      return 'This should not resolve';
    });
  },
  
  // Create a mock service with rate limiting
  createRateLimitedService: <T>(
    response: T,
    requestsPerSecond: number = 10
  ) => {
    const requests: number[] = [];
    
    return vi.fn(async (...args: any[]) => {
      const now = Date.now();
      
      // Remove requests older than 1 second
      while (requests.length > 0 && now - requests[0] > 1000) {
        requests.shift();
      }
      
      // Check rate limit
      if (requests.length >= requestsPerSecond) {
        throw new Error('Rate limit exceeded');
      }
      
      requests.push(now);
      await asyncHelpers.delay(10);
      return response;
    });
  },
};

// Async testing patterns
export const asyncPatterns = {
  // Test loading states
  testLoadingState: async (
    asyncOperation: () => Promise<any>,
    getLoadingState: () => boolean
  ) => {
    const promise = asyncOperation();
    
    // Should be loading immediately
    expect(getLoadingState()).toBe(true);
    
    await promise;
    
    // Should not be loading after completion
    await waitFor(() => {
      expect(getLoadingState()).toBe(false);
    });
  },
  
  // Test error states
  testErrorState: async (
    asyncOperation: () => Promise<any>,
    getErrorState: () => Error | null,
    expectedError: string
  ) => {
    try {
      await asyncOperation();
      throw new Error('Expected operation to fail');
    } catch (error) {
      await waitFor(() => {
        const errorState = getErrorState();
        expect(errorState).toBeDefined();
        expect(errorState?.message).toContain(expectedError);
      });
    }
  },
  
  // Test success states
  testSuccessState: async <T>(
    asyncOperation: () => Promise<T>,
    getSuccessState: () => T | null,
    expectedResult: T
  ) => {
    const result = await asyncOperation();
    
    await waitFor(() => {
      const successState = getSuccessState();
      expect(successState).toEqual(expectedResult);
    });
    
    return result;
  },
  
  // Test optimistic updates
  testOptimisticUpdate: async <T>(
    optimisticUpdate: (data: T) => void,
    asyncOperation: () => Promise<T>,
    rollback: () => void,
    getData: () => T,
    optimisticData: T,
    finalData: T
  ) => {
    // Apply optimistic update
    optimisticUpdate(optimisticData);
    expect(getData()).toEqual(optimisticData);
    
    try {
      // Perform async operation
      const result = await asyncOperation();
      
      // Should have final data
      await waitFor(() => {
        expect(getData()).toEqual(finalData);
      });
      
      return result;
    } catch (error) {
      // Should rollback on error
      rollback();
      expect(getData()).not.toEqual(optimisticData);
      throw error;
    }
  },
  
  // Test race conditions
  testRaceCondition: async <T>(
    operation1: () => Promise<T>,
    operation2: () => Promise<T>,
    getState: () => any,
    expectedFinalState: any
  ) => {
    // Start both operations concurrently
    const [result1, result2] = await Promise.allSettled([
      operation1(),
      operation2(),
    ]);
    
    // Check final state is consistent
    await waitFor(() => {
      expect(getState()).toEqual(expectedFinalState);
    });
    
    return { result1, result2 };
  },
  
  // Test debouncing
  testDebounce: async (
    debouncedFunction: (...args: any[]) => void,
    delay: number,
    calls: any[][]
  ) => {
    // Make multiple rapid calls
    calls.forEach(args => debouncedFunction(...args));
    
    // Should not execute immediately
    await asyncHelpers.delay(delay / 2);
    expect(debouncedFunction).not.toHaveBeenCalled();
    
    // Should execute after delay
    await asyncHelpers.delay(delay);
    expect(debouncedFunction).toHaveBeenCalledTimes(1);
    expect(debouncedFunction).toHaveBeenCalledWith(...calls[calls.length - 1]);
  },
  
  // Test throttling
  testThrottle: async (
    throttledFunction: (...args: any[]) => void,
    delay: number,
    calls: any[][]
  ) => {
    // Make multiple rapid calls
    calls.forEach((args, index) => {
      setTimeout(() => throttledFunction(...args), index * 10);
    });
    
    // Should execute first call immediately
    expect(throttledFunction).toHaveBeenCalledTimes(1);
    
    // Should execute again after delay
    await asyncHelpers.delay(delay + 50);
    expect(throttledFunction).toHaveBeenCalledTimes(2);
  },
};

// WebSocket testing helpers
export const websocketHelpers = {
  // Mock WebSocket
  createMockWebSocket: () => {
    const mockWs = {
      send: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      readyState: WebSocket.CONNECTING,
      CONNECTING: WebSocket.CONNECTING,
      OPEN: WebSocket.OPEN,
      CLOSING: WebSocket.CLOSING,
      CLOSED: WebSocket.CLOSED,
    };
    
    return mockWs;
  },
  
  // Simulate WebSocket connection
  simulateConnection: (mockWs: any) => {
    mockWs.readyState = WebSocket.OPEN;
    const openEvent = new Event('open');
    mockWs.addEventListener.mock.calls
      .filter(([event]) => event === 'open')
      .forEach(([, handler]) => handler(openEvent));
  },
  
  // Simulate WebSocket message
  simulateMessage: (mockWs: any, data: any) => {
    const messageEvent = new MessageEvent('message', { data: JSON.stringify(data) });
    mockWs.addEventListener.mock.calls
      .filter(([event]) => event === 'message')
      .forEach(([, handler]) => handler(messageEvent));
  },
  
  // Simulate WebSocket error
  simulateError: (mockWs: any, error: Error) => {
    const errorEvent = new ErrorEvent('error', { error });
    mockWs.addEventListener.mock.calls
      .filter(([event]) => event === 'error')
      .forEach(([, handler]) => handler(errorEvent));
  },
  
  // Simulate WebSocket close
  simulateClose: (mockWs: any, code: number = 1000, reason: string = 'Normal closure') => {
    mockWs.readyState = WebSocket.CLOSED;
    const closeEvent = new CloseEvent('close', { code, reason });
    mockWs.addEventListener.mock.calls
      .filter(([event]) => event === 'close')
      .forEach(([, handler]) => handler(closeEvent));
  },
};

// Server-Sent Events testing helpers
export const sseHelpers = {
  // Mock EventSource
  createMockEventSource: () => {
    const mockEventSource = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      close: vi.fn(),
      readyState: EventSource.CONNECTING,
      CONNECTING: EventSource.CONNECTING,
      OPEN: EventSource.OPEN,
      CLOSED: EventSource.CLOSED,
    };
    
    return mockEventSource;
  },
  
  // Simulate SSE connection
  simulateConnection: (mockEventSource: any) => {
    mockEventSource.readyState = EventSource.OPEN;
    const openEvent = new Event('open');
    mockEventSource.addEventListener.mock.calls
      .filter(([event]) => event === 'open')
      .forEach(([, handler]) => handler(openEvent));
  },
  
  // Simulate SSE message
  simulateMessage: (mockEventSource: any, data: any, eventType: string = 'message') => {
    const messageEvent = new MessageEvent(eventType, { 
      data: JSON.stringify(data),
      lastEventId: Date.now().toString(),
    });
    
    mockEventSource.addEventListener.mock.calls
      .filter(([event]) => event === eventType)
      .forEach(([, handler]) => handler(messageEvent));
  },
  
  // Simulate SSE error
  simulateError: (mockEventSource: any, error: Error) => {
    const errorEvent = new ErrorEvent('error', { error });
    mockEventSource.addEventListener.mock.calls
      .filter(([event]) => event === 'error')
      .forEach(([, handler]) => handler(errorEvent));
  },
};