import en from "./en";
import lt from "./lt";

export type Locale = "en" | "lt";

export type TranslationDictionary = typeof en;

export function getDictionary(locale: Locale): TranslationDictionary {
  return locale === "lt" ? lt : en;
}