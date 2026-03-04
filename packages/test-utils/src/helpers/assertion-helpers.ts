/**
 * Assertion helpers for testing
 * Provides custom matchers and assertion utilities
 */

import { expect } from 'vitest';

// Custom assertion helpers
export const assertionHelpers = {
  // Assert array contains all items
  expectArrayToContainAll: <T>(actual: T[], expected: T[]) => {
    expected.forEach(item => {
      expect(actual).toContain(item);
    });
  },
  
  // Assert array contains any of the items
  expectArrayToContainAny: <T>(actual: T[], expected: T[]) => {
    const hasAny = expected.some(item => actual.includes(item));
    expect(hasAny).toBe(true);
  },
  
  // Assert array has unique items
  expectArrayToBeUnique: <T>(actual: T[]) => {
    const unique = [...new Set(actual)];
    expect(actual).toHaveLength(unique.length);
  },
  
  // Assert array is sorted
  expectArrayToBeSorted: <T>(actual: T[], compareFn?: (a: T, b: T) => number) => {
    const sorted = [...actual].sort(compareFn);
    expect(actual).toEqual(sorted);
  },
  
  // Assert object has all properties
  expectObjectToHaveProperties: (actual: object, properties: string[]) => {
    properties.forEach(prop => {
      expect(actual).toHaveProperty(prop);
    });
  },
  
  // Assert object matches partial
  expectObjectToMatchPartial: (actual: object, partial: object) => {
    expect(actual).toMatchObject(partial);
  },
  
  // Assert object has exact properties (no more, no less)
  expectObjectToHaveExactProperties: (actual: object, properties: string[]) => {
    const actualKeys = Object.keys(actual).sort();
    const expectedKeys = properties.sort();
    expect(actualKeys).toEqual(expectedKeys);
  },
  
  // Assert string matches pattern
  expectStringToMatchPattern: (actual: string, pattern: RegExp) => {
    expect(pattern.test(actual)).toBe(true);
  },
  
  // Assert string is valid email
  expectValidEmail: (email: string) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailPattern.test(email)).toBe(true);
  },
  
  // Assert string is valid phone
  expectValidPhone: (phone: string) => {
    const phonePattern = /^\+?[1-9]\d{1,14}$/;
    expect(phonePattern.test(phone)).toBe(true);
  },
  
  // Assert string is valid URL
  expectValidUrl: (url: string) => {
    expect(() => new URL(url)).not.toThrow();
  },
  
  // Assert date is valid
  expectValidDate: (date: string | Date) => {
    const dateObj = new Date(date);
    expect(dateObj.getTime()).not.toBeNaN();
  },
  
  // Assert date is in future
  expectFutureDate: (date: string | Date) => {
    const dateObj = new Date(date);
    const now = new Date();
    expect(dateObj.getTime()).toBeGreaterThan(now.getTime());
  },
  
  // Assert date is in past
  expectPastDate: (date: string | Date) => {
    const dateObj = new Date(date);
    const now = new Date();
    expect(dateObj.getTime()).toBeLessThan(now.getTime());
  },
  
  // Assert number is in range
  expectNumberInRange: (actual: number, min: number, max: number) => {
    expect(actual).toBeGreaterThanOrEqual(min);
    expect(actual).toBeLessThanOrEqual(max);
  },
  
  // Assert number is positive
  expectPositiveNumber: (actual: number) => {
    expect(actual).toBeGreaterThan(0);
  },
  
  // Assert number is non-negative
  expectNonNegativeNumber: (actual: number) => {
    expect(actual).toBeGreaterThanOrEqual(0);
  },
  
  // Assert function throws specific error
  expectFunctionToThrowError: async (
    fn: () => any | Promise<any>,
    errorMessage: string | RegExp
  ) => {
    if (fn.constructor.name === 'AsyncFunction') {
      await expect(fn()).rejects.toThrow(errorMessage);
    } else {
      expect(fn).toThrow(errorMessage);
    }
  },
  
  // Assert function does not throw
  expectFunctionNotToThrow: async (fn: () => any | Promise<any>) => {
    if (fn.constructor.name === 'AsyncFunction') {
      await expect(fn()).resolves.not.toThrow();
    } else {
      expect(fn).not.toThrow();
    }
  },
  
  // Assert promise resolves
  expectPromiseToResolve: async <T>(promise: Promise<T>) => {
    await expect(promise).resolves.toBeDefined();
  },
  
  // Assert promise rejects
  expectPromiseToReject: async (promise: Promise<any>) => {
    await expect(promise).rejects.toBeDefined();
  },
  
  // Assert promise resolves with value
  expectPromiseToResolveWith: async <T>(promise: Promise<T>, value: T) => {
    await expect(promise).resolves.toEqual(value);
  },
  
  // Assert promise rejects with error
  expectPromiseToRejectWith: async (promise: Promise<any>, error: string | RegExp) => {
    await expect(promise).rejects.toThrow(error);
  },
};

// DOM assertion helpers
export const domAssertions = {
  // Assert element exists
  expectElementToExist: (selector: string) => {
    const element = document.querySelector(selector);
    expect(element).not.toBeNull();
    return element as HTMLElement;
  },
  
  // Assert element does not exist
  expectElementNotToExist: (selector: string) => {
    const element = document.querySelector(selector);
    expect(element).toBeNull();
  },
  
  // Assert element is visible
  expectElementToBeVisible: (element: HTMLElement) => {
    expect(element).toBeVisible();
  },
  
  // Assert element is hidden
  expectElementToBeHidden: (element: HTMLElement) => {
    expect(element).not.toBeVisible();
  },
  
  // Assert element has text
  expectElementToHaveText: (element: HTMLElement, text: string) => {
    expect(element).toHaveTextContent(text);
  },
  
  // Assert element contains text
  expectElementToContainText: (element: HTMLElement, text: string) => {
    expect(element.textContent).toContain(text);
  },
  
  // Assert element has attribute
  expectElementToHaveAttribute: (element: HTMLElement, attr: string, value?: string) => {
    if (value !== undefined) {
      expect(element).toHaveAttribute(attr, value);
    } else {
      expect(element).toHaveAttribute(attr);
    }
  },
  
  // Assert element has class
  expectElementToHaveClass: (element: HTMLElement, className: string) => {
    expect(element).toHaveClass(className);
  },
  
  // Assert element has style
  expectElementToHaveStyle: (element: HTMLElement, style: Record<string, string>) => {
    expect(element).toHaveStyle(style);
  },
  
  // Assert element is focused
  expectElementToBeFocused: (element: HTMLElement) => {
    expect(element).toHaveFocus();
  },
  
  // Assert element is disabled
  expectElementToBeDisabled: (element: HTMLElement) => {
    expect(element).toBeDisabled();
  },
  
  // Assert element is enabled
  expectElementToBeEnabled: (element: HTMLElement) => {
    expect(element).toBeEnabled();
  },
  
  // Assert input has value
  expectInputToHaveValue: (input: HTMLInputElement, value: string) => {
    expect(input).toHaveValue(value);
  },
  
  // Assert checkbox is checked
  expectCheckboxToBeChecked: (checkbox: HTMLInputElement) => {
    expect(checkbox).toBeChecked();
  },
  
  // Assert checkbox is not checked
  expectCheckboxNotToBeChecked: (checkbox: HTMLInputElement) => {
    expect(checkbox).not.toBeChecked();
  },
  
  // Assert select has selected option
  expectSelectToHaveSelectedOption: (select: HTMLSelectElement, value: string) => {
    expect(select).toHaveValue(value);
  },
  
  // Assert form is valid
  expectFormToBeValid: (form: HTMLFormElement) => {
    expect(form.checkValidity()).toBe(true);
  },
  
  // Assert form is invalid
  expectFormToBeInvalid: (form: HTMLFormElement) => {
    expect(form.checkValidity()).toBe(false);
  },
};

// Mock assertion helpers
export const mockAssertions = {
  // Assert mock was called
  expectMockToBeCalled: (mock: any) => {
    expect(mock).toHaveBeenCalled();
  },
  
  // Assert mock was called with arguments
  expectMockToBeCalledWith: (mock: any, ...args: any[]) => {
    expect(mock).toHaveBeenCalledWith(...args);
  },
  
  // Assert mock was called times
  expectMockToBeCalledTimes: (mock: any, times: number) => {
    expect(mock).toHaveBeenCalledTimes(times);
  },
  
  // Assert mock was called once
  expectMockToBeCalledOnce: (mock: any) => {
    expect(mock).toHaveBeenCalledTimes(1);
  },
  
  // Assert mock was never called
  expectMockNeverToBeCalled: (mock: any) => {
    expect(mock).not.toHaveBeenCalled();
  },
  
  // Assert mock was last called with
  expectMockLastCalledWith: (mock: any, ...args: any[]) => {
    expect(mock).toHaveBeenLastCalledWith(...args);
  },
  
  // Assert mock was nth called with
  expectMockNthCalledWith: (mock: any, nthCall: number, ...args: any[]) => {
    expect(mock).toHaveBeenNthCalledWith(nthCall, ...args);
  },
  
  // Assert mock returned value
  expectMockToReturnValue: (mock: any, value: any) => {
    expect(mock).toHaveReturnedWith(value);
  },
  
  // Assert mock returned times
  expectMockToReturnTimes: (mock: any, times: number) => {
    expect(mock).toHaveReturnedTimes(times);
  },
  
  // Assert mock threw error
  expectMockToThrow: (mock: any, error?: string | RegExp) => {
    if (error) {
      expect(mock).toThrow(error);
    } else {
      expect(mock).toThrow();
    }
  },
};

// API assertion helpers
export const apiAssertions = {
  // Assert API response structure
  expectApiResponse: (response: any, expectedStructure: object) => {
    expect(response).toMatchObject(expectedStructure);
  },
  
  // Assert API success response
  expectApiSuccess: (response: any, data?: any) => {
    expect(response).toHaveProperty('data');
    expect(response).toHaveProperty('error', null);
    
    if (data !== undefined) {
      expect(response.data).toEqual(data);
    }
  },
  
  // Assert API error response
  expectApiError: (response: any, errorMessage?: string) => {
    expect(response).toHaveProperty('error');
    expect(response.error).not.toBeNull();
    
    if (errorMessage) {
      expect(response.error.message).toContain(errorMessage);
    }
  },
  
  // Assert API pagination
  expectApiPagination: (response: any, expectedPagination: object) => {
    expect(response).toHaveProperty('pagination');
    expect(response.pagination).toMatchObject(expectedPagination);
  },
  
  // Assert HTTP status
  expectHttpStatus: (response: Response, status: number) => {
    expect(response.status).toBe(status);
  },
  
  // Assert HTTP headers
  expectHttpHeaders: (response: Response, headers: Record<string, string>) => {
    Object.entries(headers).forEach(([key, value]) => {
      expect(response.headers.get(key)).toBe(value);
    });
  },
};

// Business logic assertion helpers
export const businessAssertions = {
  // Assert valid trip data
  expectValidTrip: (trip: any) => {
    expect(trip).toHaveProperty('id');
    expect(trip).toHaveProperty('title');
    expect(trip).toHaveProperty('venue_id');
    expect(trip).toHaveProperty('trip_date');
    expect(trip.max_participants).toBeGreaterThan(0);
    expect(trip.estimated_cost_cents).toBeGreaterThanOrEqual(0);
  },
  
  // Assert valid permission slip
  expectValidPermissionSlip: (slip: any) => {
    expect(slip).toHaveProperty('id');
    expect(slip).toHaveProperty('trip_id');
    expect(slip).toHaveProperty('student_name');
    expect(slip).toHaveProperty('parent_name');
    expect(slip).toHaveProperty('parent_email');
    assertionHelpers.expectValidEmail(slip.parent_email);
  },
  
  // Assert valid payment
  expectValidPayment: (payment: any) => {
    expect(payment).toHaveProperty('id');
    expect(payment).toHaveProperty('permission_slip_id');
    expect(payment).toHaveProperty('amount_cents');
    expect(payment).toHaveProperty('currency');
    expect(payment).toHaveProperty('status');
    expect(payment.amount_cents).toBeGreaterThan(0);
  },
  
  // Assert valid venue
  expectValidVenue: (venue: any) => {
    expect(venue).toHaveProperty('id');
    expect(venue).toHaveProperty('name');
    expect(venue).toHaveProperty('address');
    expect(venue).toHaveProperty('category');
    expect(venue.capacity).toBeGreaterThan(0);
  },
  
  // Assert valid user
  expectValidUser: (user: any) => {
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
    assertionHelpers.expectValidEmail(user.email);
    
    if (user.phone) {
      assertionHelpers.expectValidPhone(user.phone);
    }
  },
  
  // Assert trip capacity constraints
  expectTripCapacityConstraints: (trip: any) => {
    expect(trip.current_participants).toBeLessThanOrEqual(trip.max_participants);
    expect(trip.current_participants).toBeGreaterThanOrEqual(0);
  },
  
  // Assert permission slip expiration
  expectPermissionSlipExpiration: (slip: any) => {
    if (slip.magic_link_expires_at) {
      const expirationDate = new Date(slip.magic_link_expires_at);
      expect(expirationDate.getTime()).not.toBeNaN();
    }
  },
  
  // Assert payment amount calculation
  expectPaymentAmountCalculation: (
    baseAmount: number,
    addOns: number[],
    totalAmount: number
  ) => {
    const expectedTotal = baseAmount + addOns.reduce((sum, addon) => sum + addon, 0);
    expect(totalAmount).toBe(expectedTotal);
  },
};