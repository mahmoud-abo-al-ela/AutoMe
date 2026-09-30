"use client";

import { useTranslations } from "next-intl";
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { TestDriveRow } from "./TestDriveRow";
import { TestDriveTableSkeleton } from "./TestDriveTableSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import type { AdminTestDrive, TestDriveItemProps } from "./TestDrivesPresenter";

export const TestDriveTable = ({
    testDrives,
    onStatusChange,
    isLoading = false,
    isUpdating = false
}: {
    testDrives: AdminTestDrive[];
    onStatusChange: TestDriveItemProps["onStatusChange"];
    isLoading?: boolean;
    isUpdating?: boolean;
}) => {
    const t = useTranslations("org.testDrives");

    if (testDrives.length === 0 && !isLoading) {
        return (
            <div className="w-full">
                <EmptyState variant="inline" title={t("empty.title")} />
            </div>
        );
    }

    return (
        /* Desktop Table View */
        <div className="hidden md:block overflow-x-auto">
            <Table className="min-w-[700px]">
                <TableHeader>
                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                        <TableHead className="min-w-[200px] font-semibold text-gray-900 py-3">
                            {t("table.car")}
                        </TableHead>
                        <TableHead className="min-w-[150px] font-semibold text-gray-900 py-3">
                            {t("table.customer")}
                        </TableHead>
                        <TableHead className="min-w-[140px] font-semibold text-gray-900 py-3">
                            {t("table.dateTime")}
                        </TableHead>
                        <TableHead className="min-w-[100px] font-semibold text-gray-900 py-3">
                            {t("table.status")}
                        </TableHead>
                        <TableHead className="min-w-[120px] font-semibold text-gray-900 py-3">
                            {t("table.actions")}
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TestDriveTableSkeleton />
                    ) : (
                        testDrives.map((testDrive) => (
                            <TestDriveRow
                                key={testDrive.id}
                                testDrive={testDrive}
                                onStatusChange={onStatusChange}
                                isDisabled={isLoading || isUpdating}
                                isUpdating={isUpdating}
                            />
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
};