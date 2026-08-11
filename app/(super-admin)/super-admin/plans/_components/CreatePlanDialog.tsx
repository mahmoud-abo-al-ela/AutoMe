"use client";

import PlanFormDialog from "./PlanFormDialog";
import type { PlanType } from "@/lib/generated/prisma";
import type { PlanFormSubmitData } from "./usePlanForm";

export default function CreatePlanDialog({
  open,
  onClose,
  onSubmit,
  loading,
  isPending,
  availableTypes,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PlanFormSubmitData) => void;
  loading: boolean;
  isPending: boolean;
  availableTypes: PlanType[];
}) {
  return (
    <PlanFormDialog
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      loading={loading}
      isPending={isPending}
      mode="create"
      availableTypes={availableTypes}
    />
  );
}
