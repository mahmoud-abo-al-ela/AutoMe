"use client";

import { useRouter } from "@/i18n/navigation";
import { Info } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";

const TestDriveEmptyState = () => {
    const router = useRouter();

    return (
        <EmptyState
            variant="standalone"
            icon={Info}
            title="No test drive selected"
            description="Please select a test drive from your list or schedule a new one."
            actionLabel="View All Test Drives"
            onAction={() => router.push("/test-drive")}
            secondaryActionLabel="Browse Cars"
            onSecondaryAction={() => router.push("/cars")}
            className="border-0 bg-transparent shadow-none"
        />
    );
};

export default TestDriveEmptyState;