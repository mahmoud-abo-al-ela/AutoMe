"use client";

import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Star,
  XCircle,
  Trash2,
  MoreHorizontal,
  Eye,
  CheckCircle,
  Clock,
  Pencil,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import StatusBadge from "./StatusBadge";
import type { CarRowProps } from "./CarsListPresenter";

const CarTableRow = ({
  car,
  isCarDisabled,
  isThisCarUpdating,
  isThisCarDeleting,
  onUpdateCar,
  onConfirmDelete,
}: CarRowProps) => {
  const t = useTranslations("org.cars");
  const tStatus = useTranslations("carAttributes.status");
  const { price, number, date } = useFormatters();
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;
  
  // Normalize status to lowercase for consistent comparison
  const carStatus = car.status.toLowerCase();

  return (
    <TableRow
      key={car.id}
      className={`hover:bg-blue-50/30 transition-all duration-200 border-b border-gray-100 ${isCarDisabled ? "opacity-60 pointer-events-none" : ""
        }`}
    >
      <TableCell className="py-4 md:py-6">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative">
            <Image
              src={car.images[0]}
              alt={car.title ?? ""}
              className={`h-16 w-24 md:h-16 md:w-20 lg:h-20 lg:w-28 rounded-xl object-cover shadow-md border border-gray-200 transition-all relative ${isCarDisabled ? "grayscale" : ""
                }`}
              width={112}
              height={80}
            />
            {isThisCarDeleting && (
              <div className="absolute inset-0 bg-red-500/20 rounded-xl flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
              </div>
            )}
            {isThisCarUpdating && (
              <div className="absolute inset-0 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              </div>
            )}
            {car.featured && (
              <Star
                className="ms-1 text-yellow-400 absolute -top-2 -start-2 sm:hidden"
                size={20}
                fill="currentColor"
              />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm md:text-base font-semibold text-gray-900 mb-1 max-w-[180px] md:max-w-none flex items-center overflow-hidden">
              <span className="truncate">{car.title}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 md:gap-3 text-xs md:text-sm text-gray-500 mt-1">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                <span>{number(car.year, { useGrouping: false })}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                <span className="truncate max-w-20 md:max-w-32">
                  {car.location}
                </span>
              </div>
              <div className="flex md:hidden items-center gap-1 bg-green-50 px-2 py-1 rounded">
                <span className="font-semibold text-green-700 text-sm">
                  {price(Number(car.price))}
                </span>
              </div>
              <div className="flex md:hidden">
                <StatusBadge status={carStatus} compact={true} />
              </div>
              <div className="hidden lg:flex items-center gap-1">
                <span className="text-xs text-gray-500">
                  {t("table.added", { date: date(car.createdAt) })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="py-4 md:py-6 hidden md:table-cell">
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <span className="font-bold text-base md:text-lg text-gray-900">
              {price(Number(car.price))}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell className="py-4 md:py-6 hidden md:table-cell">
        <div className="space-y-2">
          <StatusBadge status={carStatus} />
        </div>
      </TableCell>
      <TableCell className="py-4 md:py-6 hidden md:table-cell">
        <div className="space-y-2 w-fit">
          {car.featured ? (
            <div className="flex items-center gap-1 bg-yellow-500/20 p-2 rounded-md">
              <Star className="h-4 w-4 text-yellow-400" size={20} />
              <span className="text-xs text-gray-500">{t("table.featured")}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-gray-500/20 p-2 rounded-md">
              <XCircle className="h-4 w-4 text-gray-600" size={20} />
              <span className="text-xs text-gray-500">{t("table.notFeatured")}</span>
            </div>
          )}
        </div>
      </TableCell>

      <TableCell className="p-0 md:py-6">
        <div className="flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 relative cursor-pointer"
                disabled={isCarDisabled}
              >
                <span className="sr-only">{t("rowActions.openMenu")}</span>
                {isThisCarUpdating || isThisCarDeleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
                ) : (
                  <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 sm:w-48 bg-white border shadow-lg"
            >
              <DropdownMenuLabel className="text-xs sm:text-sm">
                {t("rowActions.label")}
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => window.open(`/cars/${car.id}`, "_blank")}
                className="cursor-pointer"
                disabled={isCarDisabled}
              >
                <Eye className="me-1 sm:me-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">{t("rowActions.view")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/org/${slug}/cars/${car.id}/edit`)}
                className="cursor-pointer"
                disabled={isCarDisabled}
              >
                <Pencil className="me-1 sm:me-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">{t("rowActions.edit")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  onUpdateCar(car.id, {
                    featured: !car.featured,
                    status: car.status,
                  })
                }
                className="cursor-pointer"
                disabled={isCarDisabled}
              >
                <Star className="me-1 sm:me-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">
                  {car.featured
                    ? t("rowActions.unfeature")
                    : t("rowActions.feature")}
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs sm:text-sm">
                {t("rowActions.statusLabel")}
              </DropdownMenuLabel>
              {carStatus !== "available" && (
                <DropdownMenuItem
                  onClick={() =>
                    onUpdateCar(car.id, {
                      status: "AVAILABLE",
                      featured: car.featured, // Maintain featured status
                    })
                  }
                  className="cursor-pointer"
                  disabled={isCarDisabled}
                >
                  <CheckCircle className="me-1 sm:me-2 h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  <span className="text-xs sm:text-sm">{tStatus("AVAILABLE")}</span>
                </DropdownMenuItem>
              )}{" "}
              {carStatus !== "sold" && (
                <DropdownMenuItem
                  onClick={() =>
                    onUpdateCar(car.id, {
                      status: "SOLD",
                      featured: car.featured, // Maintain featured status
                    })
                  }
                  className="cursor-pointer"
                  disabled={isCarDisabled}
                >
                  <XCircle className="me-1 sm:me-2 h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                  <span className="text-xs sm:text-sm">{tStatus("SOLD")}</span>
                </DropdownMenuItem>
              )}{" "}
              {carStatus !== "unavailable" && (
                <DropdownMenuItem
                  onClick={() =>
                    onUpdateCar(car.id, {
                      status: "UNAVAILABLE",
                      featured: car.featured, // Maintain featured status
                    })
                  }
                  className="cursor-pointer"
                  disabled={isCarDisabled}
                >
                  <Clock className="me-1 sm:me-2 h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                  <span className="text-xs sm:text-sm">{tStatus("UNAVAILABLE")}</span>
                </DropdownMenuItem>
              )}{" "}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onConfirmDelete(car)}
                className="cursor-pointer text-red-600 focus:text-red-600"
                disabled={isCarDisabled}
              >
                <Trash2 className="me-1 sm:me-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">{t("rowActions.delete")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default CarTableRow;
