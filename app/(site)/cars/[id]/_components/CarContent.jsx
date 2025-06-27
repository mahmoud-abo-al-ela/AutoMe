import { getCarById } from "@/actions/cars-listing";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  CarImageGallery,
  CarDescription,
  CarFeatures,
  CarInfoCard,
  FinancingCard,
} from "./";
import { notFound } from "next/navigation";

const CarContent = async ({ id }) => {
  let car;
  try {
    const response = await getCarById(id);
    if (!response.success) {
      throw new Error(response.error || "Failed to fetch car details");
    }
    car = response.data;
  } catch (error) {
    console.error("Error fetching car:", error);
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Error: {error.message || "An error occurred while fetching car details"}
      </div>
    );
  }

  if (!car) return notFound();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-15 md:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-0">
        <div className="mb-4 sm:mb-6 md:mb-8 hidden md:block">
          <Link
            href="/cars"
            className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Cars
          </Link>
        </div>

        {/* Responsive grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main content area - full width on mobile, 2/3 on desktop */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
            <CarImageGallery
              images={car.images}
              make={car.make}
              model={car.model}
              title={car.title}
            />
            <div className="block md:hidden">
              <CarInfoCard car={car} />
            </div>
            <CarDescription description={car.description} />
            <CarFeatures features={car.features} />
          </div>

          {/* Sidebar - stacked below on mobile, side by side on desktop */}
          <div className="space-y-4 sm:space-y-6">
            <div className="hidden md:block">
              <CarInfoCard car={car} />
            </div>
            <FinancingCard price={car.price} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarContent;
