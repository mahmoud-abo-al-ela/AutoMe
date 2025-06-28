import React from "react";
import { Scale } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { compareUtils } from "@/lib/utils";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

const EmptyCompare = ({ singleCar }) => {
  const router = useRouter();

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleRemove = (id) => {
    compareUtils.removeFromCompare(id);
    window.dispatchEvent(new Event("compareListUpdated"));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 md:p-8">
      {singleCar ? (
        <div className="flex flex-col md:flex-row md:items-center gap-4 sm:gap-6 md:gap-8">
          <div className="w-full md:w-1/3 relative">
            <Button
              onClick={() => handleRemove(singleCar.id)}
              className="absolute top-1 sm:top-2 right-1 sm:right-2 text-red-500 hover:bg-red-50 z-10 bg-white rounded-full cursor-pointer p-1 h-auto w-auto min-w-0 min-h-0"
              aria-label="Remove from compare"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <div className="aspect-[4/3] relative mb-2 sm:mb-3">
              <Image
                src={singleCar.images[0].url}
                alt={
                  singleCar.title ||
                  `${singleCar.year} ${singleCar.make} ${singleCar.model}`
                }
                fill
                className="object-cover rounded-md"
              />
            </div>
            <h3 className="font-semibold text-sm sm:text-base mb-1">
              {singleCar.title ||
                `${singleCar.year} ${singleCar.make} ${singleCar.model}`}
            </h3>
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs sm:text-sm">
              {formatPrice(singleCar.price)}
            </Badge>
          </div>

          <div className="w-full md:w-2/3 flex flex-col items-center text-center mt-4 md:mt-0">
            <div className="bg-blue-50 p-3 sm:p-4 rounded-full mb-3 sm:mb-4">
              <Scale className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-blue-500" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">
              Need One More Car to Compare
            </h2>
            <p className="text-sm sm:text-base text-gray-500 max-w-md mb-4 sm:mb-6">
              You need at least 2 cars to compare. Add another car to your
              comparison list.
            </p>
            <Button asChild size="sm" className="sm:text-base sm:h-10 md:h-11">
              <Link href="/cars">
                Browse More Cars
                <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 sm:py-12 md:py-16 px-4 text-center">
          <div className="bg-blue-50 p-3 sm:p-4 rounded-full mb-3 sm:mb-4">
            <Scale className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-blue-500" />
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold mb-1 sm:mb-2">
            No Cars to Compare
          </h2>
          <p className="text-sm sm:text-base text-gray-500 max-w-md mb-4 sm:mb-6">
            You need at least 2 cars to compare. Browse our inventory and add
            cars to your comparison list.
          </p>
          <Button asChild size="sm" className="sm:text-base sm:h-10 md:h-11">
            <Link href="/cars">Browse Cars</Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyCompare;
