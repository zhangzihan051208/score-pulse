import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { LocaleBody } from "@/components/locale-body";
import { DegradedBanner } from "@/components/degraded-banner";
import { NavigationProgress } from "@/components/navigation-progress";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { LocaleProvider } from "@/i18n/locale-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Sideline",
    template: "%s · Sideline",
  },
  description:
    "Hupu-style sports boards for overseas leagues. Five grades per match, one simple card, four languages.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <LocaleProvider>
          <NavigationProgress />
          <DegradedBanner />
          <SiteHeader />
          <main className="flex-1">
            <LocaleBody>{children}</LocaleBody>
          </main>
          <SiteFooter />
        </LocaleProvider>
      </body>
    </html>
  );
}
