"use client";

import {
    ReservationForm,
    InfoSidebar,
    useWorkingHours,
    ExistingReservation,
    EditReservationForm,
    UserTestDrivesList,
} from "./index";
import { ReservationSkeleton } from "./ExistingReservation";

const MODES = {
    LIST: "list",
    CREATE: "create",
    VIEW: "view",
    EDIT: "edit",
};

export const ReservationPresenter = ({
    mode,
    carId,
    testDriveId,
    selectedTestDrive,
    testDrives,
    pagination,
    loading,
    loadingTestDrive,
    handlers,
}) => {
    const {
        workingHours,
        availableDates,
        loading: loadingHours,
        isDateDisabled,
    } = useWorkingHours();

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
                <ExistingReservation
                    testDrive={selectedTestDrive}
                    onEditClick={handlers.handleEditClick}
                    refreshData={handlers.fetchTestDrive}
                    loading={loadingTestDrive}
                />
            )}

            {mode === MODES.EDIT && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        {loadingTestDrive ? (
                            <ReservationSkeleton />
                        ) : (
                            <EditReservationForm
                                testDrive={selectedTestDrive}
                                onCancel={handlers.handleEditCancel}
                                onSuccess={handlers.handleEditSuccess}
                                workingHours={workingHours}
                                availableDates={availableDates}
                                isDateDisabled={isDateDisabled}
                            />
                        )}
                    </div>
                    <div className="md:col-span-1">
                        <InfoSidebar car={selectedTestDrive?.car} />
                    </div>
                </div>
            )}

            {mode === MODES.CREATE && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <ReservationForm
                            carId={carId}
                            onSuccess={handlers.handleReservationSuccess}
                            workingHours={workingHours}
                            availableDates={availableDates}
                            isDateDisabled={isDateDisabled}
                        />
                    </div>
                    <div className="md:col-span-1">
                        <InfoSidebar carId={carId} />
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
