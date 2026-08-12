"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Shield, User, Crown, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { updateMemberRole, removeMember } from "@/actions/team";

const roleColors = {
  OWNER: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  MEMBER: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const roleIcons = {
  OWNER: Crown,
  MEMBER: User,
};

export default function TeamTable({
  members,
  currentUserId,
  isOwner,
  organizationId,
}) {
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRemove = async (memberId) => {
    setLoading(true);
    try {
      const result = await removeMember({
        organizationId,
        memberId,
      });

      if (result.success) {
        toast.success("Member removed successfully");
        setConfirmRemove(null);
      } else {
        toast.error(result.error?.message || "Failed to remove member");
      }
    } catch (error) {
      toast.error("Failed to remove member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              {isOwner && <TableHead className="w-[70px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const RoleIcon = roleIcons[member.role];
              const isCurrentUser = member.user.id === currentUserId;
              const isOwner = member.role === "OWNER";

              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {member.user.imageUrl ? (
                        <img
                          src={member.user.imageUrl}
                          alt={member.user.name || "User"}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {member.user.name || "Unnamed User"}
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {member.user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${roleColors[member.role]} gap-1`}>
                      <RoleIcon className="h-3 w-3" />
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </TableCell>
                  {isOwner && (
                    <TableCell>
                      {!isOwner && !isCurrentUser && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              disabled={loading}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive cursor-pointer"
                              onClick={() => setConfirmRemove(member)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!confirmRemove}
        onOpenChange={() => setConfirmRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>
                {confirmRemove?.user?.name || confirmRemove?.user?.email}
              </strong>{" "}
              from your organization? They will no longer have access to this
              dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleRemove(confirmRemove?.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
