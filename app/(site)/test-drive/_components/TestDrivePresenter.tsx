"use client";

import {
    TestDriveForm,
    InfoSidebar,
    useWorkingHours,
    ExistingTestDrive,
    EditTestDriveForm,
    UserTestDrivesList,
    TestDriveSkeleton,
} from "./index";
import type { useTestDrivePage } from "@/hooks/use-test-drive-page";

const MODES = {
    LIST: "list",
    CREATE: "create",
    VIEW: "view",
    EDIT: "edit",
};

export const TestDrivePresenter = ({
    mode,
    carId,
    selectedTestDrive,
    testDrives,
    pagination,
    loading,
    loadingTestDrive,
    handlers,
}: ReturnType<typeof useTestDrivePage>) => {
    // The hours belong to the car's dealership, so they are keyed on whichever
    // car this page is about — the query param when creating, the booking's own
    // car when editing. Each form derives its own isDateDisabled from them.
    const { workingHours, availableDates, loading: loadingHours } =
        useWorkingHours(selectedTestDrive?.carId ?? carId);

    const getTitle = () => {
        switch (mode) {
            case MODES.EDIT:
                return "Edit Test Drive";
            case MODES.VIEW:
                return "Test Drive Details";
            case MODES.CREATE:
                return "Schedule Test Drive";
            default:
                return "Your Test Drives";
        }
    };

    return (
        <div className="container max-w-4xl mx-auto pt-15 md:pt-20 md:pb-16">
            <div className="flex flex-row items-center ml-2 md:ml-0 mb-4 md:mb-8">
                <h1 className="text-xl md:text-3xl font-bold">{getTitle()}</h1>
            </div>

            {mode === MODES.VIEW && (
                <ExistingTestDrive
                    testDrive={selectedTestDrive}
                    onEditClick={handlers.handleEditClick}
                    loading={loadingTestDrive}
                />
            )}

            {mode === MODES.EDIT && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        {loadingTestDrive || loadingHours || !selectedTestDrive ? (
                            <TestDriveSkeleton />
                        ) : (
                            <EditTestDriveForm
                                testDrive={selectedTestDrive}
                                carId={selectedTestDrive.carId}
                                onCancel={handlers.handleEditCancel}
                                onSuccess={handlers.handleEditSuccess}
                                workingHours={workingHours}
                            />
                        )}
                    </div>
                    <div className="md:col-span-1">
                        <InfoSidebar />
                    </div>
                </div>
            )}

            {mode === MODES.CREATE && carId && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        {loadingHours ? (
                            <TestDriveSkeleton />
                        ) : (
                            <TestDriveForm
                                carId={carId}
                                onSuccess={handlers.handleTestDriveSuccess}
                                workingHours={workingHours}
                                availableDates={availableDates}
                            />
                        )}
                    </div>
                    <div className="md:col-span-1">
                        <InfoSidebar />
                    </div>
                </div>
            )}

            {mode === MODES.LIST && (
                <UserTestDrivesList
                    testDrives={testDrives}
                    loading={loading}
                    pagination={pagination}
                    key={`test-drives-list-${pagination?.page}-${pagination?.status}`}
                />
            )}
        </div>
    );
};