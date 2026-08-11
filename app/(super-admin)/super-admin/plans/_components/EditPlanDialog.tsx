"use client";

import PlanFormDialog from "./PlanFormDialog";
import type { Plan } from "@/lib/generated/prisma";
import type { PlanFormSubmitData } from "./usePlanForm";

export default function EditPlanDialog({
  open,
  plan,
  onClose,
  onSubmit,
  loading,
  isPending,
}: {
  open: boolean;
  plan: Plan | null;
  onClose: () => void;
  onSubmit: (data: PlanFormSubmitData) => void;
  loading: boolean;
  isPending: boolean;
}) {
  return (
    <PlanFormDialog
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      loading={loading}
      isPending={isPending}
      mode="edit"
      plan={plan}
    />
  );
}
