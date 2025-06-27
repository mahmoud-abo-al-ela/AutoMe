"use client";

import {
  Fuel,
  Gauge,
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Cog,
} from "lucide-react";

const CarSpecifications = ({ car }) => {
  if (!car) return null;

  const carSpecs = [
    {
      label: "Year",
      value: car.year,
      icon: CalendarIcon,
      color: "text-blue-500",
    },
    {
      label: "Mileage",
      value: `${new Intl.NumberFormat().format(car.mileage)} mi`,
      icon: Gauge,
      color: "text-green-500",
    },
    {
      label: "Fuel Type",
      value: car.fuelType,
      icon: Fuel,
      color: "text-orange-500",
    },
    {
      label: "Transmission",
      value: car.transmission,
      icon: Cog,
      color: "text-purple-500",
    },
    {
      label: "Body Type",
      value: car.bodyType,
      icon: Users,
      color: "text-indigo-500",
    },
    {
      label: "Location",
      value: car.location || "New York, NY",
      icon: MapPin,
      color: "text-red-500",
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
      <h3 className="font-bold text-gray-900 text-base sm:text-lg">
        Key Specifications
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {carSpecs.map((spec, index) => (
          <div
            key={index}
            className="bg-gray-50 p-2 sm:p-4 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-white ${spec.color}`}
              >
                <spec.icon className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  {spec.label}
                </div>
                <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                  {spec.value}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CarSpecifications;
