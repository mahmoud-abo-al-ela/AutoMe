"use client";

import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { PricePlate } from "@/components/brand";
import ShareDialog from "./ShareDialog";
import CarHeader from "./CarHeader";
import CarActionButtons from "./CarActionButtons";
import CarActions from "./CarActions";
import { MarketPriceBlock } from "./MarketPriceBlock";
import { useCarInfoCard } from "./hooks/useCarInfoCard";
import type { CarDetail } from "../_lib/car-detail-types";
import type { MarketPosition } from "@/lib/services/car/market-price";

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

/**
 * The decision panel (Figma: Car detail — price panel): what it is, what it
 * costs, whether that is a fair price, who sells it, and how to reach them.
 * Sticky beside the gallery on desktop; inline under it on phones, where the
 * contact bar (MobileStickyBar) carries the primary action.
 */
const CarInfoCard = ({ car, market }: { car: CarDetail; market: MarketPosition | null }) => {
  const t = useTranslations("carDetail.dealership");
  const {
    isLoading,
    isScheduleLoading,
    isFavorite,
    isInCompare,
    isShareDialogOpen,
    setIsShareDialogOpen,
    testDriveId,
    isCheckingTestDrive,
    handleToggleFavorite,
    handleToggleCompare,
    handleShare,
    handleGoToCompare,
    handleScheduleTestDrive,
    handleViewTestDrive,
    handleChatClick,
    isSignedIn,
  } = useCarInfoCard(car);

  const organization = car.organization;

  return (
    <>
      <section aria-labelledby="car-title" className="flex flex-col gap-5 rounded-control border border-border bg-card p-5 sm:p-6">
        <CarHeader car={car} />

        <div className="flex flex-wrap items-end justify-between gap-3">
          <PricePlate amount={car.price} currency={car.priceCurrency} size="lg" />
          <CarActionButtons
            isFavorite={isFavorite}
            isInCompare={isInCompare}
            isLoading={isLoading}
            onToggleFavorite={handleToggleFavorite}
            onToggleCompare={handleToggleCompare}
            onShare={handleShare}
          />
        </div>

        <MarketPriceBlock market={market} currency={car.priceCurrency} />

        {organization && (
          <Link
            href={`/dealerships/${organization.slug}`}
            className="group flex items-center gap-3 rounded-control border border-border p-3 transition-colors hover:border-border-strong"
          >
            {organization.logo ? (
              // Dealership logos are arbitrary remote URLs (see MainHeader).
              // eslint-disable-next-line @next/next/no-img-element
              <img src={organization.logo} alt="" className="size-11 shrink-0 rounded-control border border-border bg-field object-contain" />
            ) : (
              <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-control border-2 border-border-strong bg-marker text-body font-black">
                {initialsOf(organization.name)}
              </span>
            )}
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-micro text-muted-foreground">{t("soldBy")}</span>
              <span className="truncate text-caption font-semibold">{organization.name}</span>
            </span>
            <ChevronRight aria-hidden className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
          </Link>
        )}

        <CarActions
          car={car}
          testDriveId={testDriveId}
          isCheckingTestDrive={isCheckingTestDrive}
          isScheduleLoading={isScheduleLoading}
          isInCompare={isInCompare}
          onScheduleTestDrive={handleScheduleTestDrive}
          onViewTestDrive={handleViewTestDrive}
          onGoToCompare={handleGoToCompare}
          isSignedIn={isSignedIn}
          onChatClick={handleChatClick}
        />
      </section>

      <ShareDialog isOpen={isShareDialogOpen} onOpenChange={setIsShareDialogOpen} car={car} />
    </>
  );
};

export default CarInfoCard;
