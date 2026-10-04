"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useActionError } from "@/hooks/use-action-error";
import { useRouter } from "@/i18n/navigation";
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
import { planDisplayName } from "@/components/Pricing/pricing-plans";

/** A plan row as page.tsx loads it, with its active-subscription tally. */
export type PlanWithUsage = Prisma.PlanGetPayload<{
  include: {
    _count: { select: { subscriptions: true } };
    subscriptions: { select: { id: true } };
  };
}> & { activeSubscriptions: number };

export default function PlansGrid({ plans }: { plans: PlanWithUsage[] }) {
  const t = useTranslations("superAdmin.plans");
  const tCommon = useTranslations("superAdmin.common");
  const tPlans = useTranslations("plans");
  const actionError = useActionError();
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
  ).filter((type) => !existingTypes.includes(type));

  const openEditDialog = (plan: PlanWithUsage) => {
    setEditDialog({ open: true, plan });
  };

  const openCreateDialog = () => {
    setCreateDialog(true);
  };

  const handleCreate = async (formData: PlanFormSubmitData) => {
    if (!formData.name || !formData.type) {
      toast.error(t("toasts.missingFields"));
      return;
    }

    setLoading(true);
    try {
      // The guard above is what rules out type: ""; TypeScript narrows the
      // property but cannot carry that through the whole object.
      const result = await createPlan(formData as PlanFormInput);

      if (result.success) {
        toast.success(t("toasts.created"), {
          description: t("toasts.createdBody", { name: planDisplayName(tPlans, formData) }),
        });
        setCreateDialog(false);
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(t("toasts.createFailed"), {
          description: actionError(result.error, tCommon("errorBody")),
        });
      }
    } catch {
      toast.error(tCommon("errorTitle"), {
        description: tCommon("errorBody"),
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
        toast.success(t("toasts.updated"), {
          description: t("toasts.updatedBody", { name: planDisplayName(tPlans, formData) }),
        });
        setEditDialog({ open: false, plan: null });
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(t("toasts.updateFailed"), {
          description: actionError(result.error, tCommon("errorBody")),
        });
      }
    } catch {
      toast.error(tCommon("errorTitle"), {
        description: tCommon("errorBody"),
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
        toast.success(t("toasts.deleted"), {
          description: t("toasts.deletedBody", {
            name: planDisplayName(tPlans, deleteDialog.plan),
          }),
        });
        setDeleteDialog({ open: false, plan: null });
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(t("toasts.deleteFailed"), {
          description: actionError(result.error, tCommon("errorBody")),
        });
      }
    } catch {
      toast.error(tCommon("errorTitle"), {
        description: tCommon("errorBody"),
      });
    } finally {
      setDeleteLoading(false);
      setDeleteDialog({ open: false, plan: null });
    }
  };

  const handleAddPlanClick = () => {
    if (availableTypes.length === 0) {
      toast.error(t("add.allExist"), {
        description: t("add.allExistBody"),
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
