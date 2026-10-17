import { Inter, Cairo } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { DirectionProvider } from "@radix-ui/react-direction";
import "../globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { StreamChatProvider } from "@/components/StreamChat";
import QueryProvider from "@/components/providers/QueryProvider";
import { routing, localeDirection } from "@/i18n/routing";
import { clerkLocalization } from "@/i18n/clerk-localization";
import { getTranslations } from "next-intl/server";
import { getCurrentOrganization } from "@/lib/getOrganization";
import { requestOrigin } from "@/lib/utils/page-seo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const arabic = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-arabic",
  display: "swap",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.meta" });
  const [organization, origin] = await Promise.all([
    getCurrentOrganization(),
    requestOrigin(),
  ]);

  // Resolves relative Open Graph image paths into the absolute URLs social
  // crawlers require. Without it Next falls back to localhost and warns.
  const metadataBase = new URL(origin);

  if (organization) {
    return {
      metadataBase,
      title: {
        default: organization.name,
        template: `%s | ${organization.name}`,
      },
      description:
        organization.description || `${organization.name} — AutoMe`,
      icons: { icon: organization.logo || "/favicon.ico" },
    };
  }

  return {
    metadataBase,
    // The home tab is the one place worth more than the bare brand: it is the
    // title a search result leads with, and "AutoMe" alone says nothing about
    // what the product does.
    title: {
      default: t("title"),
      template: "%s | AutoMe",
    },
    description: t("description"),
  };
}

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

  const dir = localeDirection[locale];

  // Chrome's WebMCP origin trial (Chrome 149–162, until 2027-03-30): the token switches the API
  // on for ordinary visitors. It is bound to one origin, and is public by
  // design — it goes into the page. Unset, nothing is rendered and only
  // browsers with the testing flag see the site's tools.
  const webMcpTrialToken = process.env.NEXT_PUBLIC_WEBMCP_TRIAL_TOKEN;

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${inter.variable} ${arabic.variable} scroll-smooth h-full`}
    >
      {webMcpTrialToken && (
        <head>
          <meta httpEquiv="origin-trial" content={webMcpTrialToken} />
        </head>
      )}
      <body
        // font-sans resolves per glyph from the stack in globals.css, so a
        // mixed-script string renders Latin in Inter and Arabic in IBM Plex
        // Sans Arabic. Swapping className wholesale used to push Latin car
        // names through the Arabic face on /ar.
        className="font-sans flex flex-col min-h-screen"
      >
        {/* Inside <body>, not around <html>: Clerk Core 3 requires it. Clerk
            draws its own sign-in, sign-up and account UI, which next-intl
            cannot reach into — without this the auth screens stay English on /ar. */}
        <ClerkProvider
          localization={clerkLocalization[locale]}
          signInUrl={`/${locale}/sign-in`}
          signUpUrl={`/${locale}/sign-up`}
          // Where any Clerk flow without its own redirect ends up. Clerk's default
          // is "/", which next-intl resolves to /en — the same trap one level down.
          signInFallbackRedirectUrl={`/${locale}`}
          signUpFallbackRedirectUrl={`/${locale}`}
          // After signing out from any UserButton: the reader's own home page.
          // Core 3 moved this here from each UserButton (hooks/use-auth-redirects).
          afterSignOutUrl={`/${locale}`}
        >
          {/* Radix does not read `dir` off the document — without this every
              popover, dropdown and slider keeps LTR collision logic in Arabic. */}
          <DirectionProvider dir={dir}>
            <NextIntlClientProvider>
              <QueryProvider>
                <StreamChatProvider>{children}</StreamChatProvider>
              </QueryProvider>
            </NextIntlClientProvider>
          </DirectionProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
