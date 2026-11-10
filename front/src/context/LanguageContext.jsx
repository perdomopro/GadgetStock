/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import translations from '../utils/translations.js';

export const LanguageContext = createContext(null);

export function LanguageProvider({ children, initialLanguage = 'es' }) {
  const [language, setLanguage] = useState(initialLanguage); // 'es' | 'en'

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === 'es' ? 'en' : 'es'));
  }, []);

  const t = useCallback((key) => {
    if (!key) return '';
    const dict = translations[language] || translations.es;
    if (dict[key] !== undefined) return dict[key];

    // Fallback to alternate dictionary if key missing in current language
    const fallbackDict = language === 'es' ? translations.en : translations.es;
    if (fallbackDict && fallbackDict[key] !== undefined) return fallbackDict[key];

    return key;
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    toggleLanguage,
    t,
    translations: translations[language] || translations.es,
  }), [language, toggleLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
