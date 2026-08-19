"use client";
import { useFormatters } from "@/hooks/use-formatters";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { cancelTestDriveByUser } from "@/actions/test-drive";
import type { TestDriveDetail } from "../../_lib/test-drive-types";

const CancelTestDriveDialog = ({
    testDrive,
    isOpen,
    onClose,
}: {
    testDrive: TestDriveDetail;
    isOpen: boolean;
    onClose: () => void;
}) => {
  const { date: fmtDate } = useFormatters();
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const formatDate = (date: string | null) => {
        if (!date) return "N/A";
        return fmtDate(new Date(date), { weekday: "long", month: "long" });
    };

    const handleCancelTestDrive = async () => {
        setIsDeleting(true);
        try {
            const result = await cancelTestDriveByUser(testDrive.id);
            if (result.success) {
                toast.success("Test drive cancelled successfully");
                onClose();
                router.push("/test-drive");
            } else {
                // The action returns an error envelope rather than throwing, so
                // without this branch a failed cancel did nothing at all: no
                // toast, no close, just a button that stopped spinning.
                toast.error(result.error.message || "Failed to cancel test drive");
            }
        } catch (error) {
            console.error("Error cancelling test drive:", error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cancel Test Drive</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to cancel your test drive? This action
                        cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-2">
                    <div className="flex items-start">
                        <Info className="h-4 w-4 me-2 text-amber-500 mt-0.5" />
                        <div>
                            <p className="text-sm text-amber-800">
                                {testDrive?.car?.title}
                                <br />
                                {formatDate(testDrive.date)} <br /> {testDrive.startTime} -{" "}
                                {testDrive.endTime}
                            </p>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="cursor-pointer"
                    >
                        Keep Test Drive
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleCancelTestDrive}
                        disabled={isDeleting}
                        className="cursor-pointer"
                    >
                        {isDeleting ? (
                            <>
                                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full me-2"></span>
                                Cancelling...
                            </>
                        ) : (
                            "Cancel Test Drive"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CancelTestDriveDialog;