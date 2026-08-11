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
import { toast } from "sonner";
import { updateUserRole } from "@/actions/super-admin";
import UserRow from "./UserRow";
import ChangeRoleDialog from "./ChangeRoleDialog";
import UsersPagination from "./UsersPagination";
import { EmptyState } from "@/components/common/EmptyState";
import { Users } from "lucide-react";
import { Prisma, type UserRole } from "@/lib/generated/prisma";

const roleConfig: Record<UserRole, { label: string }> = {
  ADMIN: {
    label: "Admin",
  },
  USER: {
    label: "User",
  },
};

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
        toast.success(`Role updated to ${roleConfig[newRole].label}`, {
          description: `${roleDialog.user.name}'s role has been changed successfully.`,
        });
        setRoleDialog({ open: false, user: null });
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error("Failed to update role", {
          // BUG (flagged, not fixed in this conversion): same defect as
          // ActiveSessions.tsx — result.error is the error object, not a
          // string, and should be result.error.message.
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

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Organizations</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 p-0">
                  <EmptyState variant="inline" icon={Users} title="No users found" />
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
