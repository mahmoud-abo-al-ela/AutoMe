"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ArrowRight } from "lucide-react";
import { compareUtils } from "@/lib/utils";
import { useRouter } from "next/navigation";

const CompareTable = ({ cars }) => {
  const router = useRouter();
  const [hoveredCar, setHoveredCar] = useState(null);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatMileage = (mileage) => {
    return new Intl.NumberFormat("en-US", {
      style: "unit",
      unit: "mile",
      maximumFractionDigits: 0,
    }).format(mileage);
  };

  const handleRemove = (id) => {
    compareUtils.removeFromCompare(id);
    window.dispatchEvent(new Event("compareListUpdated"));
    router.refresh();
  };

  const specCategories = [
    {
      title: "Basic Information",
      specs: [
        { label: "Make", key: "make" },
        { label: "Model", key: "model" },
        { label: "Year", key: "year" },
        { label: "Price", key: "price", format: formatPrice },
        { label: "Body Type", key: "bodyType" },
      ],
    },
    {
      title: "Performance & Specifications",
      specs: [
        { label: "Mileage", key: "mileage", format: formatMileage },
        { label: "Fuel Type", key: "fuelType" },
        { label: "Transmission", key: "transmission" },
        { label: "Color", key: "color" },
        { label: "Seats", key: "seats" },
      ],
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header with car images and basic info */}
      <div className="grid grid-cols-[200px_1fr] md:grid-cols-[250px_1fr]">
        <div className="p-4 bg-gray-50 border-b border-r">
          <h2 className="font-semibold text-lg">Compare Cars</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 border-b">
          {cars.map((car, index) => (
            <div
              key={car.id}
              className={`p-4 relative border-r last:border-r-0 ${
                hoveredCar === car.id ? "bg-blue-50" : ""
              }`}
              onMouseEnter={() => setHoveredCar(car.id)}
              onMouseLeave={() => setHoveredCar(null)}
            >
              <Button
                onClick={() => handleRemove(car.id)}
                className="absolute top-2 right-2 text-red-500 hover:bg-red-50 z-10 bg-white rounded-full cursor-pointer"
                aria-label="Remove from compare"
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="aspect-[4/3] relative mb-3">
                <Image
                  src={car.images[0].url}
                  alt={car.title || `${car.year} ${car.make} ${car.model}`}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              <h3 className="font-semibold text-sm md:text-base mb-1 line-clamp-2">
                {car.title || `${car.year} ${car.make} ${car.model}`}
              </h3>
              <div className="flex items-center justify-between mb-3">
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                  {formatPrice(car.price)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {car.year}
                </Badge>
              </div>
              <Button asChild size="sm" className="w-full">
                <Link href={`/cars/${car.id}`}>
                  View Details
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          ))}
          {/* Empty slots */}
          {Array(3 - cars.length)
            .fill(null)
            .map((_, index) => (
              <div
                key={`empty-${index}`}
                className="p-4 border-r last:border-r-0 flex flex-col items-center justify-center bg-gray-50"
              >
                <p className="text-gray-400 text-sm">Add a car to compare</p>
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <Link href="/cars">Browse Cars</Link>
                </Button>
              </div>
            ))}
        </div>
      </div>

      {/* Specifications comparison */}
      {specCategories.map((category) => (
        <div key={category.title}>
          <div className="grid grid-cols-[200px_1fr] md:grid-cols-[250px_1fr] bg-gray-100">
            <div className="p-3 font-medium border-b border-r">
              {category.title}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 border-b">
              {Array(3)
                .fill(null)
                .map((_, index) => (
                  <div
                    key={`header-${index}`}
                    className={`p-3 border-r last:border-r-0 ${
                      index < cars.length
                        ? hoveredCar === cars[index].id
                          ? "bg-blue-50"
                          : ""
                        : "bg-gray-50"
                    }`}
                  ></div>
                ))}
            </div>
          </div>

          {category.specs.map((spec) => (
            <div
              key={spec.key}
              className="grid grid-cols-[200px_1fr] md:grid-cols-[250px_1fr] border-b last:border-b-0"
            >
              <div className="p-3 text-sm text-gray-700 border-r bg-gray-50">
                {spec.label}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3">
                {cars.map((car) => (
                  <div
                    key={`${car.id}-${spec.key}`}
                    className={`p-3 text-sm border-r last:border-r-0 ${
                      hoveredCar === car.id ? "bg-blue-50" : ""
                    }`}
                    onMouseEnter={() => setHoveredCar(car.id)}
                    onMouseLeave={() => setHoveredCar(null)}
                  >
                    {spec.format
                      ? spec.format(car[spec.key])
                      : car[spec.key] || "-"}
                  </div>
                ))}
                {/* Empty slots */}
                {Array(3 - cars.length)
                  .fill(null)
                  .map((_, index) => (
                    <div
                      key={`empty-${spec.key}-${index}`}
                      className="p-3 text-sm border-r last:border-r-0 text-gray-400 bg-gray-50"
                    >
                      -
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Features comparison */}
      <div className="grid grid-cols-[200px_1fr] md:grid-cols-[250px_1fr] bg-gray-100">
        <div className="p-3 font-medium border-b border-r">Features</div>
        <div className="grid grid-cols-2 md:grid-cols-3 border-b">
          {Array(3)
            .fill(null)
            .map((_, index) => (
              <div
                key={`features-header-${index}`}
                className={`p-3 border-r last:border-r-0 ${
                  index < cars.length
                    ? hoveredCar === cars[index].id
                      ? "bg-blue-50"
                      : ""
                    : "bg-gray-50"
                }`}
              ></div>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-[200px_1fr] md:grid-cols-[250px_1fr] border-b">
        <div className="p-3 text-sm text-gray-700 border-r bg-gray-50">
          Features List
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3">
          {cars.map((car) => (
            <div
              key={`${car.id}-features`}
              className={`p-3 text-sm border-r last:border-r-0 ${
                hoveredCar === car.id ? "bg-blue-50" : ""
              }`}
              onMouseEnter={() => setHoveredCar(car.id)}
              onMouseLeave={() => setHoveredCar(null)}
            >
              {car.features && car.features.length > 0 ? (
                <ul className="list-disc pl-4 space-y-1">
                  {car.features.map((feature, idx) => (
                    <li key={idx} className="text-xs">
                      {feature}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-gray-400">No features listed</span>
              )}
            </div>
          ))}
          {/* Empty slots */}
          {Array(3 - cars.length)
            .fill(null)
            .map((_, index) => (
              <div
                key={`empty-features-${index}`}
                className="p-3 text-sm border-r last:border-r-0 text-gray-400 bg-gray-50"
              >
                -
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default CompareTable;
