"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle, Scale } from "lucide-react";
import TestDriveButton from "./TestDriveButton";

const CarActions = ({
    car,
    testDriveId,
    isCheckingTestDrive,
    isScheduleLoading,
    isInCompare,
    onScheduleTestDrive,
    onViewTestDrive,
    onGoToCompare,
}) => {
    return (
        <div className="space-y-3 sm:space-y-4">
            <Button className="cursor-pointer w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 sm:py-6 text-base sm:text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Chat Now
            </Button>

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
                    <Scale className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Go to Compare
                </Button>
            )}
        </div>
    );
};

export default CarActions;