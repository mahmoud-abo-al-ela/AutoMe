"use client";

import { Calendar } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";

const TestDriveEmptyState = ({
    searchQuery,
    onClearSearch,
}: {
    searchQuery: string;
    onClearSearch: () => void;
}) => {
    if (searchQuery) {
        return (
            <EmptyState
                variant="filtered"
                title="No test drives match your search"
                onClearFilters={onClearSearch}
                className="my-4"
            />
        );
    }

    return (
        <EmptyState
            variant="standalone"
            icon={Calendar}
            title="No test drives found"
            className="my-4"
        />
    );
};

export default TestDriveEmptyState;