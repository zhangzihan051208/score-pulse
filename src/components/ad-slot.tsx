"use client";

import { useI18n } from "@/i18n/use-i18n";

const copy = {
  zh: {
    label: "广告位",
    hint: "预留给 iOS、Android 和网页，接入后显示在这里。",
  },
  en: {
    label: "Ad space",
    hint: "Reserved on iOS, Android, and web. An ad shows here once one is connected.",
  },
  es: {
    label: "Espacio publicitario",
    hint: "Reservado en iOS, Android y la web. El anuncio aparece aquí cuando se conecte.",
  },
  ja: {
    label: "広告枠",
    hint: "iOS・Android・ウェブ共通の枠です。接続後にここに表示します。",
  },
  de: {
    label: "Werbefläche",
    hint: "Reserviert für iOS, Android und das Web. Eine Anzeige erscheint hier, sobald sie angebunden ist.",
  },
} as const;

/** Empty banner. The phone app renders the same slot. No ad SDK is loaded. */
export function AdSlot() {
  const { locale } = useI18n();
  const text = copy[locale] ?? copy.en;
  return (
    <aside
      aria-label={text.label}
      className="border-b border-dashed border-amber-800/25 bg-[#f3e6c8] text-[#6d5a45]"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[#8a5a12]">{text.label}</p>
          <p className="text-xs leading-5">{text.hint}</p>
        </div>
        <p className="text-[10px] font-semibold tracking-wide text-[#a08050]">iOS · Android · Web</p>
      </div>
    </aside>
  );
}
