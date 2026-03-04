/**
 * Component testing helpers
 * Provides utilities for testing React components
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { vi } from 'vitest';
import { ReactElement, ReactNode } from 'react';

// Component rendering helpers
export const componentHelpers = {
  // Render component with common providers
  renderWithProviders: (
    component: ReactElement,
    options: {
      authContext?: any;
      themeContext?: any;
      routerContext?: any;
      i18nContext?: any;
    } = {}
  ) => {
    const {
      authContext = { user: null, loading: false },
      themeContext = { theme: 'light' },
      routerContext = { pathname: '/test' },
      i18nContext = { language: 'en', t: (key: string) => key },
    } = options;
    
    // Create wrapper with providers
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <div data-testid="test-wrapper">
        {/* In a real implementation, these would be actual context providers */}
        <div data-auth-context={JSON.stringify(authContext)}>
          <div data-theme-context={JSON.stringify(themeContext)}>
            <div data-router-context={JSON.stringify(routerContext)}>
              <div data-i18n-context={JSON.stringify(i18nContext)}>
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
    
    return render(component, { wrapper: Wrapper });
  },
  
  // Render component and return common utilities
  renderComponent: (component: ReactElement, options: any = {}) => {
    const utils = componentHelpers.renderWithProviders(component, options);
    
    return {
      ...utils,
      user: userEvent.setup(),
      
      // Common query helpers
      getByTestId: (testId: string) => screen.getByTestId(testId),
      queryByTestId: (testId: string) => screen.queryByTestId(testId),
      findByTestId: (testId: string) => screen.findByTestId(testId),
      
      getByText: (text: string) => screen.getByText(text),
      queryByText: (text: string) => screen.queryByText(text),
      findByText: (text: string) => screen.findByText(text),
      
      getByRole: (role: string, options?: any) => screen.getByRole(role, options),
      queryByRole: (role: string, options?: any) => screen.queryByRole(role, options),
      findByRole: (role: string, options?: any) => screen.findByRole(role, options),
      
      getByLabelText: (text: string) => screen.getByLabelText(text),
      queryByLabelText: (text: string) => screen.queryByLabelText(text),
      findByLabelText: (text: string) => screen.findByLabelText(text),
      
      getByPlaceholderText: (text: string) => screen.getByPlaceholderText(text),
      queryByPlaceholderText: (text: string) => screen.queryByPlaceholderText(text),
      findByPlaceholderText: (text: string) => screen.findByPlaceholderText(text),
    };
  },
  
  // Wait for component to be ready
  waitForComponent: async (testId: string, timeout: number = 5000) => {
    await waitFor(
      () => {
        expect(screen.getByTestId(testId)).toBeInTheDocument();
      },
      { timeout }
    );
  },
  
  // Wait for loading to complete
  waitForLoadingToComplete: async (loadingTestId: string = 'loading', timeout: number = 5000) => {
    await waitFor(
      () => {
        expect(screen.queryByTestId(loadingTestId)).not.toBeInTheDocument();
      },
      { timeout }
    );
  },
  
  // Wait for error to appear
  waitForError: async (errorTestId: string = 'error', timeout: number = 5000) => {
    await waitFor(
      () => {
        expect(screen.getByTestId(errorTestId)).toBeInTheDocument();
      },
      { timeout }
    );
  },
};

// Form testing helpers
export const formHelpers = {
  // Fill form field
  fillField: async (user: any, fieldName: string, value: string) => {
    const field = screen.getByLabelText(new RegExp(fieldName, 'i'));
    await user.clear(field);
    await user.type(field, value);
  },
  
  // Fill multiple form fields
  fillForm: async (user: any, formData: Record<string, string>) => {
    for (const [fieldName, value] of Object.entries(formData)) {
      await formHelpers.fillField(user, fieldName, value);
    }
  },
  
  // Submit form
  submitForm: async (user: any, submitButtonText: string = 'Submit') => {
    const submitButton = screen.getByRole('button', { name: new RegExp(submitButtonText, 'i') });
    await user.click(submitButton);
  },
  
  // Fill and submit form
  fillAndSubmitForm: async (
    user: any,
    formData: Record<string, string>,
    submitButtonText: string = 'Submit'
  ) => {
    await formHelpers.fillForm(user, formData);
    await formHelpers.submitForm(user, submitButtonText);
  },
  
  // Check form validation
  expectValidationError: async (fieldName: string, errorMessage: string) => {
    await waitFor(() => {
      const field = screen.getByLabelText(new RegExp(fieldName, 'i'));
      const errorElement = screen.getByText(errorMessage);
      expect(errorElement).toBeInTheDocument();
    });
  },
  
  // Check form submission
  expectFormSubmission: async (mockSubmitFn: any, expectedData: any) => {
    await waitFor(() => {
      expect(mockSubmitFn).toHaveBeenCalledWith(expectedData);
    });
  },
  
  // Select dropdown option
  selectOption: async (user: any, selectLabel: string, optionText: string) => {
    const select = screen.getByLabelText(new RegExp(selectLabel, 'i'));
    await user.click(select);
    
    const option = screen.getByText(optionText);
    await user.click(option);
  },
  
  // Check checkbox
  checkCheckbox: async (user: any, checkboxLabel: string) => {
    const checkbox = screen.getByLabelText(new RegExp(checkboxLabel, 'i'));
    await user.click(checkbox);
  },
  
  // Upload file
  uploadFile: async (user: any, inputLabel: string, file: File) => {
    const input = screen.getByLabelText(new RegExp(inputLabel, 'i'));
    await user.upload(input, file);
  },
};

// Interaction testing helpers
export const interactionHelpers = {
  // Click element
  clickElement: async (user: any, element: HTMLElement) => {
    await user.click(element);
  },
  
  // Click button by text
  clickButton: async (user: any, buttonText: string) => {
    const button = screen.getByRole('button', { name: new RegExp(buttonText, 'i') });
    await user.click(button);
  },
  
  // Click link by text
  clickLink: async (user: any, linkText: string) => {
    const link = screen.getByRole('link', { name: new RegExp(linkText, 'i') });
    await user.click(link);
  },
  
  // Hover over element
  hoverElement: async (user: any, element: HTMLElement) => {
    await user.hover(element);
  },
  
  // Focus element
  focusElement: async (user: any, element: HTMLElement) => {
    await user.click(element);
  },
  
  // Type in element
  typeInElement: async (user: any, element: HTMLElement, text: string) => {
    await user.type(element, text);
  },
  
  // Clear and type in element
  clearAndType: async (user: any, element: HTMLElement, text: string) => {
    await user.clear(element);
    await user.type(element, text);
  },
  
  // Press key
  pressKey: async (user: any, key: string) => {
    await user.keyboard(key);
  },
  
  // Tab to next element
  tabToNext: async (user: any) => {
    await user.tab();
  },
  
  // Tab to previous element
  tabToPrevious: async (user: any) => {
    await user.tab({ shift: true });
  },
};

// Accessibility testing helpers
export const a11yHelpers = {
  // Check if element has proper ARIA label
  expectAriaLabel: (element: HTMLElement, expectedLabel: string) => {
    expect(element).toHaveAttribute('aria-label', expectedLabel);
  },
  
  // Check if element has proper ARIA describedby
  expectAriaDescribedBy: (element: HTMLElement, describedById: string) => {
    expect(element).toHaveAttribute('aria-describedby', describedById);
  },
  
  // Check if element is focusable
  expectFocusable: (element: HTMLElement) => {
    expect(element).toHaveAttribute('tabindex');
  },
  
  // Check if element has proper role
  expectRole: (element: HTMLElement, expectedRole: string) => {
    expect(element).toHaveAttribute('role', expectedRole);
  },
  
  // Check keyboard navigation
  testKeyboardNavigation: async (user: any, elements: HTMLElement[]) => {
    // Focus first element
    await user.click(elements[0]);
    expect(elements[0]).toHaveFocus();
    
    // Tab through elements
    for (let i = 1; i < elements.length; i++) {
      await user.tab();
      expect(elements[i]).toHaveFocus();
    }
  },
  
  // Check screen reader announcements
  expectScreenReaderAnnouncement: (text: string) => {
    const announcement = screen.getByRole('status', { hidden: true });
    expect(announcement).toHaveTextContent(text);
  },
  
  // Check color contrast (mock implementation)
  expectGoodColorContrast: (element: HTMLElement) => {
    // In a real implementation, this would check actual color contrast
    const styles = window.getComputedStyle(element);
    expect(styles.color).toBeDefined();
    expect(styles.backgroundColor).toBeDefined();
  },
};

// Animation testing helpers
export const animationHelpers = {
  // Wait for animation to complete
  waitForAnimation: async (element: HTMLElement, timeout: number = 1000) => {
    await waitFor(
      () => {
        const styles = window.getComputedStyle(element);
        expect(styles.animationPlayState).toBe('paused');
      },
      { timeout }
    );
  },
  
  // Skip animations for testing
  skipAnimations: () => {
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-delay: 0.01ms !important;
        transition-duration: 0.01ms !important;
        transition-delay: 0.01ms !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  },
  
  // Test animation states
  expectAnimationState: (element: HTMLElement, state: 'running' | 'paused' | 'finished') => {
    const styles = window.getComputedStyle(element);
    expect(styles.animationPlayState).toBe(state);
  },
};

// Mock component helpers
export const mockHelpers = {
  // Create mock component
  createMockComponent: (name: string, props?: any) => {
    return vi.fn(({ children, ...componentProps }) => (
      <div data-testid={`mock-${name.toLowerCase()}`} data-props={JSON.stringify(componentProps)}>
        {children}
      </div>
    ));
  },
  
  // Mock React Router hooks
  mockRouter: (overrides: any = {}) => ({
    useNavigate: vi.fn(),
    useLocation: vi.fn(() => ({ pathname: '/test', search: '', hash: '', state: null })),
    useParams: vi.fn(() => ({})),
    useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
    ...overrides,
  }),
  
  // Mock custom hooks
  mockHook: <T>(hookName: string, returnValue: T) => {
    return vi.fn(() => returnValue);
  },
  
  // Mock context values
  mockContext: <T>(contextName: string, value: T) => {
    return {
      Provider: ({ children }: { children: ReactNode }) => (
        <div data-context={contextName} data-value={JSON.stringify(value)}>
          {children}
        </div>
      ),
      Consumer: ({ children }: { children: (value: T) => ReactNode }) => children(value),
    };
  },
};

// Snapshot testing helpers
export const snapshotHelpers = {
  // Create component snapshot
  expectComponentSnapshot: (component: ReactElement, options: any = {}) => {
    const { container } = componentHelpers.renderWithProviders(component, options);
    expect(container.firstChild).toMatchSnapshot();
  },
  
  // Create inline snapshot
  expectInlineSnapshot: (component: ReactElement, options: any = {}) => {
    const { container } = componentHelpers.renderWithProviders(component, options);
    expect(container.firstChild).toMatchInlineSnapshot();
  },
  
  // Update snapshots
  updateSnapshots: () => {
    // This would be handled by the test runner
    console.log('Snapshots would be updated');
  },
};