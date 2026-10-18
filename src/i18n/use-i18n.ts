"use client";

import { useSyncExternalStore } from "react";
import { messages } from "./messages";
import {
  getLocaleSnapshot,
  getServerLocale,
  setLocale,
  subscribeLocale,
} from "./locale-store";

export function useI18n() {
  const locale = useSyncExternalStore(
    subscribeLocale,
    getLocaleSnapshot,
    getServerLocale,
  );
  return {
    locale,
    setLocale,
    t: messages[locale],
  };
}
