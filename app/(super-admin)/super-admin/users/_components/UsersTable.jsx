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

const roleConfig = {
  ADMIN: {
    label: "Admin",
  },
  USER: {
    label: "User",
  },
};

export default function UsersTable({ users, pagination }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [roleDialog, setRoleDialog] = useState({ open: false, user: null });
  const [newRole, setNewRole] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", newPage.toString());
    router.push(`/super-admin/users?${params.toString()}`);
  };

  const handleOpenRoleDialog = (user) => {
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
          description:
            result.error || "An error occurred while updating the role.",
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
                <TableCell colSpan={6} className="h-24 text-center">
                  No users found.
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
