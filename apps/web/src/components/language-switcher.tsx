"use client";

import { useLanguage } from "@/providers/language-provider";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  function changeLocale(nextLocale: "en" | "lt") {
    setLocale(nextLocale);
    window.location.reload();
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        className={`border rounded px-3 py-1 ${locale === "en" ? "font-semibold" : ""}`}
        onClick={() => changeLocale("en")}
      >
        EN
      </button>

      <button
        type="button"
        className={`border rounded px-3 py-1 ${locale === "lt" ? "font-semibold" : ""}`}
        onClick={() => changeLocale("lt")}
      >
        LT
      </button>
    </div>
  );
}