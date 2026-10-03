import { useTranslations } from "next-intl";
import type { TestDriveDetail } from "../../_lib/test-drive-types";

type Status = TestDriveDetail["status"];

const TestDriveStatusBadge = ({ status }: { status: Status }) => {
    const t = useTranslations("testDrive.status");
    const getStatusStyles = (status: Status) => {
        switch (status) {
            case "PENDING":
                return "bg-marker-soft text-foreground";
            case "CONFIRMED":
                return "bg-positive-soft text-positive";
            case "CANCELLED":
                return "bg-destructive-soft text-destructive";
            case "COMPLETED":
                return "bg-primary-soft text-primary";
            default:
                return "bg-muted text-foreground";
        }
    };

    return (
        <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusStyles(status)}`}
        >
            {t(status)}
        </span>
    );
};

export default TestDriveStatusBadge;