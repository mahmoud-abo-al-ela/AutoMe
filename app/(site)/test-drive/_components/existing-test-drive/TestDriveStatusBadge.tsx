import type { TestDriveDetail } from "../../_lib/test-drive-types";

type Status = TestDriveDetail["status"];

const TestDriveStatusBadge = ({ status }: { status: Status }) => {
    const getStatusStyles = (status: Status) => {
        switch (status) {
            case "PENDING":
                return "bg-yellow-100 text-yellow-800";
            case "CONFIRMED":
                return "bg-green-100 text-green-800";
            case "CANCELLED":
                return "bg-red-100 text-red-800";
            case "COMPLETED":
                return "bg-blue-100 text-blue-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusStyles(status)}`}
        >
            {status}
        </span>
    );
};

export default TestDriveStatusBadge;