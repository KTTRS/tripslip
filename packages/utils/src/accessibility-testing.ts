/**
 * Accessibility Testing Utilities
 * Provides utilities for testing and validating accessibility compliance
 */

/**
 * Color Contrast Checker
 * Validates color contrast ratios meet WCAG standards
 */
export interface ContrastResult {
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
  passesAALarge: boolean;
  passesAAALarge: boolean;
}

export function checkColorContrast(
  foreground: string,
  background: string
): ContrastResult {
  const fgLuminance = getRelativeLuminance(foreground);
  const bgLuminance = getRelativeLuminance(background);

  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  const ratio = (lighter + 0.05) / (darker + 0.05);

  return {
    ratio,
    passesAA: ratio >= 4.5,
    passesAAA: ratio >= 7,
    passesAALarge: ratio >= 3,
    passesAAALarge: ratio >= 4.5,
  };
}

function getRelativeLuminance(color: string): number {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
    const sRGB = val / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * ARIA Attribute Validator
 * Validates ARIA attributes are used correctly
 */
export interface ARIAValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateARIAAttributes(
  element: HTMLElement
): ARIAValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for required ARIA attributes based on role
  const role = element.getAttribute('role');
  if (role) {
    const requiredAttrs = getRequiredARIAAttributes(role);
    requiredAttrs.forEach((attr) => {
      if (!element.hasAttribute(attr)) {
        errors.push(`Missing required attribute: ${attr} for role="${role}"`);
      }
    });
  }

  // Check for invalid ARIA attribute values
  const ariaAttrs = Array.from(element.attributes).filter((attr) =>
    attr.name.startsWith('aria-')
  );

  ariaAttrs.forEach((attr) => {
    if (!isValidARIAAttribute(attr.name)) {
      errors.push(`Invalid ARIA attribute: ${attr.name}`);
    }

    if (!isValidARIAValue(attr.name, attr.value)) {
      errors.push(
        `Invalid value "${attr.value}" for attribute ${attr.name}`
      );
    }
  });

  // Check for redundant ARIA attributes
  if (element.hasAttribute('aria-label') && element.textContent?.trim()) {
    warnings.push(
      'Element has both aria-label and text content. Consider if both are necessary.'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function getRequiredARIAAttributes(role: string): string[] {
  const requirements: Record<string, string[]> = {
    checkbox: ['aria-checked'],
    radio: ['aria-checked'],
    slider: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
    spinbutton: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
    progressbar: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
    tab: ['aria-selected'],
    option: ['aria-selected'],
    switch: ['aria-checked'],
  };

  return requirements[role] || [];
}

function isValidARIAAttribute(attr: string): boolean {
  const validAttrs = [
    'aria-label',
    'aria-labelledby',
    'aria-describedby',
    'aria-hidden',
    'aria-live',
    'aria-atomic',
    'aria-relevant',
    'aria-busy',
    'aria-controls',
    'aria-expanded',
    'aria-haspopup',
    'aria-pressed',
    'aria-selected',
    'aria-checked',
    'aria-disabled',
    'aria-readonly',
    'aria-required',
    'aria-invalid',
    'aria-valuenow',
    'aria-valuemin',
    'aria-valuemax',
    'aria-valuetext',
    'aria-orientation',
    'aria-sort',
    'aria-level',
    'aria-posinset',
    'aria-setsize',
    'aria-current',
    'aria-modal',
  ];

  return validAttrs.includes(attr);
}

function isValidARIAValue(attr: string, value: string): boolean {
  const booleanAttrs = [
    'aria-hidden',
    'aria-atomic',
    'aria-busy',
    'aria-disabled',
    'aria-readonly',
    'aria-required',
    'aria-modal',
  ];

  if (booleanAttrs.includes(attr)) {
    return value === 'true' || value === 'false';
  }

  if (attr === 'aria-live') {
    return ['off', 'polite', 'assertive'].includes(value);
  }

  if (attr === 'aria-checked' || attr === 'aria-pressed') {
    return ['true', 'false', 'mixed'].includes(value);
  }

  if (attr === 'aria-expanded' || attr === 'aria-selected') {
    return ['true', 'false'].includes(value);
  }

  return true; // Allow other values for now
}

/**
 * Keyboard Navigation Tester
 * Tests if element is keyboard accessible
 */
export interface KeyboardAccessibilityResult {
  accessible: boolean;
  issues: string[];
}

export function checkKeyboardAccessibility(
  element: HTMLElement
): KeyboardAccessibilityResult {
  const issues: string[] = [];

  // Check if interactive element is focusable
  const isInteractive =
    element.tagName === 'BUTTON' ||
    element.tagName === 'A' ||
    element.tagName === 'INPUT' ||
    element.tagName === 'SELECT' ||
    element.tagName === 'TEXTAREA' ||
    element.getAttribute('role') === 'button' ||
    element.getAttribute('role') === 'link' ||
    element.onclick !== null;

  if (isInteractive) {
    const tabIndex = element.getAttribute('tabindex');
    const isNaturallyFocusable = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(
      element.tagName
    );

    if (!isNaturallyFocusable && tabIndex === null) {
      issues.push('Interactive element is not keyboard focusable. Add tabindex="0"');
    }

    if (tabIndex && parseInt(tabIndex) > 0) {
      issues.push(
        'Positive tabindex values should be avoided. Use tabindex="0" or rely on natural tab order'
      );
    }

    if (tabIndex === '-1' && !element.hasAttribute('aria-hidden')) {
      issues.push(
        'Element has tabindex="-1" but is not hidden. This removes it from keyboard navigation'
      );
    }
  }

  // Check for keyboard event handlers
  if (element.onclick && !element.onkeydown && !element.onkeypress) {
    issues.push(
      'Element has onclick handler but no keyboard event handler. Add onKeyDown or onKeyPress'
    );
  }

  return {
    accessible: issues.length === 0,
    issues,
  };
}

/**
 * Heading Structure Validator
 * Validates heading hierarchy is correct
 */
export interface HeadingStructureResult {
  valid: boolean;
  issues: string[];
  headings: Array<{ level: number; text: string }>;
}

export function validateHeadingStructure(
  container: HTMLElement
): HeadingStructureResult {
  const issues: string[] = [];
  const headings: Array<{ level: number; text: string }> = [];

  const headingElements = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let previousLevel = 0;

  headingElements.forEach((heading, index) => {
    const level = parseInt(heading.tagName.substring(1));
    const text = heading.textContent?.trim() || '';

    headings.push({ level, text });

    // Check for skipped levels
    if (previousLevel > 0 && level > previousLevel + 1) {
      issues.push(
        `Heading level skipped: ${heading.tagName} follows h${previousLevel}. Heading levels should not skip.`
      );
    }

    // Check for empty headings
    if (!text) {
      issues.push(`Empty heading found: ${heading.tagName}`);
    }

    // Check for multiple h1s
    if (level === 1 && index > 0 && headings.filter((h) => h.level === 1).length > 1) {
      issues.push('Multiple h1 elements found. Page should have only one h1.');
    }

    previousLevel = level;
  });

  // Check if page has an h1
  if (headings.length > 0 && !headings.some((h) => h.level === 1)) {
    issues.push('Page is missing an h1 element.');
  }

  return {
    valid: issues.length === 0,
    issues,
    headings,
  };
}

/**
 * Form Accessibility Validator
 * Validates form accessibility
 */
export interface FormAccessibilityResult {
  valid: boolean;
  issues: string[];
}

export function validateFormAccessibility(
  form: HTMLFormElement
): FormAccessibilityResult {
  const issues: string[] = [];

  // Check all inputs have labels
  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach((input) => {
    const id = input.getAttribute('id');
    const ariaLabel = input.getAttribute('aria-label');
    const ariaLabelledby = input.getAttribute('aria-labelledby');

    if (!id && !ariaLabel && !ariaLabelledby) {
      issues.push(
        `Input element missing label association. Add id and associated label, aria-label, or aria-labelledby.`
      );
    }

    if (id) {
      const label = form.querySelector(`label[for="${id}"]`);
      if (!label && !ariaLabel && !ariaLabelledby) {
        issues.push(`Input with id="${id}" has no associated label.`);
      }
    }

    // Check required fields have indication
    if (input.hasAttribute('required')) {
      const hasAriaRequired = input.getAttribute('aria-required') === 'true';
      if (!hasAriaRequired) {
        issues.push(
          `Required input should have aria-required="true" for screen reader users.`
        );
      }
    }
  });

  // Check for fieldsets with legends
  const fieldsets = form.querySelectorAll('fieldset');
  fieldsets.forEach((fieldset) => {
    const legend = fieldset.querySelector('legend');
    if (!legend) {
      issues.push('Fieldset is missing a legend element.');
    }
  });

  // Check for error messages
  const errorElements = form.querySelectorAll('[role="alert"], .error, .error-message');
  if (errorElements.length > 0) {
    errorElements.forEach((error) => {
      if (!error.getAttribute('aria-live')) {
        issues.push(
          'Error message should have aria-live="polite" or "assertive" for screen reader announcement.'
        );
      }
    });
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Image Accessibility Validator
 * Validates images have appropriate alt text
 */
export interface ImageAccessibilityResult {
  valid: boolean;
  issues: string[];
}

export function validateImageAccessibility(
  img: HTMLImageElement
): ImageAccessibilityResult {
  const issues: string[] = [];

  const alt = img.getAttribute('alt');
  const role = img.getAttribute('role');

  // Check if alt attribute exists
  if (alt === null) {
    issues.push('Image is missing alt attribute.');
  }

  // Check for redundant text in alt
  if (alt && (alt.toLowerCase().includes('image of') || alt.toLowerCase().includes('picture of'))) {
    issues.push(
      'Alt text should not include "image of" or "picture of". Screen readers already announce it as an image.'
    );
  }

  // Check for file names in alt text
  if (alt && /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(alt)) {
    issues.push('Alt text appears to be a filename. Provide descriptive text instead.');
  }

  // Check decorative images
  if (role === 'presentation' || role === 'none') {
    if (alt && alt.trim() !== '') {
      issues.push(
        'Decorative image (role="presentation") should have empty alt text (alt="").'
      );
    }
  }

  // Check for very long alt text
  if (alt && alt.length > 150) {
    issues.push(
      'Alt text is very long. Consider using aria-describedby for detailed descriptions.'
    );
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Link Accessibility Validator
 * Validates links are accessible
 */
export interface LinkAccessibilityResult {
  valid: boolean;
  issues: string[];
}

export function validateLinkAccessibility(
  link: HTMLAnchorElement
): LinkAccessibilityResult {
  const issues: string[] = [];

  const text = link.textContent?.trim() || '';
  const ariaLabel = link.getAttribute('aria-label');
  const ariaLabelledby = link.getAttribute('aria-labelledby');

  // Check for link text
  if (!text && !ariaLabel && !ariaLabelledby) {
    issues.push('Link has no accessible text. Add text content or aria-label.');
  }

  // Check for generic link text
  const genericTexts = ['click here', 'read more', 'more', 'here', 'link'];
  if (text && genericTexts.includes(text.toLowerCase())) {
    issues.push(
      `Link text "${text}" is not descriptive. Use more specific text that describes the destination.`
    );
  }

  // Check for href
  if (!link.hasAttribute('href')) {
    issues.push('Link is missing href attribute. Use a button if not navigating.');
  }

  // Check for target="_blank" without warning
  if (link.getAttribute('target') === '_blank') {
    const hasWarning =
      text.includes('(opens in new window)') ||
      text.includes('(opens in new tab)') ||
      ariaLabel?.includes('opens in new window') ||
      ariaLabel?.includes('opens in new tab');

    if (!hasWarning) {
      issues.push(
        'Link opens in new window/tab but does not warn users. Add "(opens in new window)" to link text or aria-label.'
      );
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Touch Target Size Validator
 * Validates touch targets meet minimum size requirements
 */
export interface TouchTargetResult {
  valid: boolean;
  width: number;
  height: number;
  meetsMinimum: boolean;
}

export function validateTouchTargetSize(
  element: HTMLElement
): TouchTargetResult {
  const rect = element.getBoundingClientRect();
  const minSize = 44; // WCAG 2.1 Level AAA recommends 44x44 pixels

  return {
    valid: rect.width >= minSize && rect.height >= minSize,
    width: rect.width,
    height: rect.height,
    meetsMinimum: rect.width >= minSize && rect.height >= minSize,
  };
}

/**
 * Focus Indicator Validator
 * Checks if element has visible focus indicator
 */
export function hasFocusIndicator(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element, ':focus');
  const outline = computedStyle.outline;
  const outlineWidth = computedStyle.outlineWidth;
  const boxShadow = computedStyle.boxShadow;

  // Check if there's a visible outline or box-shadow on focus
  return (
    (outline !== 'none' && outlineWidth !== '0px') ||
    (boxShadow !== 'none' && boxShadow !== '')
  );
}
