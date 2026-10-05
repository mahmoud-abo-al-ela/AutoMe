"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserRole } from "@/lib/generated/prisma";
import type { SuperAdminUserRow } from "./UsersTable";

export default function ChangeRoleDialog({
  open,
  user,
  currentRole,
  onClose,
  onRoleChange,
  onConfirm,
  loading,
  isPending,
}: {
  open: boolean;
  user: SuperAdminUserRow | null;
  currentRole: UserRole | "";
  onClose: () => void;
  onRoleChange: (role: UserRole) => void;
  onConfirm: () => void;
  loading: boolean;
  isPending: boolean;
}) {
  const t = useTranslations("superAdmin.users");
  const tActions = useTranslations("common.actions");

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("changeRole.title")}</DialogTitle>
          <DialogDescription>
            {t("changeRole.description", { name: user?.name ?? "" })}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select value={currentRole} onValueChange={onRoleChange}>
            <SelectTrigger aria-label={t("changeRole.placeholder")}>
              <SelectValue placeholder={t("changeRole.placeholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USER">{t("roles.USER")}</SelectItem>
              <SelectItem value="ADMIN">{t("roles.ADMIN")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading || isPending}
          >
            {tActions("cancel")}
          </Button>
          <Button onClick={onConfirm} disabled={loading || isPending}>
            {loading || isPending ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {t("changeRole.submitting")}
              </>
            ) : (
              t("changeRole.submit")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
