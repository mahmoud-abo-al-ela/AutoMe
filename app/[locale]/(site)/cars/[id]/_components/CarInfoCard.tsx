"use client";

import { Link } from "@/i18n/navigation";
import { Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ShareDialog from "./ShareDialog";
import CarHeader from "./CarHeader";
import CarActionButtons from "./CarActionButtons";
import CarActions from "./CarActions";
import { useCarInfoCard } from "./hooks/useCarInfoCard";
import type { CarDetail } from "../_lib/car-detail-types";
import { useTranslations } from "next-intl";

const CarInfoCard = ({ car }: { car: CarDetail }) => {
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
    formatPrice,
    isSignedIn,
  } = useCarInfoCard(car);

  const organization = car.organization;
  const orgInitials = organization?.name
    ? organization.name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "D";

  return (
    <>
      <Card className="shadow-xl border-0 bg-white p-0 rounded-2xl">
        <CardContent className="p-4 sm:p-6 md:p-8">
          <div className="flex justify-end rtl:justify-start mb-4 sm:mb-6">
            <CarActionButtons
              isFavorite={isFavorite}
              isInCompare={isInCompare}
              isLoading={isLoading}
              onToggleFavorite={handleToggleFavorite}
              onToggleCompare={handleToggleCompare}
              onShare={handleShare}
            />
          </div>

          {/* Car header with badges, title, and price */}
          <CarHeader car={car} formatPrice={formatPrice} />

          {/* Dealership branding section */}
          {organization && (
            <>
              <Separator className="my-4 sm:my-5" />
              <Link
                href={`/dealerships/${organization.slug}`}
                className="flex items-center gap-3 group p-2.5 -mx-2.5 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <Avatar className="h-10 w-10 rounded-lg border border-slate-100 shadow-sm">
                  {organization.logo ? (
                    <AvatarImage
                      src={organization.logo}
                      alt={organization.name}
                      className="object-contain"
                    />
                  ) : null}
                  <AvatarFallback className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-xs">
                    {orgInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground font-medium uppercase tracking-wider">
                      {t("soldBy")}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {organization.name}
                  </span>
                </div>
                <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  {t("view")}
                </span>
              </Link>
            </>
          )}

          <Separator className="my-4 sm:my-5" />

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
        </CardContent>
      </Card>

      <ShareDialog
        isOpen={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        car={car}
      />
    </>
  );
};

export default CarInfoCard;
