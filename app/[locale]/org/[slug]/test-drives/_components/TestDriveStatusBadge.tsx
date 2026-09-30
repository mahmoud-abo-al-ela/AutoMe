"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

/** Tailwind classes per status, so the switch below carries no copy. */
const STATUS_CLASSES: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    COMPLETED: "bg-blue-100 text-blue-800",
};

export const TestDriveStatusBadge = ({
    status,
    compact = false,
}: {
    status: string;
    compact?: boolean;
}) => {
    // The four status names are already written for the public test-drive
    // surface; this reads the same keys rather than a second copy.
    const t = useTranslations("testDrive.status");

    const classes = STATUS_CLASSES[status];
    if (!classes) return null;

    const baseClasses = compact ? "text-xs px-2 py-1" : "";

    return (
        <Badge className={`${classes} border-0 ${baseClasses}`}>
            {t(status)}
        </Badge>
    );
};
