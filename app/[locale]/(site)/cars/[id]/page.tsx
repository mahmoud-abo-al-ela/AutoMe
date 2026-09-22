import { PageSkeleton, CarContent } from "./_components";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCarById } from "@/actions/cars-listing";
import { resolveCarTitle, resolveCarDescription } from "@/lib/utils/car-text";
import {
  localeAlternates,
  openGraphLocale,
  openGraphAlternateLocales,
  truncateForMeta,
} from "@/lib/utils/seo-meta";
import type { Locale } from "@/i18n/routing";

/**
 * The car detail page had no metadata at all, so every listing shared the
 * root layout's generic title and had no description, no canonical and no
 * hreflang — on the most link-worthy page in the product.
 *
 * The title and description are derived rather than stored: a meta title is a
 * template over facts the row already has, and a meta description is the first
 * 155 characters of the listing text. Asking the model for four more fields
 * would have cost tokens and added two more things that can be wrong, to
 * produce something a template computes exactly.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  const typedLocale = locale as Locale;
  const t = await getTranslations({ locale, namespace: "carDetail.meta" });
  const alternates = localeAlternates(`/cars/${id}`, typedLocale);

  try {
    // Fetched again by CarContent below. The dealership page does the same and
    // roadmap 5.4 is where request-level caching lands; worth knowing this is
    // two reads per view on an SEO-critical page, not one.
    const response = await getCarById(id);

    if (!response.success || !response.data) {
      return { title: t("notFoundTitle"), description: t("notFoundDescription") };
    }

    const car = response.data;

    // Falls back across languages before falling back to the generated form,
    // so an Arabic page with no Arabic title still gets a real headline.
    const title =
      resolveCarTitle(car, typedLocale)?.text ??
      t("generatedTitle", {
        year: String(car.year),
        make: car.make,
        model: car.model,
      });

    const resolvedDescription = resolveCarDescription(car, typedLocale);
    const description = resolvedDescription
      ? truncateForMeta(resolvedDescription.text)
      : t("generatedDescription", {
          year: String(car.year),
          make: car.make,
          model: car.model,
        });

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
        ...(image && {
          images: [{ url: image, width: 1200, height: 630, alt: title }],
        }),
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
    return { title: t("notFoundTitle"), description: t("notFoundDescription") };
  }
}

const CarPage = async ({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) => {
  const { id } = await params;

  return (
    <Suspense fallback={<PageSkeleton />}>
      <CarContent id={id} />
    </Suspense>
  );
};

export default CarPage;
