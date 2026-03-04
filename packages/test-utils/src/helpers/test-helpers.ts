/**
 * General test helper utilities
 * Provides common testing utilities and patterns
 */

import { vi } from 'vitest';

// Test environment helpers
export const testEnv = {
  isDevelopment: () => process.env.NODE_ENV === 'development',
  isTest: () => process.env.NODE_ENV === 'test',
  isProduction: () => process.env.NODE_ENV === 'production',
  
  setEnvVar: (key: string, value: string) => {
    const originalValue = process.env[key];
    process.env[key] = value;
    return () => {
      if (originalValue === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalValue;
      }
    };
  },
  
  mockEnvVars: (vars: Record<string, string>) => {
    const restoreFunctions: (() => void)[] = [];
    
    Object.entries(vars).forEach(([key, value]) => {
      restoreFunctions.push(testEnv.setEnvVar(key, value));
    });
    
    return () => {
      restoreFunctions.forEach(restore => restore());
    };
  },
};

// Time and date helpers
export const timeHelpers = {
  freezeTime: (date: Date | string = new Date()) => {
    const mockDate = new Date(date);
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
    return mockDate;
  },
  
  unfreezeTime: () => {
    vi.useRealTimers();
  },
  
  advanceTime: (ms: number) => {
    vi.advanceTimersByTime(ms);
  },
  
  advanceToNextTimer: () => {
    vi.advanceTimersToNextTimer();
  },
  
  runAllTimers: () => {
    vi.runAllTimers();
  },
  
  createDateString: (daysFromNow: number = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  },
  
  createTimeString: (hours: number = 9, minutes: number = 0) => {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  },
};

// Random data generators
export const generators = {
  id: (prefix: string = 'test') => `${prefix}-${Math.random().toString(36).substr(2, 9)}`,
  
  email: (domain: string = 'example.com') => 
    `test-${Math.random().toString(36).substr(2, 5)}@${domain}`,
  
  phone: (countryCode: string = '+1') => 
    `${countryCode}-555-${Math.floor(Math.random() * 9000) + 1000}`,
  
  name: () => {
    const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstName} ${lastName}`;
  },
  
  address: () => {
    const streetNumbers = [123, 456, 789, 101, 202, 303];
    const streetNames = ['Main St', 'Oak Ave', 'Pine Rd', 'Elm Dr', 'Cedar Ln', 'Maple Way'];
    const cities = ['Springfield', 'Riverside', 'Franklin', 'Georgetown', 'Clinton', 'Madison'];
    const states = ['CA', 'NY', 'TX', 'FL', 'IL', 'PA'];
    const zipCodes = ['90210', '10001', '77001', '33101', '60601', '19101'];
    
    const streetNumber = streetNumbers[Math.floor(Math.random() * streetNumbers.length)];
    const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const state = states[Math.floor(Math.random() * states.length)];
    const zipCode = zipCodes[Math.floor(Math.random() * zipCodes.length)];
    
    return `${streetNumber} ${streetName}, ${city}, ${state} ${zipCode}`;
  },
  
  price: (min: number = 10, max: number = 100) => 
    Math.floor(Math.random() * (max - min + 1) + min) * 100, // Return cents
  
  grade: () => {
    const grades = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    return grades[Math.floor(Math.random() * grades.length)];
  },
  
  boolean: () => Math.random() > 0.5,
  
  arrayItem: <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)],
  
  sentence: (wordCount: number = 10) => {
    const words = [
      'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog',
      'educational', 'experience', 'students', 'learn', 'explore', 'discover',
      'museum', 'science', 'history', 'nature', 'animals', 'exhibits',
    ];
    
    const sentence = Array.from({ length: wordCount }, () => 
      words[Math.floor(Math.random() * words.length)]
    ).join(' ');
    
    return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
  },
};

// Test data builders
export const builders = {
  user: (overrides: any = {}) => ({
    id: generators.id('user'),
    email: generators.email(),
    name: generators.name(),
    phone: generators.phone(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),
  
  venue: (overrides: any = {}) => ({
    id: generators.id('venue'),
    name: `${generators.name()} Museum`,
    description: generators.sentence(15),
    address: generators.address(),
    phone: generators.phone(),
    email: generators.email(),
    category: generators.arrayItem(['museum', 'zoo', 'aquarium', 'park']),
    capacity: Math.floor(Math.random() * 200) + 50,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),
  
  trip: (overrides: any = {}) => ({
    id: generators.id('trip'),
    title: `${generators.arrayItem(['Science', 'History', 'Nature', 'Art'])} Field Trip`,
    description: generators.sentence(12),
    venue_id: generators.id('venue'),
    experience_id: generators.id('exp'),
    teacher_id: generators.id('teacher'),
    school_id: generators.id('school'),
    trip_date: timeHelpers.createDateString(30),
    departure_time: timeHelpers.createTimeString(9),
    return_time: timeHelpers.createTimeString(15),
    estimated_cost_cents: generators.price(10, 50),
    max_participants: Math.floor(Math.random() * 30) + 20,
    grade_level: generators.grade(),
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),
  
  permissionSlip: (overrides: any = {}) => ({
    id: generators.id('slip'),
    trip_id: generators.id('trip'),
    student_name: generators.name(),
    student_grade: generators.grade(),
    student_dob: timeHelpers.createDateString(-365 * 10), // 10 years ago
    parent_name: generators.name(),
    parent_email: generators.email(),
    parent_phone: generators.phone(),
    emergency_contact_name: generators.name(),
    emergency_contact_phone: generators.phone(),
    emergency_contact_relationship: generators.arrayItem(['Father', 'Mother', 'Guardian', 'Grandparent']),
    status: 'pending',
    magic_link_token: generators.id('token'),
    magic_link_expires_at: timeHelpers.createDateString(7),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),
};

// Test assertion helpers
export const assertions = {
  toBeValidEmail: (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  toBeValidPhone: (phone: string) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  },
  
  toBeValidUrl: (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  toBeValidDate: (date: string) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  },
  
  toBeValidTime: (time: string) => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  },
  
  toBeInRange: (value: number, min: number, max: number) => {
    return value >= min && value <= max;
  },
  
  toHaveLength: (array: any[], expectedLength: number) => {
    return array.length === expectedLength;
  },
  
  toContainText: (element: HTMLElement, text: string) => {
    return element.textContent?.includes(text) ?? false;
  },
};

// Test cleanup helpers
export const cleanup = {
  clearAllMocks: () => {
    vi.clearAllMocks();
  },
  
  restoreAllMocks: () => {
    vi.restoreAllMocks();
  },
  
  resetModules: () => {
    vi.resetModules();
  },
  
  clearTimers: () => {
    vi.clearAllTimers();
  },
  
  resetAll: () => {
    cleanup.clearAllMocks();
    cleanup.restoreAllMocks();
    cleanup.resetModules();
    cleanup.clearTimers();
  },
};

// Test debugging helpers
export const debug = {
  logElement: (element: HTMLElement) => {
    console.log('Element HTML:', element.outerHTML);
    console.log('Element Text:', element.textContent);
  },
  
  logProps: (props: any) => {
    console.log('Component Props:', JSON.stringify(props, null, 2));
  },
  
  logState: (state: any) => {
    console.log('Component State:', JSON.stringify(state, null, 2));
  },
  
  logMockCalls: (mockFn: any) => {
    console.log('Mock Function Calls:', mockFn.mock.calls);
    console.log('Mock Function Results:', mockFn.mock.results);
  },
  
  screenshot: (element: HTMLElement) => {
    // In a real implementation, this could capture a screenshot
    console.log('Screenshot would be taken of:', element.tagName);
  },
};

// Performance testing helpers
export const performance = {
  measureRenderTime: async (renderFn: () => Promise<void> | void) => {
    const start = performance.now();
    await renderFn();
    const end = performance.now();
    return end - start;
  },
  
  measureAsyncOperation: async (operation: () => Promise<any>) => {
    const start = performance.now();
    const result = await operation();
    const end = performance.now();
    return { result, duration: end - start };
  },
  
  expectFastRender: (duration: number, maxMs: number = 100) => {
    expect(duration).toBeLessThan(maxMs);
  },
};