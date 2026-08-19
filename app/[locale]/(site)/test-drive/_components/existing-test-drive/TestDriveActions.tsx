import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import type { TestDriveDetail } from "../../_lib/test-drive-types";

const TestDriveActions = ({
    testDrive,
    onEditClick,
    onCancelClick,
}: {
    testDrive: TestDriveDetail;
    onEditClick: () => void;
    onCancelClick: () => void;
}) => {
    const isEditable = testDrive.status === "PENDING"; // Only pending test drives can be edited
    const isCancellable = testDrive.status !== "CANCELLED" && testDrive.status !== "COMPLETED";

    return (
        <div className="grid grid-cols-2 gap-3">
            <Button
                variant="outline"
                className="cursor-pointer"
                onClick={onEditClick}
                disabled={!isEditable}
            >
                <Edit className="h-4 w-4 me-2" />
                Edit
            </Button>
            <Button
                variant="destructive"
                className="cursor-pointer"
                onClick={onCancelClick}
                disabled={!isCancellable}
            >
                <Trash2 className="h-4 w-4 me-2" />
                Cancel
            </Button>
        </div>
    );
};

export default TestDriveActions;