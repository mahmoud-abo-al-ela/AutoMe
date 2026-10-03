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
import type { CarDetail } from "../_lib/car-detail-types";
import { getTranslations } from "next-intl/server";
import { isListingAssistantOffered } from "@/lib/services/car/listing-assistant";
import { marketPricesFor, toMarketPosition } from "@/lib/services/car/market-price";
import { logError } from "@/lib/utils/errors";

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

const CarContent = async ({ id }: { id: string }) => {
  // Server component: getTranslations, not the useTranslations hook.
  const t = await getTranslations("carDetail.errors");
  let car: CarDetail;
  try {
    const response = await getCarById(id);
    if (!response.success) {
      throw new Error(response.error.message || t("fetchFailed"));
    }
    car = response.data;
  } catch (error) {
    console.error("Error fetching car:", error);
    const errorMessage = error instanceof Error ? error.message : t("fetchError");
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-16">
        <div role="alert" className="flex flex-col gap-2 rounded-control border border-destructive bg-destructive-soft p-5">
          <p className="font-semibold">{t("fetchError")}</p>
          <p className="text-caption text-muted-foreground">{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (!car) return notFound();

  const [showAssistant, marketPrices] = await Promise.all([
    assistantOffered(car.organizationId),
    // Same comparison the listing assistant quotes; null when there are too
    // few comparable listings, or the read fails (best effort).
    marketPricesFor(car),
  ]);
  const market = marketPrices ? toMarketPosition(marketPrices) : null;

  return (
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

      {/* Opens this car's chat when the page is reached back from sign-in. */}
      <Suspense fallback={null}>
        <OpenChatFromLink carId={car.id} />
      </Suspense>
    </div>
  );
};

export default CarContent;
