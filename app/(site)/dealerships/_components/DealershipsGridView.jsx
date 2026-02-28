import DealershipCard from "./DealershipCard";
import { Pagination, PaginationInfo } from "@/components/common/Pagination";

export const DealershipsGridView = ({
    dealerships,
    pagination,
    loading,
    onPageChange,
}) => {
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {dealerships.map((dealership) => (
                    <DealershipCard
                        key={dealership.id}
                        dealership={dealership}
                    />
                ))}
            </div>

            {/* Pagination */}
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
                />
            </div>
        </>
    );
};
