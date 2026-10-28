import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { LocaleBody } from "@/components/locale-body";
import { DegradedBanner } from "@/components/degraded-banner";
import { NavigationProgress } from "@/components/navigation-progress";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ClientChromeExtras } from "@/components/client-chrome-extras";
import { LocaleProvider } from "@/i18n/locale-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const display = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "Grandstand",
    template: "%s · Grandstand",
  },
  description:
    "Fan tribune for overseas leagues. Five-axis player ratings, community boards, six languages.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <LocaleProvider>
          <NavigationProgress />
          <DegradedBanner />
          <SiteHeader />
          <ClientChromeExtras />
          <main className="flex-1">
            <LocaleBody>{children}</LocaleBody>
          </main>
          <SiteFooter />
        </LocaleProvider>
      </body>
    </html>
  );
}
