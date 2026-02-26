// i18n configuration
export { initI18n } from './config';
export { default as i18n } from './config';

// RTL utilities
export { useRTL, isRTL, getTextDirection } from './useRTL';

// Components
export { LanguageSelector } from './LanguageSelector';

// Re-export react-i18next hooks
export { useTranslation, Trans, Translation } from 'react-i18next';

// Translation resources
export { default as en } from './locales/en.json';
export { default as es } from './locales/es.json';
export { default as ar } from './locales/ar.json';
