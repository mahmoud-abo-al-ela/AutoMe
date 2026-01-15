"use client";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EditPlanDialog({
  open,
  plan,
  onClose,
  formData,
  onChange,
  onSubmit,
  loading,
  isPending,
}) {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Plan</DialogTitle>
          <DialogDescription>
            Update pricing and limits for {plan?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Plan Name</Label>
            <Input
              id="name"
              value={formData.name || ""}
              onChange={(e) => onChange({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="monthlyPrice">Monthly Price ($)</Label>
              <Input
                id="monthlyPrice"
                type="number"
                value={formData.monthlyPrice || ""}
                onChange={(e) =>
                  onChange({ ...formData, monthlyPrice: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="yearlyPrice">Yearly Price ($)</Label>
              <Input
                id="yearlyPrice"
                type="number"
                value={formData.yearlyPrice || ""}
                onChange={(e) =>
                  onChange({ ...formData, yearlyPrice: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="maxCars">Max Cars</Label>
              <Input
                id="maxCars"
                type="number"
                value={formData.maxCars || ""}
                onChange={(e) =>
                  onChange({ ...formData, maxCars: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maxUsers">Max Users</Label>
              <Input
                id="maxUsers"
                type="number"
                value={formData.maxUsers || ""}
                onChange={(e) =>
                  onChange({ ...formData, maxUsers: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maxImagesPerCar">Max Images</Label>
              <Input
                id="maxImagesPerCar"
                type="number"
                value={formData.maxImagesPerCar || ""}
                onChange={(e) =>
                  onChange({ ...formData, maxImagesPerCar: e.target.value })
                }
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading || isPending}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={loading || isPending}>
            {loading || isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
