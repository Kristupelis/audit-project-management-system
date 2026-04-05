"use client";

import { useLanguage } from "@/providers/language-provider";

export function useT() {
  const { dict } = useLanguage();
  return dict;
}