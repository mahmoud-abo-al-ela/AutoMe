import { format } from "date-fns";
import { Calendar, Clock, Info } from "lucide-react";
import type { TestDriveDetail } from "../../_lib/test-drive-types";

const TestDriveDetails = ({ testDrive }: { testDrive: TestDriveDetail }) => {
    const formatDate = (date: string | null) => {
        if (!date) return "N/A";
        return format(new Date(date), "EEEE, MMMM d, yyyy");
    };

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-2 md:p-4">
            <div className="flex items-start">
                <Info className="h-5 w-5 mr-2 text-blue-500 mt-0.5" />
                <div className="space-y-2">
                    <p className="font-medium text-blue-800">
                        {testDrive.car?.title}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex items-center text-sm text-blue-700">
                            <Calendar className="h-4 w-4 mr-2" />
                            {formatDate(testDrive.date)}
                        </div>
                        <div className="flex items-center text-sm text-blue-700">
                            <Clock className="h-4 w-4 mr-2" />
                            {testDrive.startTime} - {testDrive.endTime}
                        </div>
                    </div>
                    {testDrive.notes && (
                        <div className="text-sm text-blue-700 mt-2">
                            <p className="font-medium">Notes:</p>
                            <p>{testDrive.notes}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TestDriveDetails;