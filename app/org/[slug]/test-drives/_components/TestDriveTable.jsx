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

export const TestDriveTable = ({
    testDrives,
    onStatusChange,
    isLoading = false,
    isUpdating = false
}) => {
    if (testDrives.length === 0 && !isLoading) {
        return (
            <div className="w-full">
                <EmptyState variant="inline" title="No test drive requests found" />
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
                            Car
                        </TableHead>
                        <TableHead className="min-w-[150px] font-semibold text-gray-900 py-3">
                            Customer
                        </TableHead>
                        <TableHead className="min-w-[140px] font-semibold text-gray-900 py-3">
                            Date & Time
                        </TableHead>
                        <TableHead className="min-w-[100px] font-semibold text-gray-900 py-3">
                            Status
                        </TableHead>
                        <TableHead className="min-w-[120px] font-semibold text-gray-900 py-3">
                            Actions
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