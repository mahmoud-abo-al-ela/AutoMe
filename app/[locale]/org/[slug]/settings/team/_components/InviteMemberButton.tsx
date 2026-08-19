"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inviteTeamMember } from "@/actions/team";
import { queryKeys } from "@/lib/query-client";
import type { TeamMemberRole } from "../_lib/team-types";

interface InviteMemberButtonProps {
  organizationId: string;
  canAdd: boolean;
}

export default function InviteMemberButton({
  organizationId,
  canAdd,
}: InviteMemberButtonProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamMemberRole>("MEMBER");
  const queryClient = useQueryClient();

  const { isPending: loading, mutateAsync: inviteFn } = useMutation({
    mutationFn: inviteTeamMember,
  });

  const handleInvite = async () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    try {
      const response = await inviteFn({
        organizationId,
        email,
        role,
      });

      if (response?.success) {
        toast.success("Member invited successfully");
        setOpen(false);
        setEmail("");
        setRole("MEMBER");
        queryClient.invalidateQueries({ queryKey: queryKeys.team.members(organizationId) }); // Refresh to show new member
      } else {
        toast.error(response?.error?.message || "Failed to invite member");
      }
    } catch (error) {
      console.error("Invite error:", error);
      toast.error("An error occurred while inviting the member");
    }
  };

  if (!canAdd) {
    return (
      <Button disabled variant="outline" size="sm">
        <UserPlus className="h-4 w-4 mr-2" />
        Member Limit Reached
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="cursor-pointer">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Invite a new member to join your organization. They must have an
            account to accept the invitation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="member@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            {/* Radix hands back a plain string; the only two items rendered
                below are the two roles, so the narrowing is sound. */}
            <Select
              value={role}
              onValueChange={(value) => setRole(value as TeamMemberRole)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="OWNER">Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="cursor-pointer">
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={loading} className="cursor-pointer">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Inviting...
              </>
            ) : (
              "Send Invitation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
