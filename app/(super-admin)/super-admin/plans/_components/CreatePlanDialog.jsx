"use client";

import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreatePlanDialog({
  open,
  onClose,
  formData,
  onChange,
  onSubmit,
  loading,
  isPending,
  availableTypes,
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Plan</DialogTitle>
          <DialogDescription>
            Add a new pricing plan to your platform
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="create-name">Plan Name</Label>
              <Input
                id="create-name"
                placeholder="e.g., Business"
                value={formData.name || ""}
                onChange={(e) =>
                  onChange({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-type">Plan Type</Label>
              <Select
                value={formData.type || ""}
                onValueChange={(value) =>
                  onChange({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {availableTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="create-monthlyPrice">Monthly Price ($)</Label>
              <Input
                id="create-monthlyPrice"
                type="number"
                value={formData.monthlyPrice || ""}
                onChange={(e) =>
                  onChange({ ...formData, monthlyPrice: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-yearlyPrice">Yearly Price ($)</Label>
              <Input
                id="create-yearlyPrice"
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
              <Label htmlFor="create-maxCars">Max Cars</Label>
              <Input
                id="create-maxCars"
                type="number"
                value={formData.maxCars || ""}
                onChange={(e) =>
                  onChange({ ...formData, maxCars: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-maxUsers">Max Users</Label>
              <Input
                id="create-maxUsers"
                type="number"
                value={formData.maxUsers || ""}
                onChange={(e) =>
                  onChange({ ...formData, maxUsers: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-maxImagesPerCar">Max Images</Label>
              <Input
                id="create-maxImagesPerCar"
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
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Plan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
