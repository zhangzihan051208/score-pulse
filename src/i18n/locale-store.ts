"use client";

import { LOCALES, type Locale } from "@/lib/types";

const KEY = "sideline-locale";

const listeners = new Set<() => void>();
let current: Locale = "en";
let ready = false;

function isLocale(value: string | null): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function getLocaleSnapshot(): Locale {
  if (typeof window === "undefined") return "en";
  if (!ready) {
    const stored = window.localStorage.getItem(KEY);
    current = isLocale(stored) ? stored : "en";
    ready = true;
  }
  return current;
}

export function getServerLocale(): Locale {
  return "en";
}

export function subscribeLocale(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setLocale(next: Locale) {
  current = next;
  window.localStorage.setItem(KEY, next);
  document.documentElement.lang = next === "zh" ? "zh-CN" : next;
  listeners.forEach((listener) => listener());
}
