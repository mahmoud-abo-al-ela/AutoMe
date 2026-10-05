"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useActionError } from "@/hooks/use-action-error";
import { useRouter } from "@/i18n/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { updateUserRole } from "@/actions/super-admin";
import UserRow from "./UserRow";
import ChangeRoleDialog from "./ChangeRoleDialog";
import UsersPagination from "./UsersPagination";
import { EmptyState } from "@/components/common/EmptyState";
import { Users } from "lucide-react";
import { Prisma, type UserRole } from "@/lib/generated/prisma";

/** A user row as page.tsx selects it, with memberships and activity counts. */
export type SuperAdminUserRow = Prisma.UserGetPayload<{
  include: {
    memberships: {
      include: {
        organization: { select: { id: true; name: true; slug: true } };
      };
    };
    _count: { select: { savedCars: true; testDrives: true } };
  };
}>;

export type UsersPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default function UsersTable({
  users,
  pagination,
}: {
  users: SuperAdminUserRow[];
  pagination: UsersPagination;
}) {
  const t = useTranslations("superAdmin.users");
  const tCommon = useTranslations("superAdmin.common");
  const actionError = useActionError();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [roleDialog, setRoleDialog] = useState<{
    open: boolean;
    user: SuperAdminUserRow | null;
  }>({ open: false, user: null });
  // "" is the not-yet-chosen state; every guarded read narrows it away.
  const [newRole, setNewRole] = useState<UserRole | "">("");
  const [loading, setLoading] = useState(false);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", newPage.toString());
    router.push(`/super-admin/users?${params.toString()}`);
  };

  const handleOpenRoleDialog = (user: SuperAdminUserRow) => {
    setNewRole(user.role);
    setRoleDialog({ open: true, user });
  };

  const handleRoleChange = async () => {
    if (!roleDialog.user || !newRole) return;

    setLoading(true);
    try {
      const result = await updateUserRole(roleDialog.user.id, newRole);
      if (result.success) {
        toast.success(
          t("changeRole.updated", { role: t(`roles.${newRole}`) }),
          {
            description: t("changeRole.updatedBody", {
              name: roleDialog.user.name ?? roleDialog.user.email ?? "",
            }),
          }
        );
        setRoleDialog({ open: false, user: null });
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(t("changeRole.failed"), {
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

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.user")}</TableHead>
              <TableHead>{t("columns.role")}</TableHead>
              <TableHead>{t("columns.organizations")}</TableHead>
              <TableHead>{t("columns.activity")}</TableHead>
              <TableHead>{t("columns.joined")}</TableHead>
              <TableHead className="w-[50px]">
                <span className="sr-only">{tCommon("actions")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 p-0">
                  <EmptyState variant="inline" icon={Users} title={t("empty")} />
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onChangeRole={handleOpenRoleDialog}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UsersPagination
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      <ChangeRoleDialog
        open={roleDialog.open}
        user={roleDialog.user}
        currentRole={newRole}
        onClose={() => setRoleDialog({ open: false, user: null })}
        onRoleChange={setNewRole}
        onConfirm={handleRoleChange}
        loading={loading}
        isPending={isPending}
      />
    </div>
  );
}
