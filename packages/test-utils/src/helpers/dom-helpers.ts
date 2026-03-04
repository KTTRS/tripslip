/**
 * DOM testing helpers
 * Provides utilities for testing DOM interactions and manipulations
 */

import { fireEvent, screen } from '@testing-library/react';

// DOM query helpers
export const domHelpers = {
  // Get element by data attribute
  getByDataAttr: (attr: string, value: string): HTMLElement => {
    return screen.getByTestId(`${attr}-${value}`) || 
           document.querySelector(`[data-${attr}="${value}"]`) as HTMLElement;
  },
  
  // Query element by data attribute
  queryByDataAttr: (attr: string, value: string): HTMLElement | null => {
    return screen.queryByTestId(`${attr}-${value}`) || 
           document.querySelector(`[data-${attr}="${value}"]`) as HTMLElement;
  },
  
  // Get all elements by class name
  getAllByClass: (className: string): HTMLElement[] => {
    return Array.from(document.getElementsByClassName(className)) as HTMLElement[];
  },
  
  // Get element by CSS selector
  getByCss: (selector: string): HTMLElement => {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    return element;
  },
  
  // Query element by CSS selector
  queryByCss: (selector: string): HTMLElement | null => {
    return document.querySelector(selector) as HTMLElement | null;
  },
  
  // Get all elements by CSS selector
  getAllByCss: (selector: string): HTMLElement[] => {
    return Array.from(document.querySelectorAll(selector)) as HTMLElement[];
  },
  
  // Check if element exists
  elementExists: (selector: string): boolean => {
    return document.querySelector(selector) !== null;
  },
  
  // Wait for element to appear
  waitForElement: async (
    selector: string, 
    timeout: number = 5000
  ): Promise<HTMLElement> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        return element;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Element not found within ${timeout}ms: ${selector}`);
  },
  
  // Wait for element to disappear
  waitForElementToDisappear: async (
    selector: string, 
    timeout: number = 5000
  ): Promise<void> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (!element) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Element still exists after ${timeout}ms: ${selector}`);
  },
};

// DOM manipulation helpers
export const domManipulation = {
  // Set element attribute
  setAttribute: (element: HTMLElement, attr: string, value: string): void => {
    element.setAttribute(attr, value);
  },
  
  // Remove element attribute
  removeAttribute: (element: HTMLElement, attr: string): void => {
    element.removeAttribute(attr);
  },
  
  // Add CSS class
  addClass: (element: HTMLElement, className: string): void => {
    element.classList.add(className);
  },
  
  // Remove CSS class
  removeClass: (element: HTMLElement, className: string): void => {
    element.classList.remove(className);
  },
  
  // Toggle CSS class
  toggleClass: (element: HTMLElement, className: string): void => {
    element.classList.toggle(className);
  },
  
  // Set element style
  setStyle: (element: HTMLElement, property: string, value: string): void => {
    (element.style as any)[property] = value;
  },
  
  // Set element text content
  setText: (element: HTMLElement, text: string): void => {
    element.textContent = text;
  },
  
  // Set element HTML content
  setHTML: (element: HTMLElement, html: string): void => {
    element.innerHTML = html;
  },
  
  // Append child element
  appendChild: (parent: HTMLElement, child: HTMLElement): void => {
    parent.appendChild(child);
  },
  
  // Remove element from DOM
  removeElement: (element: HTMLElement): void => {
    element.remove();
  },
  
  // Create element
  createElement: (
    tagName: string, 
    attributes: Record<string, string> = {},
    textContent?: string
  ): HTMLElement => {
    const element = document.createElement(tagName);
    
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    
    if (textContent) {
      element.textContent = textContent;
    }
    
    return element;
  },
};

// Event simulation helpers
export const eventHelpers = {
  // Click event
  click: (element: HTMLElement): void => {
    fireEvent.click(element);
  },
  
  // Double click event
  doubleClick: (element: HTMLElement): void => {
    fireEvent.doubleClick(element);
  },
  
  // Mouse over event
  mouseOver: (element: HTMLElement): void => {
    fireEvent.mouseOver(element);
  },
  
  // Mouse out event
  mouseOut: (element: HTMLElement): void => {
    fireEvent.mouseOut(element);
  },
  
  // Mouse enter event
  mouseEnter: (element: HTMLElement): void => {
    fireEvent.mouseEnter(element);
  },
  
  // Mouse leave event
  mouseLeave: (element: HTMLElement): void => {
    fireEvent.mouseLeave(element);
  },
  
  // Focus event
  focus: (element: HTMLElement): void => {
    fireEvent.focus(element);
  },
  
  // Blur event
  blur: (element: HTMLElement): void => {
    fireEvent.blur(element);
  },
  
  // Key down event
  keyDown: (element: HTMLElement, key: string): void => {
    fireEvent.keyDown(element, { key });
  },
  
  // Key up event
  keyUp: (element: HTMLElement, key: string): void => {
    fireEvent.keyUp(element, { key });
  },
  
  // Key press event
  keyPress: (element: HTMLElement, key: string): void => {
    fireEvent.keyPress(element, { key });
  },
  
  // Change event
  change: (element: HTMLElement, value: string): void => {
    fireEvent.change(element, { target: { value } });
  },
  
  // Input event
  input: (element: HTMLElement, value: string): void => {
    fireEvent.input(element, { target: { value } });
  },
  
  // Submit event
  submit: (element: HTMLElement): void => {
    fireEvent.submit(element);
  },
  
  // Scroll event
  scroll: (element: HTMLElement, scrollTop: number = 0, scrollLeft: number = 0): void => {
    fireEvent.scroll(element, { target: { scrollTop, scrollLeft } });
  },
  
  // Resize event
  resize: (width: number = window.innerWidth, height: number = window.innerHeight): void => {
    Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: height, writable: true });
    fireEvent(window, new Event('resize'));
  },
  
  // Custom event
  customEvent: (element: HTMLElement, eventType: string, detail?: any): void => {
    const event = new CustomEvent(eventType, { detail });
    fireEvent(element, event);
  },
};

// Form helpers
export const formHelpers = {
  // Fill input field
  fillInput: (input: HTMLInputElement, value: string): void => {
    fireEvent.change(input, { target: { value } });
  },
  
  // Select option in select element
  selectOption: (select: HTMLSelectElement, value: string): void => {
    fireEvent.change(select, { target: { value } });
  },
  
  // Check/uncheck checkbox
  toggleCheckbox: (checkbox: HTMLInputElement, checked: boolean = true): void => {
    fireEvent.click(checkbox);
    checkbox.checked = checked;
  },
  
  // Select radio button
  selectRadio: (radio: HTMLInputElement): void => {
    fireEvent.click(radio);
  },
  
  // Upload file to input
  uploadFile: (input: HTMLInputElement, file: File): void => {
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(input);
  },
  
  // Upload multiple files
  uploadFiles: (input: HTMLInputElement, files: File[]): void => {
    Object.defineProperty(input, 'files', {
      value: files,
      writable: false,
    });
    fireEvent.change(input);
  },
  
  // Clear input field
  clearInput: (input: HTMLInputElement): void => {
    fireEvent.change(input, { target: { value: '' } });
  },
  
  // Get form data
  getFormData: (form: HTMLFormElement): FormData => {
    return new FormData(form);
  },
  
  // Validate form
  validateForm: (form: HTMLFormElement): boolean => {
    return form.checkValidity();
  },
};

// Viewport and layout helpers
export const layoutHelpers = {
  // Set viewport size
  setViewportSize: (width: number, height: number): void => {
    Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: height, writable: true });
    fireEvent(window, new Event('resize'));
  },
  
  // Set mobile viewport
  setMobileViewport: (): void => {
    layoutHelpers.setViewportSize(375, 667); // iPhone SE size
  },
  
  // Set tablet viewport
  setTabletViewport: (): void => {
    layoutHelpers.setViewportSize(768, 1024); // iPad size
  },
  
  // Set desktop viewport
  setDesktopViewport: (): void => {
    layoutHelpers.setViewportSize(1920, 1080); // Full HD size
  },
  
  // Get element dimensions
  getElementDimensions: (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
    };
  },
  
  // Check if element is visible
  isElementVisible: (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  },
  
  // Check if element is in viewport
  isElementInViewport: (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    return (
      rect.top < window.innerHeight &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.right > 0
    );
  },
  
  // Scroll element into view
  scrollIntoView: (element: HTMLElement): void => {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  },
  
  // Get scroll position
  getScrollPosition: () => ({
    x: window.pageXOffset || document.documentElement.scrollLeft,
    y: window.pageYOffset || document.documentElement.scrollTop,
  }),
  
  // Set scroll position
  setScrollPosition: (x: number, y: number): void => {
    window.scrollTo(x, y);
  },
};

// Accessibility helpers
export const a11yHelpers = {
  // Check if element has focus
  hasFocus: (element: HTMLElement): boolean => {
    return document.activeElement === element;
  },
  
  // Focus element
  focusElement: (element: HTMLElement): void => {
    element.focus();
  },
  
  // Get focusable elements
  getFocusableElements: (container: HTMLElement = document.body): HTMLElement[] => {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ];
    
    return Array.from(
      container.querySelectorAll(focusableSelectors.join(', '))
    ) as HTMLElement[];
  },
  
  // Test tab navigation
  testTabNavigation: (elements: HTMLElement[]): void => {
    elements.forEach((element, index) => {
      element.focus();
      expect(document.activeElement).toBe(element);
      
      if (index < elements.length - 1) {
        fireEvent.keyDown(element, { key: 'Tab' });
      }
    });
  },
  
  // Check ARIA attributes
  checkAriaAttributes: (element: HTMLElement, expectedAttributes: Record<string, string>): void => {
    Object.entries(expectedAttributes).forEach(([attr, value]) => {
      expect(element.getAttribute(attr)).toBe(value);
    });
  },
  
  // Check role attribute
  checkRole: (element: HTMLElement, expectedRole: string): void => {
    expect(element.getAttribute('role')).toBe(expectedRole);
  },
  
  // Check if element is announced to screen readers
  isAnnouncedToScreenReaders: (element: HTMLElement): boolean => {
    return (
      !element.hasAttribute('aria-hidden') ||
      element.getAttribute('aria-hidden') !== 'true'
    );
  },
  
  // Check color contrast (simplified)
  checkColorContrast: (element: HTMLElement): { foreground: string; background: string } => {
    const styles = window.getComputedStyle(element);
    return {
      foreground: styles.color,
      background: styles.backgroundColor,
    };
  },
};

// Local storage helpers
export const storageHelpers = {
  // Set localStorage item
  setLocalStorage: (key: string, value: any): void => {
    localStorage.setItem(key, JSON.stringify(value));
  },
  
  // Get localStorage item
  getLocalStorage: (key: string): any => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  
  // Remove localStorage item
  removeLocalStorage: (key: string): void => {
    localStorage.removeItem(key);
  },
  
  // Clear localStorage
  clearLocalStorage: (): void => {
    localStorage.clear();
  },
  
  // Set sessionStorage item
  setSessionStorage: (key: string, value: any): void => {
    sessionStorage.setItem(key, JSON.stringify(value));
  },
  
  // Get sessionStorage item
  getSessionStorage: (key: string): any => {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  
  // Remove sessionStorage item
  removeSessionStorage: (key: string): void => {
    sessionStorage.removeItem(key);
  },
  
  // Clear sessionStorage
  clearSessionStorage: (): void => {
    sessionStorage.clear();
  },
  
  // Mock storage for testing
  mockStorage: () => {
    const storage: Record<string, string> = {};
    
    return {
      getItem: (key: string) => storage[key] || null,
      setItem: (key: string, value: string) => { storage[key] = value; },
      removeItem: (key: string) => { delete storage[key]; },
      clear: () => { Object.keys(storage).forEach(key => delete storage[key]); },
      length: Object.keys(storage).length,
      key: (index: number) => Object.keys(storage)[index] || null,
    };
  },
};