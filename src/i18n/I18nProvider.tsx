import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Language, languages, translations } from './translations';

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const STORAGE_KEY = 'foodflow-language';

const getInitialLanguage = (): Language => {
  const savedLanguage = localStorage.getItem(STORAGE_KEY);
  return languages.includes(savedLanguage as Language) ? (savedLanguage as Language) : 'es';
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    localStorage.setItem(STORAGE_KEY, nextLanguage);
  }, []);

  const t = useCallback(
    (key: string, values?: Record<string, string | number>) => {
      const template = translations[language][key] || translations.es[key] || key;

      if (!values) {
        return template;
      }

      return Object.entries(values).reduce(
        (text, [name, value]) => text.split(`{${name}}`).join(String(value)),
        template
      );
    },
    [language]
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }

  return context;
}
