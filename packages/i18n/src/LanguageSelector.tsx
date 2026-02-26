import { useTranslation } from 'react-i18next';

/**
 * Language selector component
 * Allows users to switch between English, Spanish, and Arabic
 */
export function LanguageSelector() {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  ];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <select
      value={i18n.language}
      onChange={(e) => handleLanguageChange(e.target.value)}
      className="px-3 py-2 border-2 border-black rounded-md font-sans text-body bg-white"
      aria-label="Select language"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.nativeName}
        </option>
      ))}
    </select>
  );
}
