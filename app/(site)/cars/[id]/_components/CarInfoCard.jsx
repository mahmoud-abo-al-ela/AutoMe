"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import CarSpecifications from "./CarSpecifications";
import ShareDialog from "./ShareDialog";
import CarHeader from "./CarHeader";
import CarActionButtons from "./CarActionButtons";
import CarActions from "./CarActions";
import { useCarInfoCard } from "./hooks/useCarInfoCard";

const CarInfoCard = ({ car }) => {
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
    currentUserId,
    currentUserName,
  } = useCarInfoCard(car);

  return (
    <>
      <Card className="shadow-xl border-0 bg-white p-0">
        <CardContent className="p-4 sm:p-6 md:p-8">
          {/* Action buttons in top right */}
          <div className="flex justify-end mb-4 sm:mb-6">
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

          <CarSpecifications car={car} />

          <Separator className="my-6 sm:my-8" />

          <CarActions
            car={car}
            testDriveId={testDriveId}
            isCheckingTestDrive={isCheckingTestDrive}
            isScheduleLoading={isScheduleLoading}
            isInCompare={isInCompare}
            onScheduleTestDrive={handleScheduleTestDrive}
            onViewTestDrive={handleViewTestDrive}
            onGoToCompare={handleGoToCompare}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
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
