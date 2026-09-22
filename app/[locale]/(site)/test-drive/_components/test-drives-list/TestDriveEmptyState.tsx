"use client";

import { Calendar } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { useTranslations } from "next-intl";

const TestDriveEmptyState = ({
    searchQuery,
    onClearSearch,
}: {
    searchQuery: string;
    onClearSearch: () => void;
}) => {
    const t = useTranslations("testDrive.list");

    if (searchQuery) {
        return (
            <EmptyState
                variant="filtered"
                title={t("emptySearchTitle")}
                onClearFilters={onClearSearch}
                className="my-4"
            />
        );
    }

    return (
        <EmptyState
            variant="standalone"
            icon={Calendar}
            title={t("emptyTitle")}
            className="my-4"
        />
    );
};

export default TestDriveEmptyState;