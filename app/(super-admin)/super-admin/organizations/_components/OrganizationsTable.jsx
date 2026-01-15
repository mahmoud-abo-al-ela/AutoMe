"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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

export default function OrganizationsTable({ organizations, pagination }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [impersonateOrg, setImpersonateOrg] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, org: null });

  const handleToggleStatus = async (org) => {
    setActionLoading(`status-${org.id}`);
    try {
      const result = await updateOrganizationStatus(org.id, !org.isActive);
      if (result.success) {
        toast.success(
          org.isActive ? "Organization suspended" : "Organization activated",
          {
            description: `${org.name} has been ${
              org.isActive ? "suspended" : "activated"
            }.`,
          }
        );
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
      setActionLoading(null);
    }
  };

  const handleDeleteClick = (org) => {
    setDeleteDialog({ open: true, org });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.org) return;

    setActionLoading(`delete-${deleteDialog.org.id}`);
    try {
      const result = await deleteOrganization(deleteDialog.org.id);
      if (result.success) {
        toast.success("Organization deleted", {
          description: `${deleteDialog.org.name} has been deleted.`,
        });
        startTransition(() => {
          router.refresh();
        });
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
      setActionLoading(null);
      setDeleteDialog({ open: false, org: null });
    }
  };

  const handlePageChange = (page) => {
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
                <TableHead>Organization</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-center">Cars</TableHead>
                <TableHead className="text-center">Members</TableHead>
                <TableHead className="text-center">Test Drives</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No organizations found
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
                  {i + 1}
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

