"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { TeamMember } from "../_lib/team-types";

interface RemoveMemberDialogProps {
    isOpen: boolean;
    onClose: (open: boolean) => void;
    member: TeamMember | null;
    onConfirm: () => void;
    isLoading: boolean;
}

export default function RemoveMemberDialog({
    isOpen,
    onClose,
    member,
    onConfirm,
    isLoading,
}: RemoveMemberDialogProps) {
    const t = useTranslations("org.settings.team.remove");
    const tCommon = useTranslations("common.actions");

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t("title")}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t.rich("body", {
                            name: member?.user?.name || member?.user?.email || "",
                            b: (chunks) => (
                                <span className="font-semibold">{chunks}</span>
                            ),
                        })}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>
                        {tCommon("cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                                {t("removing")}
                            </>
                        ) : (
                            t("confirm")
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
