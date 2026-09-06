"use client";

import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { useCarAttributes } from "@/hooks/use-car-attributes";
import type { CarDetail } from "../_lib/car-detail-types";
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

const CarSpecifications = ({
  car,
  variant = "compact",
}: {
  car: CarDetail | null;
  variant?: "compact" | "full";
}) => {
  const t = useTranslations("carDetail.specs");
  const tFields = useTranslations("carAttributes.fields");
  const tHeader = useTranslations("carDetail.header");
  const fmt = useFormatters();
  const attr = useCarAttributes();

  // Maps the CarStatus enum to a translated label. Rendering car.status
  // directly printed the raw "AVAILABLE" in both languages.
  const statusLabel = (status: CarDetail["status"]) =>
    status === "SOLD"
      ? tHeader("statusSold")
      : status === "UNAVAILABLE"
        ? tHeader("statusUnavailable")
        : tHeader("statusAvailable");

  // Hooks must run before any early return.
  if (!car) return null;

  const isFull = variant === "full";

  const carSpecs = [
    {
      label: tFields("year"),
      value: fmt.number(car.year, { useGrouping: false }),
      icon: CalendarIcon,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20",
    },
    {
      label: tFields("mileage"),
      value: fmt.mileage(car.mileage),
      icon: Gauge,
      color: "text-green-500 bg-green-50 dark:bg-green-950/20",
    },
    {
      label: tFields("fuelType"),
      value: attr.fuel(car.fuelType) || t("notSpecified"),
      icon: Fuel,
      color: "text-orange-500 bg-orange-50 dark:bg-orange-950/20",
    },
    {
      label: tFields("transmission"),
      value: attr.transmission(car.transmission) || t("notSpecified"),
      icon: Cog,
      color: "text-purple-500 bg-purple-50 dark:bg-purple-950/20",
    },
    {
      label: tFields("bodyType"),
      value: attr.body(car.bodyType) || t("notSpecified"),
      icon: Users,
      color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20",
    },
    {
      label: tFields("location"),
      value: car.location || t("notSpecified"),
      icon: MapPin,
      color: "text-red-500 bg-red-50 dark:bg-red-950/20",
    },
    ...(isFull ? [
      {
        label: tFields("color"),
        value: attr.color(car.color) || t("notSpecified"),
        icon: Paintbrush,
        color: "text-pink-500 bg-pink-50 dark:bg-pink-950/20",
      },
      {
        label: tFields("seats"),
        value: car.seats
                  ? t("seatsValue", { count: fmt.number(car.seats) })
                  : t("notSpecified"),
        icon: Armchair,
        color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950/20",
      },
      {
        label: tFields("status"),
        // car.status is a CarStatus enum member, so this rendered the raw
                // "AVAILABLE" in both languages.
                value: statusLabel(car.status),
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
            {t("title")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("subtitle")}
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
        {t("keyTitle")}
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
                  <div className="text-micro sm:text-xs text-gray-500 uppercase tracking-wide">
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
