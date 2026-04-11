"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { getDictionary, type Locale } from "@/i18n/get-dictionary";
import type { TranslationDictionary } from "@/i18n/en";

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dict: TranslationDictionary;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  function setLocale(locale: Locale) {
    setLocaleState(locale);
    window.localStorage.setItem("locale", locale);
    document.cookie = `locale=${locale}; path=/; max-age=31536000; samesite=lax`;
  }

  const value = useMemo<LanguageContextType>(
    () => ({
      locale,
      setLocale,
      dict: getDictionary(locale),
    }),
    [locale],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return ctx;
}