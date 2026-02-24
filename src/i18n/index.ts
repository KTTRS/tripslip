import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';
import ar from './locales/ar.json';

export const RTL_LANGUAGES = ['ar'];

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, es: { translation: es }, ar: { translation: ar } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = RTL_LANGUAGES.includes(lng) ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
});

export default i18n;
