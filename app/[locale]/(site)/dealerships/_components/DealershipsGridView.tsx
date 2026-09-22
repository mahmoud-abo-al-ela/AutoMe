import DealershipCard from "./DealershipCard";
import { Pagination, PaginationInfo } from "@/components/common/Pagination";
import type {
    DealershipListItem,
    DealershipPagination,
} from "../_lib/dealership-types";

export const DealershipsGridView = ({
    dealerships,
    pagination,
    loading,
    onPageChange,
}: {
    dealerships: DealershipListItem[];
    pagination: DealershipPagination;
    loading: boolean;
    onPageChange: (page: number) => void;
}) => {
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {dealerships.map((dealership, index) => (
                    <DealershipCard
                        key={dealership.id}
                        dealership={dealership}
                        index={index}
                    />
                ))}
            </div>

            {/* Pagination — only when results span more than one page. */}
            {pagination.totalPages > 1 && (
                <div className="mt-8 space-y-4">
                    <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        onPageChange={onPageChange}
                        disabled={loading}
                    />
                    <PaginationInfo
                        currentPage={pagination.page}
                        limit={pagination.limit}
                        total={pagination.total}
                        noun="dealerships"
                    />
                </div>
            )}
        </>
    );
};
