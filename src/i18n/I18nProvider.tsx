import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';
import enTranslations from './locales/en/translation.json';
import esTranslations from './locales/es/translation.json';
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

const flattenTranslations = (source: unknown, prefix = ''): Record<string, string> => {
  if (typeof source === 'string') {
    return prefix ? { [prefix]: source } : {};
  }
  if (source === null || source === undefined || typeof source !== 'object') {
    return {};
  }

  return Object.entries(source as Record<string, unknown>).reduce<Record<string, string>>((acc, [key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    Object.assign(acc, flattenTranslations(value, nextKey));
    return acc;
  }, {});
};

const flatEn = flattenTranslations(enTranslations as unknown);
const flatEs = flattenTranslations(esTranslations as unknown);

const getFallback = (language: Language): Record<string, string> => {
  const langTranslations = translations[language];
  const langFlat = language === 'es' ? flatEs : flatEn;
  return { ...langTranslations, ...langFlat };
};

const initializeI18n = (initialLanguage: Language) => {
  if (i18n.isInitialized) {
    return;
  }

  const mergedEn = {
    ...translations.en,
    ...flatEn,
  };
  const mergedEs = {
    ...translations.es,
    ...flatEs,
  };

  void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: {
          translation: mergedEn,
        },
        es: {
          translation: mergedEs,
        },
      },
      fallbackLng: 'es',
      lng: initialLanguage,
      keySeparator: false,
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage'],
        lookupLocalStorage: STORAGE_KEY,
      },
    });

  z.setErrorMap(zodI18nMap);
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initializeI18n(language);
    if (!ready) {
      setReady(true);
    }
  }, [language, ready]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    localStorage.setItem(STORAGE_KEY, nextLanguage);
    void i18n.changeLanguage(nextLanguage);
  }, []);

  const t = useCallback(
    (key: string, values?: Record<string, string | number>) => {
      if (i18n.isInitialized) {
        return i18n.t(key, values);
      }

      const fallback = getFallback(language);
      const template = fallback[key] || key;

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
