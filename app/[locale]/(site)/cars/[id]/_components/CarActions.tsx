"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Scale } from "lucide-react";
import TestDriveButton from "./TestDriveButton";
import { StartConversationButton, ChatSidebar } from "@/components/StreamChat";
import type { CarDetail } from "../_lib/car-detail-types";

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
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);

  const handleChatClick = () => {
    if (!isSignedIn) {
      onChatClick?.();
      return;
    }
  };

  const handleChatOpen = (carId: string) => {
    setSelectedCarId(carId);
    setChatOpen(true);
  };

  return (
    <>
      <div className="space-y-3 sm:space-y-4">
        {isSignedIn ? (
          <>
            <StartConversationButton
              carId={car.id}
              onChatOpen={handleChatOpen}
              className="cursor-pointer w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 sm:py-6 text-base sm:text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            />
            <ChatSidebar
              open={chatOpen}
              onOpenChange={setChatOpen}
              carId={selectedCarId}
            />
          </>
        ) : (
          <Button
            onClick={handleChatClick}
            className="cursor-pointer w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 sm:py-6 text-base sm:text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            Chat Now
          </Button>
        )}

        <TestDriveButton
          car={car}
          testDriveId={testDriveId}
          isCheckingTestDrive={isCheckingTestDrive}
          isScheduleLoading={isScheduleLoading}
          onScheduleTestDrive={onScheduleTestDrive}
          onViewTestDrive={onViewTestDrive}
        />

        {isInCompare && (
          <Button
            variant="secondary"
            onClick={onGoToCompare}
            className="w-full py-2 sm:py-3 rounded-xl hover:scale-105 transition-transform cursor-pointer text-xs sm:text-sm"
          >
            <Scale className="w-3 h-3 sm:w-4 sm:h-4 me-1 sm:me-2" />
            Go to Compare
          </Button>
        )}
      </div>
    </>
  );
};

export default CarActions;
