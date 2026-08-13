"use client";

import { formatMileage } from "@/lib/utils/units";
import {
  Fuel,
  Gauge,
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Cog,
  Paintbrush,
  Armchair,
  Activity,
} from "lucide-react";

const CarSpecifications = ({ car, variant = "compact" }) => {
  if (!car) return null;

  const isFull = variant === "full";

  const carSpecs = [
    {
      label: "Year",
      value: car.year,
      icon: CalendarIcon,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20",
    },
    {
      label: "Mileage",
      value: formatMileage(car.mileage),
      icon: Gauge,
      color: "text-green-500 bg-green-50 dark:bg-green-950/20",
    },
    {
      label: "Fuel Type",
      value: car.fuelType,
      icon: Fuel,
      color: "text-orange-500 bg-orange-50 dark:bg-orange-950/20",
    },
    {
      label: "Transmission",
      value: car.transmission,
      icon: Cog,
      color: "text-purple-500 bg-purple-50 dark:bg-purple-950/20",
    },
    {
      label: "Body Type",
      value: car.bodyType,
      icon: Users,
      color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20",
    },
    {
      label: "Location",
      value: car.location || "Not Specified",
      icon: MapPin,
      color: "text-red-500 bg-red-50 dark:bg-red-950/20",
    },
    ...(isFull ? [
      {
        label: "Color",
        value: car.color || "Not Specified",
        icon: Paintbrush,
        color: "text-pink-500 bg-pink-50 dark:bg-pink-950/20",
      },
      {
        label: "Seats",
        value: car.seats ? `${car.seats} Seats` : "Not Specified",
        icon: Armchair,
        color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950/20",
      },
      {
        label: "Status",
        value: car.status || "Available",
        icon: Activity,
        color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20",
      },
    ] : []),
  ];

  if (isFull) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Technical Specifications
          </h3>
          <p className="text-xs text-muted-foreground">
            Detailed information about this vehicle's build and configuration.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {carSpecs.map((spec, index) => {
            const Icon = spec.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-200"
              >
                <div className={`p-2.5 rounded-xl ${spec.color} flex-shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground uppercase font-medium tracking-wide">
                    {spec.label}
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">
                    {spec.value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
      <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base sm:text-lg">
        Key Specifications
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {carSpecs.map((spec, index) => {
          const Icon = spec.icon;
          return (
            <div
              key={index}
              className="bg-gray-50 dark:bg-slate-900/50 p-2 sm:p-4 rounded-lg sm:rounded-xl hover:bg-gray-100 dark:hover:bg-slate-900 transition-colors"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-white dark:bg-slate-850 ${spec.color.split(' ')[0]}`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">
                    {spec.label}
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100 text-xs sm:text-sm md:text-base truncate">
                    {spec.value}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CarSpecifications;
