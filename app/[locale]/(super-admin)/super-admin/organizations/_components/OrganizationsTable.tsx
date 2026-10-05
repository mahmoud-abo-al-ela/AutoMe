"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useActionError } from "@/hooks/use-action-error";
import { useFormatters } from "@/hooks/use-formatters";
import { useRouter } from "@/i18n/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import ImpersonateModal from "./ImpersonateModal";
import OrganizationRow from "./OrganizationRow";
import DeleteOrganizationDialog from "./DeleteOrganizationDialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  updateOrganizationStatus,
  deleteOrganization,
} from "@/actions/super-admin";
import { EmptyState } from "@/components/common/EmptyState";
import { Building2 } from "lucide-react";
import { Prisma } from "@/lib/generated/prisma";

/** An organization row as page.tsx selects it, with its plan and tallies. */
export type OrganizationRowData = Prisma.OrganizationGetPayload<{
  include: {
    subscription: { include: { plan: true } };
    _count: { select: { cars: true; memberships: true; testDrives: true } };
  };
}>;

export type OrganizationsPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default function OrganizationsTable({
  organizations,
  pagination,
}: {
  organizations: OrganizationRowData[];
  pagination: OrganizationsPagination;
}) {
  const t = useTranslations("superAdmin.organizations");
  const tCommon = useTranslations("superAdmin.common");
  const actionError = useActionError();
  const { number } = useFormatters();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [impersonateOrg, setImpersonateOrg] =
    useState<OrganizationRowData | null>(null);
  // Keyed as `status-<id>` / `delete-<id>` so one row can show a spinner.
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    org: OrganizationRowData | null;
  }>({ open: false, org: null });

  const handleToggleStatus = async (org: OrganizationRowData) => {
    setActionLoading(`status-${org.id}`);
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
      setActionLoading(null);
    }
  };

  const handleDeleteClick = (org: OrganizationRowData) => {
    setDeleteDialog({ open: true, org });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.org) return;

    setActionLoading(`delete-${deleteDialog.org.id}`);
    try {
      const result = await deleteOrganization(deleteDialog.org.id);
      if (result.success) {
        toast.success(t("toasts.deleted"), {
          description: t("toasts.deletedBody", { name: deleteDialog.org.name }),
        });
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
      setActionLoading(null);
      setDeleteDialog({ open: false, org: null });
    }
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", page.toString());
    router.push(`/super-admin/organizations?${params.toString()}`);
  };

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCommon("columns.organization")}</TableHead>
                <TableHead>{tCommon("columns.plan")}</TableHead>
                <TableHead className="text-center">{tCommon("columns.cars")}</TableHead>
                <TableHead className="text-center">{tCommon("columns.members")}</TableHead>
                <TableHead className="text-center">{tCommon("columns.testDrives")}</TableHead>
                <TableHead>{tCommon("columns.status")}</TableHead>
                <TableHead>{tCommon("columns.created")}</TableHead>
                <TableHead className="text-end">{tCommon("columns.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.length > 0 ? (
                organizations.map((org) => (
                  <OrganizationRow
                    key={org.id}
                    org={org}
                    onToggleStatus={handleToggleStatus}
                    onImpersonate={setImpersonateOrg}
                    onDelete={handleDeleteClick}
                    actionLoading={actionLoading}
                    isPending={isPending}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-48 p-0">
                    <EmptyState variant="inline" icon={Building2} title={t("empty")} />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() =>
                  handlePageChange(Math.max(1, pagination.page - 1))
                }
                className={
                  pagination.page <= 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
            {[...Array(pagination.totalPages)].map((_, i) => (
              <PaginationItem key={i + 1}>
                <PaginationLink
                  onClick={() => handlePageChange(i + 1)}
                  isActive={pagination.page === i + 1}
                  className="cursor-pointer"
                >
                  {number(i + 1)}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  handlePageChange(
                    Math.min(pagination.totalPages, pagination.page + 1)
                  )
                }
                className={
                  pagination.page >= pagination.totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Impersonate Modal */}
      {impersonateOrg && (
        <ImpersonateModal
          organization={impersonateOrg}
          onClose={() => setImpersonateOrg(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteOrganizationDialog
        open={deleteDialog.open}
        org={deleteDialog.org}
        onClose={() => setDeleteDialog({ open: false, org: null })}
        onConfirm={handleDeleteConfirm}
        isDeleting={actionLoading === `delete-${deleteDialog.org?.id}`}
      />
    </>
  );
}
