import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { useActionError } from "@/hooks/use-action-error";
import { exportUsers, updateUserRole } from "@/actions/super-admin";
import { userQueryString } from "@/lib/services/super-admin/users-options";
import type { UserRow, UsersPage } from "@/lib/services/super-admin/users";
import { downloadCsv } from "../../organizations/_components/use-dealership-display";
import { useUserDisplay } from "./use-user-display";

/**
 * The users list's state and what it does: the CSV export, and giving or
 * taking platform admin access, which asks first.
 */
export function useUsersList(data: UsersPage) {
  const t = useTranslations("superAdmin.users");
  const tCommon = useTranslations("superAdmin.common");
  const actionError = useActionError();
  const display = useUserDisplay();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [exporting, setExporting] = useState(false);
  const [changing, setChanging] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [impersonating, setImpersonating] = useState<UserRow | null>(null);
  const { query, rows } = data;

  const exportAll = async () => {
    setExporting(true);
    try {
      const result = await exportUsers(Object.fromEntries(new URLSearchParams(userQueryString(query))));
      if (result.success && result.data) downloadCsv(display.csv(result.data), `autome-users-${new Date().toISOString().slice(0, 10)}.csv`);
      else toast.error(t("exportFailed"));
    } catch {
      toast.error(t("exportFailed"));
    } finally {
      setExporting(false);
    }
  };

  const changeRole = async () => {
    if (!changing) return;
    const makingAdmin = changing.role !== "ADMIN";
    setSaving(true);
    try {
      const result = await updateUserRole(changing.id, makingAdmin ? "ADMIN" : "USER");
      if (result.success) {
        toast.success(t(makingAdmin ? "roleDialog.made" : "roleDialog.removed", { name: display.name(changing) }));
        startTransition(() => router.refresh());
      } else {
        toast.error(t("roleDialog.failed"), { description: actionError(result.error, tCommon("errorBody")) });
      }
    } catch {
      toast.error(tCommon("errorTitle"), { description: tCommon("errorBody") });
    } finally {
      setSaving(false);
      setChanging(null);
    }
  };

  return {
    query,
    rows,
    display,
    pending,
    startTransition,
    exporting,
    changing,
    setChanging,
    saving,
    impersonating,
    setImpersonating,
    exportAll,
    changeRole,
  };
}
