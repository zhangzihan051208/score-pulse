"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { messages } from "./messages";
import { LOCALES, type Locale } from "@/lib/types";

const STORAGE_KEY = "sideline-locale";
const COOKIE_KEY = "sideline-locale";

type I18nValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (typeof messages)[Locale];
};

const I18nContext = createContext<I18nValue | null>(null);

const listeners = new Set<() => void>();
let current: Locale = "en";

function isLocale(value: string | null | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}

function emit() {
  listeners.forEach((listener) => listener());
}

function getSnapshot(): Locale {
  return current;
}

function getServerSnapshot(): Locale {
  return "en";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function detectLocale(): Locale {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isLocale(stored)) return stored;
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_KEY}=`))
    ?.split("=")[1];
  if (isLocale(cookie)) return cookie;
  const nav = (navigator.language || "en").toLowerCase();
  if (nav.startsWith("zh")) return "zh";
  if (nav.startsWith("ja")) return "ja";
  if (nav.startsWith("es")) return "es";
  return "en";
}

function persist(next: Locale) {
  window.localStorage.setItem(STORAGE_KEY, next);
  document.cookie = `${COOKIE_KEY}=${next};path=/;max-age=31536000;samesite=lax`;
  document.documentElement.lang = next === "zh" ? "zh-CN" : next;
}

function writeLocale(next: Locale) {
  if (current === next) {
    persist(next);
    return;
  }
  current = next;
  persist(next);
  emit();
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    writeLocale(detectLocale());
  }, []);

  const setLocale = useCallback((next: Locale) => {
    writeLocale(next);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale,
      t: messages[locale],
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used inside LocaleProvider");
  }
  return ctx;
}
