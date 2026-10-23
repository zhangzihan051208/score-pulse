import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Locale } from "./catalog";

const copy = {
  zh: {
    brand: "看台",
    tagline: "评这一夜，不看名气",
    rankings: "评分榜",
    players: "现役",
    teams: "球队",
    legends: "名宿",
    allRoles: "全部位置",
    search: "搜索名字",
    empty: "这个分类里还没有人",
    privacy: "隐私政策",
    comments: "评论",
    honors: "历史荣誉",
    roster: "阵容",
    axes: "五维",
    language: "English",
    homeLead: "七个项目的现役、球队和名宿榜。点进一个项目，再按位置看名次。",
    privacyTitle: "隐私政策",
    privacyBody:
      "看台的应用版把评分榜放在你的手机里。这个版本不注册账号，不上传通讯录，不投放广告，也不接入统计 SDK。名单、评分和头像都随安装包一起提供。系统可能记录应用崩溃日志，那部分由 Google Play 或 App Store 按它们自己的政策处理。",
  },
  en: {
    brand: "Grandstand",
    tagline: "Grade the night, not the reputation",
    rankings: "Rankings",
    players: "Active",
    teams: "Teams",
    legends: "Legends",
    allRoles: "All roles",
    search: "Search names",
    empty: "Nobody in this group yet",
    privacy: "Privacy",
    comments: "Comments",
    honors: "Honors",
    roster: "Squad",
    axes: "Five axes",
    language: "中文",
    homeLead: "Active players, clubs, and legends across seven sports. Open a sport, then rank it by role.",
    privacyTitle: "Privacy policy",
    privacyBody:
      "The Grandstand app keeps the honor boards on your phone. This version has no account, no contact upload, no ads, and no analytics SDK. Rosters, ratings, and portraits ship inside the install. The store may keep crash logs under its own policy.",
  },
} as const;

type Copy = { [K in keyof (typeof copy)["zh"]]: string };

const LocaleContext = createContext<{
  locale: Locale;
  t: Copy;
  toggle: () => void;
} | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("zh");
  const value = useMemo(
    () => ({
      locale,
      t: copy[locale],
      toggle: () => setLocale((current) => (current === "zh" ? "en" : "zh")),
    }),
    [locale],
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("LocaleProvider missing");
  return value;
}
