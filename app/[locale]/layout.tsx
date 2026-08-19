import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { DirectionProvider } from "@radix-ui/react-direction";
import "../globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import LoadingProvider from "@/components/LoadingProvider";
import { StreamChatProvider } from "@/components/StreamChat";
import QueryProvider from "@/components/providers/QueryProvider";
import { routing, localeDirection } from "@/i18n/routing";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Geist/Inter have no Arabic coverage. Car makes and models stay Latin
// ("Toyota Corolla" is not transliterated), so an Arabic listing title mixes
// both scripts inside one string — the two faces have to sit together without
// looking broken. IBM Plex Sans Arabic is chosen for its x-height match with
// Inter rather than for the name.
const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AutoMe",
  description: "Find your dream car",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // An unknown prefix must 404 rather than silently fall back, or /fr/cars
  // would serve English content on a URL we never want indexed.
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Required for any statically-rendered page in this tree to see the locale.
  setRequestLocale(locale);

  const dir = localeDirection[locale];

  return (
    <ClerkProvider>
      <html
        lang={locale}
        dir={dir}
        className={`${inter.variable} ${arabic.variable} scroll-smooth h-full`}
      >
        <body
          className={`${locale === "ar" ? arabic.className : inter.className} flex flex-col min-h-screen`}
        >
          {/* Radix does not read `dir` off the document — without this every
              popover, dropdown and slider keeps LTR collision logic in Arabic. */}
          <DirectionProvider dir={dir}>
            <NextIntlClientProvider>
              <LoadingProvider>
                <QueryProvider>
                  <StreamChatProvider>{children}</StreamChatProvider>
                </QueryProvider>
              </LoadingProvider>
            </NextIntlClientProvider>
          </DirectionProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
