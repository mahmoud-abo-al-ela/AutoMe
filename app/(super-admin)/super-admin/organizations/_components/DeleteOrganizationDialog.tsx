"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { OrganizationRowData } from "./OrganizationsTable";

export default function DeleteOrganizationDialog({
  open,
  org,
  onClose,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  org: OrganizationRowData | null;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isDeleting: boolean;
}) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && !isDeleting && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Organization
          </DialogTitle>
          <DialogDescription asChild>
            <div>
              <p>
                Are you sure you want to delete{" "}
                <span className="font-semibold">{org?.name}</span>? This action
                cannot be undone.
              </p>
              {((org?._count?.cars ?? 0) > 0 ||
                (org?._count?.memberships ?? 0) > 0) && (
                <div className="mt-2 p-2 bg-destructive/10 rounded-md text-destructive">
                  <strong>Warning:</strong> This organization has{" "}
                  {org?._count?.cars || 0} cars and{" "}
                  {org?._count?.memberships || 0} members. All data will be
                  permanently removed.
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Organization"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
