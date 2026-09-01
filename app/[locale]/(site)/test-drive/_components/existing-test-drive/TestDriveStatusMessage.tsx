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
                    bgColor: "bg-green-50",
                    borderColor: "border-green-200",
                    textColor: "text-green-800",
                    message: t("confirmed", {
                        minutes: fmt.number(ARRIVE_EARLY_MINUTES),
                    }),
                };
            case "CANCELLED":
                return {
                    bgColor: "bg-red-50",
                    borderColor: "border-red-200",
                    textColor: "text-red-800",
                    message: t("cancelled"),
                };
            case "COMPLETED":
                return {
                    bgColor: "bg-blue-50",
                    borderColor: "border-blue-200",
                    textColor: "text-blue-800",
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