import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, Trash2 } from "lucide-react";

const DeleteConfirmationDialog = ({
  isOpen,
  onClose,
  car,
  onDelete,
  isDeleting,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-4 sm:p-6 max-w-[90vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 text-base sm:text-lg">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            Delete Car
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-sm sm:text-base">
            Are you sure you want to delete <strong>"{car?.title}"</strong>?
            This action cannot be undone and will permanently remove the car
            from your inventory.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 flex-col sm:flex-row mt-4">
          <Button
            variant="outline"
            onClick={() => onClose(false)}
            disabled={isDeleting}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => onDelete(car?.id)}
            className="bg-red-600 hover:bg-red-700 w-full sm:w-auto order-1 sm:order-2"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Car
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
