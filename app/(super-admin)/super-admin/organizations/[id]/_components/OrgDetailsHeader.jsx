"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Pause, Play, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { updateOrganizationStatus, deleteOrganization } from "@/actions/super-admin";

export default function OrgDetailsHeader({ org }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleToggleStatus = async () => {
    setStatusLoading(true);
    try {
      const result = await updateOrganizationStatus(org.id, !org.isActive);
      if (result.success) {
        toast.success(org.isActive ? "Organization suspended" : "Organization activated", {
          description: `${org.name} has been ${org.isActive ? "suspended" : "activated"} successfully.`,
        });
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error("Failed to update status", {
          description: result.error || "An error occurred.",
        });
      }
    } catch (error) {
      toast.error("An error occurred", {
        description: "Please try again later.",
      });
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const result = await deleteOrganization(org.id);
      if (result.success) {
        toast.success("Organization deleted", {
          description: `${org.name} has been deleted successfully.`,
        });
        router.push("/super-admin/organizations");
      } else {
        toast.error("Failed to delete organization", {
          description: result.error || "An error occurred.",
        });
      }
    } catch (error) {
      toast.error("An error occurred", {
        description: "Please try again later.",
      });
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Organizations
      </Button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
            {org.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{org.name}</h1>
              <Badge variant={org.isActive ? "default" : "secondary"}>
                {org.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <a
              href={`http://${org.slug}.localhost:3000`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              {org.slug}.localhost
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleToggleStatus}
            disabled={statusLoading || isPending || deleteLoading}
          >
            {statusLoading || isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {org.isActive ? "Suspending..." : "Activating..."}
              </>
            ) : org.isActive ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Suspend
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Activate
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={deleteLoading || statusLoading || isPending}
          >
            {deleteLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => !deleteLoading && setDeleteDialogOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Organization
            </DialogTitle>
            <DialogDescription asChild>
              <div>
                <p>
                  Are you sure you want to delete <span className="font-semibold">{org.name}</span>?
                  This action cannot be undone.
                </p>
                <div className="mt-2 p-2 bg-destructive/10 rounded-md text-destructive">
                  <strong>Warning:</strong> All associated data including cars, test drives,
                  conversations, and team memberships will be permanently removed.
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Organization"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
