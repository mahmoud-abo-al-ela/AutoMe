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
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to remove{" "}
                        <span className="font-semibold">{member?.user?.name || member?.user?.email}</span>{" "}
                        from the organization? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Removing...
                            </>
                        ) : (
                            "Remove Member"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
