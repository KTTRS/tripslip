import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Hook to handle RTL (Right-to-Left) layout for Arabic language
 * Automatically updates document direction and language attributes
 * 
 * @example
 * ```tsx
 * function App() {
 *   useRTL();
 *   return <div>Content</div>;
 * }
 * ```
 */
export function useRTL() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const isRTL = i18n.language === 'ar';
    
    // Update document direction
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    
    // Update document language
    document.documentElement.lang = i18n.language;
    
    // Add/remove RTL class for additional styling if needed
    if (isRTL) {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  }, [i18n.language]);
}

/**
 * Get current RTL status
 * @returns True if current language is RTL
 */
export function isRTL(language: string): boolean {
  return language === 'ar';
}

/**
 * Get text direction for current language
 * @returns 'rtl' or 'ltr'
 */
export function getTextDirection(language: string): 'rtl' | 'ltr' {
  return isRTL(language) ? 'rtl' : 'ltr';
}
