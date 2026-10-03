import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import type { TestDriveDetail } from "../../_lib/test-drive-types";

type Status = TestDriveDetail["status"];

/** How early a customer is asked to arrive. Also stated in InfoSidebar. */
const ARRIVE_EARLY_MINUTES = 10;

const TestDriveStatusMessage = ({ status }: { status: Status }) => {
    const t = useTranslations("testDrive.existing.messages");
    const fmt = useFormatters();

    const getStatusMessage = (status: Status) => {
        switch (status) {
            case "CONFIRMED":
                return {
                    bgColor: "bg-positive-soft",
                    borderColor: "border-positive/30",
                    textColor: "text-positive",
                    message: t("confirmed", {
                        minutes: fmt.number(ARRIVE_EARLY_MINUTES),
                    }),
                };
            case "CANCELLED":
                return {
                    bgColor: "bg-destructive-soft",
                    borderColor: "border-destructive/30",
                    textColor: "text-destructive",
                    message: t("cancelled"),
                };
            case "COMPLETED":
                return {
                    bgColor: "bg-primary-soft",
                    borderColor: "border-primary/30",
                    textColor: "text-primary",
                    message: t("completed"),
                };
            default:
                return null;
        }
    };

    const statusInfo = getStatusMessage(status);

    if (!statusInfo) return null;

    return (
        <div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-md p-4 mt-4`}>
            <p className={`text-sm ${statusInfo.textColor}`}>
                {statusInfo.message}
            </p>
        </div>
    );
};

export default TestDriveStatusMessage;