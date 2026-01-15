"use client";

import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DeletePlanDialog({
  open,
  plan,
  onClose,
  onConfirm,
  loading,
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(open) => !loading && !open && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete {plan?.name} Plan?
          </DialogTitle>
          <DialogDescription asChild>
            <div>
              <p>
                This action cannot be undone. This will permanently delete the{" "}
                <span className="font-semibold">{plan?.name}</span> plan
                and remove it from the system.
              </p>
              {plan?.activeSubscriptions > 0 && (
                <div className="mt-2 p-2 bg-destructive/10 rounded-md text-destructive">
                  <strong>Warning:</strong> This plan has{" "}
                  {plan.activeSubscriptions} active subscription(s).
                  You cannot delete it until all subscribers are migrated.
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading || plan?.activeSubscriptions > 0}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Plan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
