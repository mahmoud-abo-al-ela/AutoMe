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

export default function PlansGrid({ plans }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editDialog, setEditDialog] = useState({ open: false, plan: null });
  const [createDialog, setCreateDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, plan: null });
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Get existing plan types to filter available options
  const existingTypes = plans.map((p) => p.type);
  const availableTypes = ["STARTER", "PRO", "ENTERPRISE"].filter(
    (t) => !existingTypes.includes(t)
  );

  const openEditDialog = (plan) => {
    setFormData({
      name: plan.name,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      maxCars: plan.maxCars,
      maxUsers: plan.maxMembers, // Schema uses maxMembers
      maxImagesPerCar: plan.maxImagesPerCar,
    });
    setEditDialog({ open: true, plan });
  };

  const openCreateDialog = () => {
    setFormData({
      name: "",
      type: availableTypes[0] || "",
      monthlyPrice: 0,
      yearlyPrice: 0,
      maxCars: 10,
      maxUsers: 1,
      maxImagesPerCar: 5,
    });
    setCreateDialog(true);
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.type) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const result = await createPlan({
        name: formData.name,
        type: formData.type,
        monthlyPrice: parseInt(formData.monthlyPrice) || 0,
        yearlyPrice: parseInt(formData.yearlyPrice) || 0,
        maxCars: parseInt(formData.maxCars) || 10,
        maxMembers: parseInt(formData.maxUsers) || 1,
        maxImagesPerCar: parseInt(formData.maxImagesPerCar) || 5,
      });

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
          description: result.error || "An error occurred.",
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

  const handleUpdate = async () => {
    if (!editDialog.plan) return;

    setLoading(true);
    try {
      const result = await updatePlan(editDialog.plan.id, {
        name: formData.name,
        monthlyPrice: parseInt(formData.monthlyPrice) || 0,
        yearlyPrice: parseInt(formData.yearlyPrice) || 0,
        maxCars: parseInt(formData.maxCars) || 10,
        maxUsers: parseInt(formData.maxUsers) || 1,
        maxImagesPerCar: parseInt(formData.maxImagesPerCar) || 5,
      });

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
          description: result.error || "An error occurred.",
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
          description: result.error || "An error occurred.",
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
        description: "You can only have one plan of each type (Starter, Pro, Enterprise).",
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
        <AddPlanCard
          availableTypes={availableTypes}
          onClick={handleAddPlanClick}
        />
      </div>

      <CreatePlanDialog
        open={createDialog}
        onClose={() => setCreateDialog(false)}
        formData={formData}
        onChange={setFormData}
        onSubmit={handleCreate}
        loading={loading}
        isPending={isPending}
        availableTypes={availableTypes}
      />

      <EditPlanDialog
        open={editDialog.open}
        plan={editDialog.plan}
        onClose={() => setEditDialog({ open: false, plan: null })}
        formData={formData}
        onChange={setFormData}
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
