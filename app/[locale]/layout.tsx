import { Inter, Cairo } from "next/font/google";
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
import { clerkLocalization } from "@/i18n/clerk-localization";

// NOTE: the font stack in globals.css names these families directly rather
// than using the --font-* variables below. next/font expands those to
// `"Inter", "Inter Fallback"`, and Inter Fallback is local(Arial), which
// covers Arabic and would intercept it before Cairo. See globals.css.
//
// `adjustFontFallback: false` does NOT remove that face — it was tried and
// the fallback is still emitted — so the ordering is what fixes it.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Inter has no Arabic coverage. Car makes and models stay Latin ("Toyota
// Corolla" is not transliterated), so an Arabic listing title mixes both
// scripts inside one string and the two faces have to sit together.
//
// Cairo is the de-facto UI face for Egyptian consumer products, which is the
// market this ships to — it is what a reader here expects a marketplace to
// look like. It also has a large x-height, so it holds up at the small sizes
// this app uses heavily (~760 of its type utilities are text-sm or smaller).
//
// Loaded as a variable font: one file covers 200-1000, so there is no weight
// to forget. The previous face was pinned to 400/500/600/700, which is why
// font-extrabold rendered as synthesised faux-bold in Arabic.
const arabic = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  /**
   * The brand suffix is applied here, once, and nowhere else.
   *
   * Every page used to append its own — with three different separators
   * ("|", "-") and three different brand strings ("AutoMe", "AutoMe Admin",
   * "AutoMe Platform"). Once the Arabic pages started supplying a translated
   * title that also carried the brand, tabs read
   * "تصفح السيارات | أوتومي | AutoMe". Pages now set only their own name.
   *
   * The brand stays Latin in both locales: it is a proper noun, and per the
   * i18n rule we do not transliterate names.
   */
  title: {
    default: "AutoMe",
    template: "%s | AutoMe",
  },
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

  // Clerk draws its own sign-in, sign-up and account UI, which next-intl
  // cannot reach into. Without this the auth screens stay English on /ar.
  return (
    <ClerkProvider localization={clerkLocalization[locale]}>
      <html
        lang={locale}
        dir={dir}
        className={`${inter.variable} ${arabic.variable} scroll-smooth h-full`}
      >
        <body
          // font-sans resolves per glyph from the stack in globals.css, so a
          // mixed-script string renders Latin in Inter and Arabic in IBM Plex
          // Sans Arabic. Swapping className wholesale used to push Latin car
          // names through the Arabic face on /ar.
          className="font-sans flex flex-col min-h-screen"
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
