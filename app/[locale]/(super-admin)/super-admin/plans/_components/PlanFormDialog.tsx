"use client";

import { Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
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
    const t = useTranslations("superAdmin.plans.form");
    const tCommon = useTranslations("superAdmin.common");
    const tActions = useTranslations("common.actions");
    const planName = plan?.name ?? "";

    const handleSubmit = () => {
        onSubmit(getSubmitData());
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create" ? t("createTitle") : t("editTitle", { name: planName })}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === "create"
                            ? t("createDescription")
                            : t("editDescription", { name: planName })}
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
                        {tActions("cancel")}
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || isPending} className="cursor-pointer">
                        {loading || isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                                {mode === "create" ? t("creating") : tCommon("saving")}
                            </>
                        ) : (
                            <>
                                {mode === "create" && <Plus className="h-4 w-4 me-2" />}
                                {mode === "create" ? t("create") : tCommon("saveChanges")}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
