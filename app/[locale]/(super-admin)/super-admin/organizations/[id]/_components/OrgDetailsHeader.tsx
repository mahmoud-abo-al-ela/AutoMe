"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useActionError } from "@/hooks/use-action-error";
import {
  ArrowLeft,
  ExternalLink,
  Pause,
  Play,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
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
import {
  updateOrganizationStatus,
  deleteOrganization,
} from "@/actions/super-admin";
import { Prisma } from "@/lib/generated/prisma";

/**
 * The organization record page.tsx loads for this detail view: subscription
 * down to the plan, memberships with their users, and the cars/test-drives
 * tallies OrgStats renders.
 */
export type OrganizationDetail = Prisma.OrganizationGetPayload<{
  include: {
    subscription: { include: { plan: true } };
    memberships: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
            email: true;
            imageUrl: true;
            role: true;
          };
        };
      };
    };
    _count: { select: { cars: true; testDrives: true } };
  };
}>;

export default function OrgDetailsHeader({ org }: { org: OrganizationDetail }) {
  const t = useTranslations("superAdmin.organizations");
  const tCommon = useTranslations("superAdmin.common");
  const tActions = useTranslations("common.actions");
  const actionError = useActionError();
  const locale = useLocale();
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
        toast.success(
          org.isActive ? t("toasts.suspended") : t("toasts.activated"),
          {
            description: org.isActive
              ? t("toasts.suspendedBody", { name: org.name })
              : t("toasts.activatedBody", { name: org.name }),
          }
        );
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(t("toasts.statusFailed"), {
          description: actionError(result.error, tCommon("errorBody")),
        });
      }
    } catch {
      toast.error(tCommon("errorTitle"), {
        description: tCommon("errorBody"),
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
        toast.success(t("toasts.deleted"), {
          description: t("toasts.deletedBody", { name: org.name }),
        });
        router.push("/super-admin/organizations");
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
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t("details.back")}
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
                {org.isActive ? tCommon("active") : tCommon("inactive")}
              </Badge>
            </div>
            {/* A plain <a> for the new tab, so the locale is written into the
                href by hand — without it the dashboard opens in the default
                locale rather than the one the admin is reading. */}
            <a
              href={`/${locale}/org/${org.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              <span dir="ltr">/org/{org.slug}</span>
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
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {org.isActive
                  ? t("actions.suspending")
                  : t("actions.activating")}
              </>
            ) : org.isActive ? (
              <>
                <Pause className="h-4 w-4 me-2" />
                {t("actions.suspend")}
              </>
            ) : (
              <>
                <Play className="h-4 w-4 me-2" />
                {t("actions.activate")}
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
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {tCommon("deleting")}
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 me-2" />
                {tCommon("delete")}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => !deleteLoading && setDeleteDialogOpen(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t("delete.title")}
            </DialogTitle>
            <DialogDescription asChild>
              <div>
                <p>
                  {t.rich("delete.confirm", {
                    name: org.name,
                    strong: (chunks) => (
                      <span className="font-semibold">{chunks}</span>
                    ),
                  })}
                </p>
                <div className="mt-2 p-2 bg-destructive/10 rounded-md text-destructive">
                  <strong>{tCommon("warning")}</strong>{" "}
                  {t("delete.allDataWarning")}
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteLoading}
            >
              {tActions("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  {tCommon("deleting")}
                </>
              ) : (
                t("delete.submit")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
