// Accessibility utilities

// Check color contrast ratio (WCAG 2.1 AA requires 4.5:1 for normal text)
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1)
  const l2 = getLuminance(color2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function getLuminance(color: string): number {
  const rgb = hexToRgb(color)
  if (!rgb) return 0

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
    val = val / 255
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  })

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null
}

// Check if contrast meets WCAG AA standard
export function meetsWCAGAA(color1: string, color2: string, isLargeText: boolean = false): boolean {
  const ratio = getContrastRatio(color1, color2)
  return isLargeText ? ratio >= 3 : ratio >= 4.5
}

// Generate accessible label
export function generateAriaLabel(text: string, context?: string): string {
  const cleanText = text.trim()
  return context ? `${cleanText}, ${context}` : cleanText
}

// Trap focus within modal
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus()
        e.preventDefault()
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus()
        e.preventDefault()
      }
    }
  }

  element.addEventListener('keydown', handleKeyDown)

  // Focus first element
  firstElement?.focus()

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown)
  }
}

// Announce to screen readers
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Check if user prefers reduced motion
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Keyboard navigation helper
export function handleKeyboardNavigation(
  event: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number
): number {
  let newIndex = currentIndex

  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      event.preventDefault()
      newIndex = (currentIndex + 1) % items.length
      break
    case 'ArrowUp':
    case 'ArrowLeft':
      event.preventDefault()
      newIndex = (currentIndex - 1 + items.length) % items.length
      break
    case 'Home':
      event.preventDefault()
      newIndex = 0
      break
    case 'End':
      event.preventDefault()
      newIndex = items.length - 1
      break
  }

  items[newIndex]?.focus()
  return newIndex
}
