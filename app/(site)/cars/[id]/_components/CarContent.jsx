import { getCarById } from "@/actions/cars-listing";
import {
  CarImageGallery,
  CarInfoCard,
  Breadcrumbs,
  CarDetailsTabs,
  MobileStickyBar,
} from "./";
import { notFound } from "next/navigation";

const CarContent = async ({ id }) => {
  let car;
  try {
    const response = await getCarById(id);
    if (!response.success) {
      const errorMsg = typeof response.error === 'string'
        ? response.error
        : response.error?.message || "Failed to fetch car details";
      throw new Error(errorMsg);
    }
    car = response.data;
  } catch (error) {
    console.error("Error fetching car:", error);
    const errorMessage = typeof error === 'string'
      ? error
      : error?.message || "An error occurred while fetching car details";
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Error: {errorMessage}
      </div>
    );
  }

  if (!car) return notFound();

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
    </div>
  );
};

export default CarContent;
