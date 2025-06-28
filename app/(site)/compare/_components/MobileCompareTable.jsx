"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { compareUtils } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const MobileCompareTable = ({ cars }) => {
  const router = useRouter();
  const [expandedCar, setExpandedCar] = useState(null);

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

  const handleRemove = (id, e) => {
    e.stopPropagation(); // Prevent triggering other click events
    compareUtils.removeFromCompare(id);
    window.dispatchEvent(new Event("compareListUpdated"));
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
      {cars.map((car) => (
        <div key={car.id} className="border-b last:border-b-0">
          <div className="p-4 relative">
            <Button
              onClick={(e) => handleRemove(car.id, e)}
              className="absolute top-2 right-0 text-red-500 hover:bg-red-50 z-10 bg-white rounded-full cursor-pointer p-1 h-auto w-auto min-w-0 min-h-0"
              aria-label="Remove from compare"
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="flex gap-3">
              <div className="w-1/3 aspect-[4/3] relative">
                <Image
                  src={car.images[0].url}
                  alt={car.title || `${car.year} ${car.make} ${car.model}`}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              <div className="w-2/3">
                <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                  {car.title || `${car.year} ${car.make} ${car.model}`}
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs">
                    {formatPrice(car.price)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {car.year}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs flex items-center justify-center"
                  onClick={() =>
                    setExpandedCar(expandedCar === car.id ? null : car.id)
                  }
                >
                  {expandedCar === car.id ? (
                    <>
                      Hide Details <ChevronUp className="ml-1 h-3 w-3" />
                    </>
                  ) : (
                    <>
                      Show Details <ChevronDown className="ml-1 h-3 w-3" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {expandedCar === car.id && (
              <div className="mt-4 border-t pt-4">
                <Accordion type="single" collapsible className="w-full">
                  {specCategories.map((category, idx) => (
                    <AccordionItem key={idx} value={`item-${idx}`}>
                      <AccordionTrigger className="text-sm font-medium py-2">
                        {category.title}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {category.specs.map((spec) => (
                            <div
                              key={spec.key}
                              className="flex justify-between text-xs"
                            >
                              <span className="text-gray-500">
                                {spec.label}:
                              </span>
                              <span className="font-medium">
                                {spec.format
                                  ? spec.format(car[spec.key])
                                  : car[spec.key] || "-"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}

                  <AccordionItem value="features">
                    <AccordionTrigger className="text-sm font-medium py-2">
                      Features
                    </AccordionTrigger>
                    <AccordionContent>
                      {car.features && car.features.length > 0 ? (
                        <ul className="list-disc pl-4 space-y-1 text-xs">
                          {car.features.map((feature, idx) => (
                            <li key={idx}>{feature}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400 text-xs">
                          No features listed
                        </span>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="mt-4 pt-3 border-t">
                  <Button asChild size="sm" className="w-full">
                    <Link href={`/cars/${car.id}`}>
                      View Details
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Empty slots for adding more cars */}
      {cars.length < 3 && (
        <div className="p-4 flex flex-col items-center justify-center bg-gray-50 text-center">
          <p className="text-gray-400 text-sm mb-2">
            Add {3 - cars.length} more {3 - cars.length === 1 ? "car" : "cars"}{" "}
            to compare
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/cars">Browse Cars</Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default MobileCompareTable;
