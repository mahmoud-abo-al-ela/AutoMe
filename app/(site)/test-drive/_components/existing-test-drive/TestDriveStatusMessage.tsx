import type { TestDriveDetail } from "../../_lib/test-drive-types";

type Status = TestDriveDetail["status"];

const TestDriveStatusMessage = ({ status }: { status: Status }) => {
    const getStatusMessage = (status: Status) => {
        switch (status) {
            case "CONFIRMED":
                return {
                    bgColor: "bg-green-50",
                    borderColor: "border-green-200",
                    textColor: "text-green-800",
                    message: "Your test drive has been confirmed. Please arrive 10 minutes before your scheduled time."
                };
            case "CANCELLED":
                return {
                    bgColor: "bg-red-50",
                    borderColor: "border-red-200",
                    textColor: "text-red-800",
                    message: "This test drive has been cancelled. You can schedule a new one if you're still interested."
                };
            case "COMPLETED":
                return {
                    bgColor: "bg-blue-50",
                    borderColor: "border-blue-200",
                    textColor: "text-blue-800",
                    message: "This test drive has been completed. We hope you enjoyed the experience!"
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