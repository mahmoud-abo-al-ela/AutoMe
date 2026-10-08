"use client";

import { Button } from "@/components/ui/button";
import { MessageSquare, Scale } from "lucide-react";
import TestDriveButton from "./TestDriveButton";
import { StartConversationButton, useChatDock } from "@/components/StreamChat";
import type { CarDetail } from "../_lib/car-detail-types";
import { useTranslations } from "next-intl";
import { BuyerAccessNotice, useBuyerAccess } from "@/components/BuyerAccess";

/**
 * Contact the dealer (the page's one marker-yellow action), book a test
 * drive, and — once the car is in the compare list — jump to the comparison.
 */
const CarActions = ({
  car,
  testDriveId,
  isCheckingTestDrive,
  isScheduleLoading,
  isInCompare,
  onScheduleTestDrive,
  onViewTestDrive,
  onGoToCompare,
  isSignedIn,
  onChatClick,
}: {
  car: CarDetail;
  testDriveId: string | null;
  isCheckingTestDrive: boolean;
  isScheduleLoading: boolean;
  isInCompare: boolean;
  onScheduleTestDrive: () => void;
  onViewTestDrive: () => void;
  onGoToCompare: () => void;
  isSignedIn: boolean | undefined;
  onChatClick?: () => void;
}) => {
  const t = useTranslations("carDetail.actions");
  const { openCarChat } = useChatDock();
  const { can } = useBuyerAccess();

  return (
    <div className="flex flex-col gap-3">
      {/* Platform staff and the dealer's own team: why not, and where to go instead. */}
      <BuyerAccessNotice action="message" />

      {can("message") && (isSignedIn ? (
        <StartConversationButton carId={car.id} onChatOpen={openCarChat} variant="marker" size="xl" className="w-full" />
      ) : (
        <Button variant="marker" size="xl" className="w-full" onClick={() => onChatClick?.()}>
          <MessageSquare />
          {t("chatNow")}
        </Button>
      ))}

      {can("testDrive") && (
        <TestDriveButton
          car={car}
          testDriveId={testDriveId}
          isCheckingTestDrive={isCheckingTestDrive}
          isScheduleLoading={isScheduleLoading}
          onScheduleTestDrive={onScheduleTestDrive}
          onViewTestDrive={onViewTestDrive}
        />
      )}

      {isInCompare && (
        <Button variant="ghost" size="xl" className="w-full" onClick={onGoToCompare}>
          <Scale />
          {t("goToCompare")}
        </Button>
      )}
    </div>
  );
};

export default CarActions;
