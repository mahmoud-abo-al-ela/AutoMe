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
import { useTranslations } from "next-intl";
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
  const t = useTranslations("org.settings.team.invite");
  const tRoles = useTranslations("org.settings.team.roles");
  const tCommon = useTranslations("common.actions");
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamMemberRole>("MEMBER");
  const queryClient = useQueryClient();

  const { isPending: loading, mutateAsync: inviteFn } = useMutation({
    mutationFn: inviteTeamMember,
  });

  const handleInvite = async () => {
    if (!email) {
      toast.error(t("emailRequired"));
      return;
    }

    try {
      const response = await inviteFn({
        organizationId,
        email,
        role,
      });

      if (response?.success) {
        toast.success(t("invited"));
        setOpen(false);
        setEmail("");
        setRole("MEMBER");
        queryClient.invalidateQueries({ queryKey: queryKeys.team.members(organizationId) }); // Refresh to show new member
      } else {
        toast.error(response?.error?.message || t("failed"));
      }
    } catch (error) {
      console.error("Invite error:", error);
      toast.error(t("unexpected"));
    }
  };

  if (!canAdd) {
    return (
      <Button disabled variant="outline" size="sm">
        <UserPlus className="h-4 w-4 me-2" />
        {t("limitReached")}
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="cursor-pointer">
          <UserPlus className="h-4 w-4 me-2" />
          {t("cta")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("emailLabel")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">{t("roleLabel")}</Label>
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
                <SelectItem value="MEMBER">{tRoles("MEMBER")}</SelectItem>
                <SelectItem value="OWNER">{tRoles("OWNER")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="cursor-pointer">
            {tCommon("cancel")}
          </Button>
          <Button onClick={handleInvite} disabled={loading} className="cursor-pointer">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {t("submitting")}
              </>
            ) : (
              t("submit")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
