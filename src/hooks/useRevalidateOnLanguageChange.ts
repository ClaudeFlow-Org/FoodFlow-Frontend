import { useEffect, useRef } from 'react';

export function useRevalidateOnLanguageChange(
  trigger: () => void,
  language: string
) {
  const prevLanguage = useRef(language);

  useEffect(() => {
    if (prevLanguage.current !== language) {
      prevLanguage.current = language;
      trigger();
    }
  }, [language, trigger]);
}
