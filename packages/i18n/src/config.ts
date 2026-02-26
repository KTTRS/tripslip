import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import es from './locales/es.json';
import ar from './locales/ar.json';

/**
 * Initialize i18next with TripSlip translations
 * Supports English, Spanish, and Arabic
 */
export function initI18n() {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        es: { translation: es },
        ar: { translation: ar },
      },
      fallbackLng: 'en',
      supportedLngs: ['en', 'es', 'ar'],
      interpolation: {
        escapeValue: false, // React already escapes
      },
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
        lookupLocalStorage: 'tripslip_language',
      },
      react: {
        useSuspense: false,
      },
    });

  return i18n;
}

export default i18n;
