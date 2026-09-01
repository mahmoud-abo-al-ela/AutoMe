"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import TestDriveSkeleton from "./TestDriveSkeleton";
import TestDriveEmptyState from "./TestDriveEmptyState";
import TestDriveStatusBadge from "./TestDriveStatusBadge";
import TestDriveDetails from "./TestDriveDetails";
import TestDriveActions from "./TestDriveActions";
import TestDriveStatusMessage from "./TestDriveStatusMessage";
import CancelTestDriveDialog from "./CancelTestDriveDialog";
import type { TestDriveDetail } from "../../_lib/test-drive-types";

const ExistingTestDrive = ({
    testDrive,
    onEditClick,
    loading,
}: {
    testDrive: TestDriveDetail | null;
    onEditClick: () => void;
    loading: boolean;
}) => {
    const t = useTranslations("testDrive.existing");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    if (loading) {
        return <TestDriveSkeleton />;
    }

    if (!testDrive) {
        return <TestDriveEmptyState />;
    }

    return (
        <>
            <Card className="p-4 gap-3 mx-2 md:mx-0">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h2 className="text-xl font-semibold">{t("title")}</h2>
                    <TestDriveStatusBadge status={testDrive.status} />
                </div>

                <div className="space-y-6">
                    <TestDriveDetails testDrive={testDrive} />

                    <TestDriveActions
                        testDrive={testDrive}
                        onEditClick={onEditClick}
                        onCancelClick={() => setIsDeleteDialogOpen(true)}
                    />

                    <TestDriveStatusMessage status={testDrive.status} />
                </div>
            </Card>

            <CancelTestDriveDialog
                testDrive={testDrive}
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
            />
        </>
    );
};

export default ExistingTestDrive;