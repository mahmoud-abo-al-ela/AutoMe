"use client";
import { formatCarPrice } from "@/lib/utils/currency";
import { formatMileage as formatMileageKm } from "@/lib/utils/units";
import {
  Building2,
  Calendar,
  Car as CarIcon,
  ChevronRight,
  ExternalLink,
  MapPin,
  Fuel,
  Gauge,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { motion } from "framer-motion";
import Image from "next/image";
import { usePathname } from "@/i18n/navigation";
import { getCarColorHex } from "@/lib/constants/car-options";
import CarCardActions from "./CarCardActions";
import type { SerializedCar } from "@/lib/utils/serializers";

/**
 * Cards are rendered from several sources (featured, listings, wishlist), which
 * agree on the serialized car but differ on whether the wishlist flag rode
 * along, so it is optional here rather than part of SerializedCar.
 */
type CarCardCar = SerializedCar & { isWishlisted?: boolean };

const CarCard = ({
  car,
  onWishlistChange,
  index = 0,
}: {
  car: CarCardCar;
  onWishlistChange?: (removedCarId: string) => void;
  index?: number;
}) => {
  const [imageError, setImageError] = useState(false);
  const pathname = usePathname();
  const isWishlistPage = pathname === "/wishlist";

  // Reads the listing's own currency rather than assuming the market default.
  const formatPrice = (price: number) =>
    formatCarPrice(price, "en", car.priceCurrency);

  const formatMileage = (mileage: number) => formatMileageKm(mileage);

  const carTitle = car.title || `${car.year} ${car.make} ${car.model}`;
  const subtitle = [car.bodyType, car.transmission].filter(Boolean).join(" • ");
  const detailHref = `/cars/${car.id}`;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="car-card group/card flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md"
    >
      {/* Media */}
      <div className="group relative overflow-hidden">
        <Link href={detailHref} aria-label={carTitle}>
          <div className="relative aspect-[16/9] overflow-hidden bg-muted">
            {car.images?.[0] && !imageError ? (
              <Image
                src={car.images[0]}
                alt={carTitle}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                onError={() => setImageError(true)}
                priority={index < 3}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <CarIcon className="h-10 w-10 text-muted-foreground/40" />
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="absolute bottom-3 start-3 z-10">
              <span className="inline-flex items-center justify-center rounded-lg border border-white/50 bg-white/90 px-3 py-1.5 text-sm font-extrabold text-slate-900 shadow-lg backdrop-blur-md transition-transform duration-300 group-hover:scale-105 sm:text-base">
                {formatPrice(car.price)}
              </span>
            </div>
          </div>
        </Link>

        {/* Action buttons (siblings of the media link, not nested) */}
        <CarCardActions
          carId={car.id}
          isWishlisted={car?.isWishlisted || false}
          onWishlistChange={onWishlistChange}
          isWishlistPage={isWishlistPage}
        />
      </div>

      {/* Body */}
      <div className="flex flex-grow flex-col bg-card p-3 sm:p-5">
        <Link href={detailHref} className="block">
          <div className="mb-2 sm:mb-2.5">
            <h3 className="line-clamp-1 text-sm font-semibold tracking-tight sm:text-base">
              {carTitle}
            </h3>
            {subtitle && (
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>

          <div className="mb-3 grid grid-cols-2 gap-x-2 gap-y-2 text-xs text-muted-foreground sm:mb-4 sm:gap-y-2.5">
            <div className="flex items-center">
              <div className="me-1.5 rounded-full bg-muted p-1">
                <Calendar className="h-3 w-3 text-muted-foreground sm:h-3.5 sm:w-3.5" />
              </div>
              <span className="font-medium text-foreground">{car.year}</span>
            </div>
            {car.mileage != null && (
              <div className="flex items-center">
                <div className="me-1.5 rounded-full bg-muted p-1">
                  <Gauge className="h-3 w-3 text-muted-foreground sm:h-3.5 sm:w-3.5" />
                </div>
                <span className="truncate font-medium text-foreground">{formatMileage(car.mileage)}</span>
              </div>
            )}
            {car.fuelType && (
              <div className="flex items-center">
                <div className="me-1.5 rounded-full bg-muted p-1">
                  <Fuel className="h-3 w-3 text-muted-foreground sm:h-3.5 sm:w-3.5" />
                </div>
                <span className="truncate font-medium text-foreground">{car.fuelType}</span>
              </div>
            )}
            {car.location && (
              <div className="flex items-center">
                <div className="me-1.5 rounded-full bg-muted p-1">
                  <MapPin className="h-3 w-3 text-muted-foreground sm:h-3.5 sm:w-3.5" />
                </div>
                <span className="truncate font-medium text-foreground">{car.location}</span>
              </div>
            )}
          </div>

          <div className="mb-4 flex flex-wrap gap-1.5 sm:mb-5 sm:gap-2">
            {car.bodyType && (
              <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                {car.bodyType}
              </Badge>
            )}
            {car.transmission && (
              <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                {car.transmission}
              </Badge>
            )}
            {car.color && (
              <Badge
                variant="outline"
                className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full border border-border shadow-inner"
                  style={{ backgroundColor: getCarColorHex(car.color) }}
                />
                {car.color}
              </Badge>
            )}
          </div>
        </Link>

        {car.organization && (
          <>
            <div className="mb-3 h-px w-full bg-border" />
            <Link
              href={`/dealerships/${car.organization.slug}`}
              className="group/dealer mb-3 flex items-center gap-2 px-1 sm:mb-4"
            >
              {car.organization.logo ? (
                <Image
                  src={car.organization.logo}
                  alt={car.organization.name}
                  width={24}
                  height={24}
                  className="h-5 w-5 flex-shrink-0 rounded-full border border-border object-cover shadow-sm transition-colors group-hover/dealer:border-primary/50 sm:h-6 sm:w-6"
                />
              ) : (
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-border bg-muted transition-colors group-hover/dealer:border-primary/50 sm:h-6 sm:w-6">
                  <Building2 className="h-3 w-3 text-muted-foreground sm:h-3.5 sm:w-3.5" />
                </div>
              )}
              <span className="truncate text-xs font-medium text-muted-foreground transition-colors group-hover/dealer:text-primary">
                {car.organization.name}
              </span>
              <span className="ms-auto flex items-center text-[10px] text-primary opacity-0 transition-all duration-300 group-hover/dealer:translate-x-1 group-hover/dealer:opacity-100">
                View dealer <ChevronRight className="h-3 w-3" />
              </span>
            </Link>
          </>
        )}

        <div className="mt-auto">
          <Link href={detailHref} className="block">
            <Button
              size="sm"
              className="group/cta h-8 w-full gap-1.5 rounded-lg text-xs shadow-md transition-all duration-300 hover:shadow-lg sm:h-9"
            >
              View Details
              <ExternalLink className="h-3 w-3 transition-transform duration-300 group-hover/cta:-translate-y-0.5 group-hover/cta:translate-x-1 sm:h-3.5 sm:w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default CarCard;
