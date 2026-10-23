/** @deprecated Import Dict from @/i18n/dict and load via @/i18n/load-messages */
export type { Dict } from "@/i18n/dict";
export { localeLabels } from "@/i18n/locale-labels";
export { getMessagesSync, loadMessages } from "@/i18n/load-messages";

import type { Locale } from "@/lib/types";
import type { Dict } from "@/i18n/dict";
import en from "@/i18n/catalog/en";

/** Sync bundle of English only — for type inference in server utilities */
export const messages = { en } satisfies Record<"en", Dict>;

export type MessagesCatalog = typeof messages;
