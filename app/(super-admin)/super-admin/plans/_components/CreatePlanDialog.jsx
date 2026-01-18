"use client";

import PlanFormDialog from "./PlanFormDialog";

export default function CreatePlanDialog({
  open,
  onClose,
  onSubmit,
  loading,
  isPending,
  availableTypes,
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
