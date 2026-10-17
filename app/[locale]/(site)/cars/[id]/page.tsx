import { PageSkeleton, CarContent } from "./_components";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  localeAlternates,
  openGraphLocale,
  openGraphAlternateLocales,
} from "@/lib/utils/seo-meta";
import type { Locale } from "@/i18n/routing";
import { mcpReferralMedium } from "@/lib/services/mcp/referrals";
import { carPageText, loadCar } from "./_lib/car-seo";
import { defaultShareImage } from "@/lib/utils/page-seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  const typedLocale = locale as Locale;
  const t = await getTranslations({ locale, namespace: "carDetail.meta" });
  const unavailable = { title: t("notFoundTitle"), description: t("notFoundDescription") };
  // A listing that does not exist is noindex outright, not left to the
  // not-found page: the layout streams, so the response may already be a 200
  // by then. Only for a confirmed miss — a failed read must not tell search
  // engines to drop a listing that is still for sale.
  const missing = { ...unavailable, robots: { index: false } };

  try {
    // The same read CarContent makes, once per request (loadCar is cached).
    const response = await loadCar(id);
    if (!response.success) return response.error.code === "NOT_FOUND" ? missing : unavailable;
    if (!response.data) return missing;

    const car = response.data;
    const alternates = localeAlternates(`/cars/${id}`, typedLocale);
    const { title, description } = await carPageText(car, typedLocale);

    // The detail payload serializes images as {url, alt}, not as bare strings.
    const first = car.images?.[0];
    const image = typeof first === "string" ? first : first?.url;

    return {
      // No brand suffix here: the root layout's title template appends it, and
      // doing it twice is how the home tab once read "AutoMe | AutoMe".
      title,
      description,
      alternates,
      openGraph: {
        title,
        description,
        type: "website",
        url: alternates.canonical,
        siteName: "AutoMe",
        locale: openGraphLocale(typedLocale),
        alternateLocale: openGraphAlternateLocales(typedLocale),
        images: [image ? { url: image, alt: title } : defaultShareImage(typedLocale)],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        ...(image && { images: [image] }),
      },
    };
  } catch {
    // A failed lookup must not take the page down with it; the page itself
    // handles a missing car and renders its own not-found state.
    return unavailable;
  }
}

const CarPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const { id } = await params;
  // Opened from an MCP answer's link: counted once the car is found.
  const mcpMedium = mcpReferralMedium(await searchParams);

  return (
    <Suspense fallback={<PageSkeleton />}>
      <CarContent id={id} mcpMedium={mcpMedium} />
    </Suspense>
  );
};

export default CarPage;
