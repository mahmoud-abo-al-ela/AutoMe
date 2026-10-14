import { getCarById } from "@/actions/cars-listing";
import {
  CarImageGallery,
  CarInfoCard,
  Breadcrumbs,
  CarDetailsTabs,
  MobileStickyBar,
  ListingAssistant,
  CarHistoryCard,
} from "./";
import CarSpecifications from "./CarSpecifications";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { OpenChatFromLink } from "@/components/StreamChat";
import { BuyerTargetProvider } from "@/components/BuyerAccess";
import type { CarDetail } from "../_lib/car-detail-types";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import CarWebMcpTools from "./CarWebMcpTools";
import { carToolSummary } from "../_lib/webmcp-summary";
import { isListingAssistantOffered } from "@/lib/services/car/listing-assistant";
import { marketPricesFor, toMarketPosition } from "@/lib/services/car/market-price";
import { logError } from "@/lib/utils/errors";
import { after } from "next/server";
import { recordMcpReferral } from "@/lib/services/mcp/referrals";

/**
 * Whether this dealer's plan offers buyers the assistant, with answers left
 * this month. A failed check hides it rather than taking the page down: the
 * listing matters more than the assistant on it.
 */
async function assistantOffered(organizationId: string): Promise<boolean> {
  try {
    return await isListingAssistantOffered(organizationId);
  } catch (error) {
    logError("Listing assistant availability check failed; hiding it", error);
    return false;
  }
}

const CarContent = async ({ id, mcpMedium = null }: { id: string; mcpMedium?: string | null }) => {
  // Server component: getTranslations, not the useTranslations hook.
  const t = await getTranslations("carDetail.errors");
  // withErrorHandling has already logged a failure; it answers, never throws.
  const response = await getCarById(id);

  // A car that does not exist, is hidden, or belongs to another dealership's
  // storefront is the not-found page (noindex, the site's own 404 copy) — not
  // an error box saying a fetch failed, which is what a deleted listing's old
  // link used to show.
  if (!response.success && response.error.code === "NOT_FOUND") notFound();

  if (!response.success) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-16">
        <div role="alert" className="flex flex-col gap-2 rounded-control border border-destructive bg-destructive-soft p-5">
          <p className="font-semibold">{t("fetchError")}</p>
          <p className="text-caption text-muted-foreground">{response.error.message || t("fetchFailed")}</p>
        </div>
      </div>
    );
  }

  const car: CarDetail = response.data;
  if (!car) notFound();

  // A visit from an MCP answer's link, counted after the response — only now
  // that the car is found, so a made-up id counts nothing.
  if (mcpMedium) {
    const medium = mcpMedium;
    after(() => recordMcpReferral("car", car.id, medium));
  }

  const [showAssistant, marketPrices] = await Promise.all([
    assistantOffered(car.organizationId),
    // Same comparison the listing assistant quotes; null when there are too
    // few comparable listings, or the read fails (best effort).
    marketPricesFor(car),
  ]);
  const market = marketPrices ? toMarketPosition(marketPrices) : null;

  return (
    // The buyer buttons on this page act on this car's dealership.
    <BuyerTargetProvider
      target={{ organizationId: car.organizationId, organizationSlug: car.organization?.slug, carId: car.id }}
    >
    <div className="mx-auto w-full max-w-[1360px] px-4 pb-16 pt-4 sm:px-6 md:pt-6 xl:px-0">
      <Breadcrumbs car={car} />

      {/*
        One render of the info card, placed by the grid: second in the DOM
        (right after the gallery on phones), spanning the side column on
        desktop. Rendering it twice — once per breakpoint — duplicated the
        page's h1 and its id.
      */}
      <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
        <CarImageGallery images={car.images} make={car.make} model={car.model} title={car.title} />

        <aside className="lg:col-start-2 lg:row-span-5 lg:row-start-1">
          <div className="lg:sticky lg:top-[96px]">
            <CarInfoCard car={car} market={market} />
          </div>
        </aside>

        <CarSpecifications car={car} variant="compact" />
        <CarDetailsTabs car={car} />
        <CarHistoryCard car={car} terms={car.organization?.terms} />
        {showAssistant && <ListingAssistant carId={car.id} />}
      </div>

      <MobileStickyBar car={car} />

      {/* The car, offered to a browser agent (WebMCP) where the browser has it. */}
      <CarWebMcpTools summary={carToolSummary(car, (await getLocale()) as Locale)} />

      {/* Opens this car's chat when the page is reached back from sign-in. */}
      <Suspense fallback={null}>
        <OpenChatFromLink carId={car.id} />
      </Suspense>
    </div>
    </BuyerTargetProvider>
  );
};

export default CarContent;
