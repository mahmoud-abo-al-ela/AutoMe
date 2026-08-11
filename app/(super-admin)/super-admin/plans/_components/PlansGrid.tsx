"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updatePlan, createPlan, deletePlan } from "@/actions/super-admin";
import PlanCard from "./PlanCard";
import AddPlanCard from "./AddPlanCard";
import CreatePlanDialog from "./CreatePlanDialog";
import EditPlanDialog from "./EditPlanDialog";
import DeletePlanDialog from "./DeletePlanDialog";
import { Prisma, type Plan, type PlanType } from "@/lib/generated/prisma";
import type { PlanFormSubmitData } from "./usePlanForm";
import type { PlanFormInput } from "@/lib/services/super-admin/plan";

/** A plan row as page.tsx loads it, with its active-subscription tally. */
export type PlanWithUsage = Prisma.PlanGetPayload<{
  include: {
    _count: { select: { subscriptions: true } };
    subscriptions: { select: { id: true } };
  };
}> & { activeSubscriptions: number };

export default function PlansGrid({ plans }: { plans: PlanWithUsage[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    plan: PlanWithUsage | null;
  }>({ open: false, plan: null });
  const [createDialog, setCreateDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    plan: PlanWithUsage | null;
  }>({ open: false, plan: null });
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Get existing plan types to filter available options
  const existingTypes = plans.map((p) => p.type);
  const availableTypes = (
    ["STARTER", "PRO", "ENTERPRISE"] satisfies PlanType[]
  ).filter((t) => !existingTypes.includes(t));

  const openEditDialog = (plan: PlanWithUsage) => {
    setEditDialog({ open: true, plan });
  };

  const openCreateDialog = () => {
    setCreateDialog(true);
  };

  const handleCreate = async (formData: PlanFormSubmitData) => {
    if (!formData.name || !formData.type) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      // The guard above is what rules out type: ""; TypeScript narrows the
      // property but cannot carry that through the whole object.
      const result = await createPlan(formData as PlanFormInput);

      if (result.success) {
        toast.success("Plan created successfully", {
          description: `${formData.name} plan has been created.`,
        });
        setCreateDialog(false);
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error("Failed to create plan", {
          // BUG (flagged, not fixed in this conversion): result.error is the
          // error object, not a string; should be result.error.message. Same
          // defect as ActiveSessions.tsx, repeated at all three call sites in
          // this file.
          description: result.error as unknown as string,
        });
      }
    } catch (error) {
      toast.error("An error occurred", {
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (formData: PlanFormSubmitData) => {
    if (!editDialog.plan) return;

    setLoading(true);
    try {
      // Editing always seeds type from the existing plan, so "" is unreachable
      // here; same narrowing limitation as handleCreate.
      const result = await updatePlan(editDialog.plan.id, formData as PlanFormInput);

      if (result.success) {
        toast.success("Plan updated successfully", {
          description: `${formData.name} plan has been updated.`,
        });
        setEditDialog({ open: false, plan: null });
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error("Failed to update plan", {
          description: result.error as unknown as string,
        });
      }
    } catch (error) {
      toast.error("An error occurred", {
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.plan) return;

    setDeleteLoading(true);
    try {
      const result = await deletePlan(deleteDialog.plan.id);

      if (result.success) {
        toast.success("Plan deleted successfully", {
          description: `${deleteDialog.plan.name} has been deleted.`,
        });
        setDeleteDialog({ open: false, plan: null });
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error("Failed to delete plan", {
          description: result.error as unknown as string,
        });
      }
    } catch (error) {
      toast.error("An error occurred", {
        description: "Please try again later.",
      });
    } finally {
      setDeleteLoading(false);
      setDeleteDialog({ open: false, plan: null });
    }
  };

  const handleAddPlanClick = () => {
    if (availableTypes.length === 0) {
      toast.error("All plan types already exist", {
        description:
          "You can only have one plan of each type (Starter, Pro, Enterprise).",
      });
      return;
    }
    openCreateDialog();
  };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onEdit={openEditDialog}
            onDelete={(plan) => setDeleteDialog({ open: true, plan })}
          />
        ))}
        {plans.length < 3 &&
          <AddPlanCard
            availableTypes={availableTypes}
            onClick={handleAddPlanClick}
          />}
      </div>

      <CreatePlanDialog
        open={createDialog}
        onClose={() => setCreateDialog(false)}
        onSubmit={handleCreate}
        loading={loading}
        isPending={isPending}
        availableTypes={availableTypes}
      />

      <EditPlanDialog
        open={editDialog.open}
        plan={editDialog.plan}
        onClose={() => setEditDialog({ open: false, plan: null })}
        onSubmit={handleUpdate}
        loading={loading}
        isPending={isPending}
      />

      <DeletePlanDialog
        open={deleteDialog.open}
        plan={deleteDialog.plan}
        onClose={() => setDeleteDialog({ open: false, plan: null })}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </>
  );
}
