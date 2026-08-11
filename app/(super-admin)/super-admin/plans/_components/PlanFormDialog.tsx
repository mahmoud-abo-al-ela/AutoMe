"use client";

import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePlanForm } from "./usePlanForm";
import PlanFormTabs from "./PlanFormTabs";
import type { Plan, PlanType } from "@/lib/generated/prisma";
import type { PlanFormSubmitData } from "./usePlanForm";

export default function PlanFormDialog({
    open,
    onClose,
    onSubmit,
    loading,
    isPending,
    mode = "create", // "create" or "edit"
    plan = null,
    availableTypes = [],
}: {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: PlanFormSubmitData) => void;
    loading: boolean;
    isPending: boolean;
    mode?: "create" | "edit";
    plan?: Plan | null;
    availableTypes?: PlanType[];
}) {
    const {
        formData,
        setFormData,
        inputValues,
        setInputValues,
        features,
        handleFeatureChange,
        getSubmitData,
    } = usePlanForm({ mode, plan, open });

    const handleSubmit = () => {
        onSubmit(getSubmitData());
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{mode === "create" ? "Create New Plan" : `Edit ${plan?.name}`}</DialogTitle>
                    <DialogDescription>
                        {mode === "create"
                            ? "Add a new pricing plan to your platform"
                            : `Update pricing and limits for ${plan?.name}`}
                    </DialogDescription>
                </DialogHeader>

                <PlanFormTabs
                    mode={mode}
                    availableTypes={availableTypes}
                    formData={formData}
                    setFormData={setFormData}
                    inputValues={inputValues}
                    setInputValues={setInputValues}
                    features={features}
                    handleFeatureChange={handleFeatureChange}
                />

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading || isPending} className="cursor-pointer">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || isPending} className="cursor-pointer">
                        {loading || isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {mode === "create" ? "Creating..." : "Saving..."}
                            </>
                        ) : (
                            <>
                                {mode === "create" && <Plus className="h-4 w-4 mr-2" />}
                                {mode === "create" ? "Create Plan" : "Save Changes"}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
