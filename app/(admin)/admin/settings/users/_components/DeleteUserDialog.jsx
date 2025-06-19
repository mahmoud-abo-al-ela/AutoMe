import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DeleteUserDialog = ({ isOpen, onClose, user, onConfirm, isLoading }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-w-[90vw] p-4 sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-lg sm:text-xl">Delete User</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Are you sure you want to delete{" "}
            <span className="font-medium">
              {user?.name || user?.email || "this user"}
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4 sm:mt-6">
          <Button
            variant="outline"
            onClick={() => onClose(false)}
            disabled={isLoading}
            className="cursor-pointer text-xs sm:text-sm h-8 sm:h-9 w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="cursor-pointer text-xs sm:text-sm h-8 sm:h-9 w-full sm:w-auto"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1 sm:mr-2" />
                Deleting...
              </span>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteUserDialog;
