import { Badge } from "@/components/ui/badge";

export const TestDriveStatusBadge = ({ status, compact = false }) => {
    const baseClasses = compact ? "text-xs px-2 py-1" : "";

    switch (status) {
        case "PENDING":
            return (
                <Badge className={`bg-yellow-100 text-yellow-800 border-0 ${baseClasses}`}>
                    Pending
                </Badge>
            );
        case "CONFIRMED":
            return (
                <Badge className={`bg-green-100 text-green-800 border-0 ${baseClasses}`}>
                    Confirmed
                </Badge>
            );
        case "CANCELLED":
            return (
                <Badge className={`bg-red-100 text-red-800 border-0 ${baseClasses}`}>
                    Cancelled
                </Badge>
            );
        default:
            return null;
    }
};