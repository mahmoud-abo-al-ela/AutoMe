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
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { OpenChatFromLink } from "@/components/StreamChat";
import type { CarDetail } from "../_lib/car-detail-types";
import { getTranslations } from "next-intl/server";
import { isListingAssistantOffered } from "@/lib/services/car/listing-assistant";
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
    const errorMessage =
      error instanceof Error
        ? error.message
        : t("fetchError");
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Error: {errorMessage}
      </div>
    );
  }

  if (!car) return notFound();

  const showAssistant = await assistantOffered(car.organizationId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-15 md:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs car={car} />

        {/* Responsive grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main content area - full width on mobile, 2/3 on desktop */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <CarImageGallery
              images={car.images}
              make={car.make}
              model={car.model}
              title={car.title}
            />

            {/* Mobile: show CarInfoCard between gallery and content */}
            <div className="block lg:hidden">
              <CarInfoCard car={car} />
            </div>

            {/* Tabbed Content: Description, Features, Specifications */}
            <CarDetailsTabs car={car} />

            <CarHistoryCard car={car} terms={car.organization?.terms} />

            {showAssistant && <ListingAssistant carId={car.id} />}
          </div>

          {/* Sidebar - sticky on desktop, hidden on mobile (shown inline above) */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4 sm:space-y-6">
              <CarInfoCard car={car} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA bar */}
      <MobileStickyBar car={car} />

      {/* Opens this car's chat when the page is reached back from sign-in. */}
      <Suspense fallback={null}>
        <OpenChatFromLink carId={car.id} />
      </Suspense>
    </div>
  );
};

export default CarContent;
