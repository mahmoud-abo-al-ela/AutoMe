"use client";
import { useFormatters } from "@/hooks/use-formatters";
import { useTranslations } from "next-intl";
import { useActionError } from "@/hooks/use-action-error";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { TimeRange } from "../TimeRange";
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
    const t = useTranslations("testDrive");
    const actionError = useActionError();
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const formatDate = (date: string | null) => {
        if (!date) return t("existing.notAvailable");
        return fmtDate(new Date(date), { weekday: "long", month: "long" });
    };

    const handleCancelTestDrive = async () => {
        setIsDeleting(true);
        try {
            const result = await cancelTestDriveByUser(testDrive.id);
            if (result.success) {
                toast.success(t("toasts.cancelled"));
                onClose();
                router.push("/test-drive");
            } else {
                // The action returns an error envelope rather than throwing, so
                // without this branch a failed cancel did nothing at all: no
                // toast, no close, just a button that stopped spinning.
                toast.error(actionError(result.error, t("toasts.cancelFailed")));
            }
        } catch (error) {
            console.error("Error cancelling test drive:", error);
            toast.error(t("toasts.unexpected"));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("cancelDialog.title")}</DialogTitle>
                    <DialogDescription>
                        {t("cancelDialog.description")}
                    </DialogDescription>
                </DialogHeader>
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-2">
                    <div className="flex items-start">
                        <Info className="h-4 w-4 me-2 text-amber-500 mt-0.5" />
                        <div>
                            <p className="text-sm text-amber-800">
                                {testDrive?.car?.title}
                                <br />
                                {formatDate(testDrive.date)} <br />
                                <TimeRange
                                    start={testDrive.startTime}
                                    end={testDrive.endTime}
                                />
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
                        {t("cancelDialog.keep")}
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
                                {t("cancelDialog.cancelling")}
                            </>
                        ) : (
                            t("cancelDialog.confirm")
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CancelTestDriveDialog;