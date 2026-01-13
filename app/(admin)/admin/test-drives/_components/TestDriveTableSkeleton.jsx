import { TableCell, TableRow } from "@/components/ui/table";

export const TestDriveTableSkeleton = () => {
    return (
        <>
            {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="border-b border-gray-100">
                    <TableCell className="py-4 md:py-6">
                        <div className="flex items-center gap-2 md:gap-4">
                            <div className="h-12 w-16 md:h-16 md:w-20 lg:h-20 lg:w-28 bg-gray-200 rounded-xl animate-pulse flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-3/4" />
                                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                            </div>
                        </div>
                    </TableCell>
                    <TableCell className="py-4 md:py-6">
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="h-8 w-8 md:h-10 md:w-10 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                                <div className="h-3 bg-gray-200 rounded animate-pulse mb-1 w-2/3" />
                                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                            </div>
                        </div>
                    </TableCell>
                    <TableCell className="py-4 md:py-6">
                        <div className="flex flex-col gap-1">
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-24" />
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
                        </div>
                    </TableCell>
                    <TableCell className="py-4 md:py-6">
                        <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                    <TableCell className="py-4 md:py-6">
                        <div className="flex items-center gap-1 md:gap-2">
                            <div className="h-8 sm:h-10 w-16 bg-gray-200 rounded animate-pulse" />
                            <div className="h-8 sm:h-10 w-20 bg-gray-200 rounded animate-pulse" />
                            <div className="h-8 sm:h-10 w-16 bg-gray-200 rounded animate-pulse" />
                        </div>
                    </TableCell>
                </TableRow>
            ))}
        </>
    );
};