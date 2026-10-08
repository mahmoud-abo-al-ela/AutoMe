"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, UserCog, Loader2 } from "lucide-react";
import { startImpersonationAction } from "@/actions/impersonation";
import { toast } from "sonner";
import { useActionError } from "@/hooks/use-action-error";
import { Prisma } from "@/lib/generated/prisma";

/**
 * A member as /api/super-admin/organizations/[id]/members returns it. That
 * route is still JavaScript, so this is a hand-written mirror of its query
 * rather than an inferred type; it will not track changes there
 * automatically.
 */
type OrgMemberOption = Prisma.MembershipGetPayload<{
  include: {
    user: { select: { id: true; name: true; email: true; imageUrl: true } };
  };
}>;

export default function ImpersonateModal({
  organization,
  onClose,
}: {
  organization: { id: string; name: string; slug: string };
  onClose: () => void;
}) {
  const t = useTranslations("superAdmin.organizations.impersonate");
  const tCommon = useTranslations("superAdmin.common");
  const tActions = useTranslations("common.actions");
  const tRoles = useTranslations("org.settings.team.roles");
  const locale = useLocale();
  const actionError = useActionError();
  const [members, setMembers] = useState<OrgMemberOption[]>([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Fetch organization members
  useEffect(() => {
    async function fetchMembers() {
      try {
        const response = await fetch(
          `/api/super-admin/organizations/${organization.id}/members`
        );
        if (response.ok) {
          const data = await response.json();
          setMembers(data.members || []);
          // Auto-select owner/admin if available
          const owner = data.members?.find(
            (m: OrgMemberOption) => m.role === "OWNER"
          );
          if (owner) {
            setSelectedMember(owner.userId);
          }
        }
      } catch (error) {
        console.error("Failed to fetch members:", error);
      } finally {
        setLoadingMembers(false);
      }
    }

    fetchMembers();
  }, [organization.id]);

  const handleImpersonate = async () => {
    if (!selectedMember || !reason.trim()) {
      toast.error(t("missingFields"));
      return;
    }

    setLoading(true);
    try {
      const result = await startImpersonationAction({
        targetUserId: selectedMember,
        targetOrganizationId: organization.id,
        reason: reason.trim(),
      });

      if (result.success) {
        toast.success(t("started"));
        // A full navigation, so the dashboard loads with the impersonation
        // cookie. The locale is spelled out: without it the request lands on
        // the default locale, not the one the admin is reading.
        window.location.href = `/${locale}/org/${organization.slug}/dashboard`;
      } else {
        toast.error(actionError(result.error, tCommon("errorBody")));
      }
    } catch (error) {
      toast.error(tCommon("errorTitle"));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-purple-600" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {t.rich("description", {
              name: organization.name,
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              <p className="font-medium">{t("auditTitle")}</p>
              <p className="mt-1">{t("auditBody")}</p>
            </div>
          </div>

          {/* User Selection */}
          <div className="space-y-2">
            <Label htmlFor="user">{t("userLabel")}</Label>
            {loadingMembers ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("loadingMembers")}
              </div>
            ) : (
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger id="user">
                  <SelectValue placeholder={t("userPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      <div className="flex items-center gap-2">
                        <span>{member.user?.name || member.user?.email}</span>
                        <span className="text-xs text-muted-foreground">
                          ({tRoles(member.role)})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">{t("reasonLabel")} *</Label>
            <Textarea
              id="reason"
              placeholder={t("reasonPlaceholder")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {t("reasonHelp")}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {tActions("cancel")}
          </Button>
          <Button
            onClick={handleImpersonate}
            disabled={!selectedMember || !reason.trim() || loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {t("starting")}
              </>
            ) : (
              <>
                <UserCog className="h-4 w-4 me-2" />
                {t("submit")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
