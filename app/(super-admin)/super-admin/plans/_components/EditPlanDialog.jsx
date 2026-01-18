"use client";

import PlanFormDialog from "./PlanFormDialog";

export default function EditPlanDialog({
  open,
  plan,
  onClose,
  onSubmit,
  loading,
  isPending,
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
