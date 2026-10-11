import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { useActionError } from "@/hooks/use-action-error";
import { useFormatters } from "@/hooks/use-formatters";
import { deleteOrganization, exportDealerships, updateOrganizationStatus } from "@/actions/super-admin";
import { DEALERSHIPS_PER_PAGE, dealershipQueryString } from "@/lib/services/super-admin/dealerships-options";
import type { DealershipRow, DealershipsPage } from "@/lib/services/super-admin/dealerships";
import { downloadCsv, useDealershipDisplay } from "./use-dealership-display";

const BASE = "/super-admin/organizations";

/**
 * The dealerships list's state and what it does: the selection, suspending
 * (which asks first) and reactivating one or many, deleting, the CSV export,
 * and where each page lives.
 */
export function useDealershipsList(data: DealershipsPage) {
  const t = useTranslations("superAdmin.organizations");
  const tCommon = useTranslations("superAdmin.common");
  const actionError = useActionError();
  const fmt = useFormatters();
  const display = useDealershipDisplay();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [impersonating, setImpersonating] = useState<DealershipRow | null>(null);
  const [deleting, setDeleting] = useState<DealershipRow | null>(null);
  // Suspending hides a storefront from buyers, so it asks first; reactivating does not.
  const [suspending, setSuspending] = useState<DealershipRow[] | null>(null);
  const { query, rows } = data;
  const n = (value: number) => fmt.number(value);

  const refresh = () => startTransition(() => router.refresh());
  const chosen = rows.filter((row) => selected.has(row.id));
  const allChosen = rows.length > 0 && chosen.length === rows.length;
  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const setStatus = async (targets: DealershipRow[], isActive: boolean) => {
    const changing = targets.filter((row) => row.isActive !== isActive);
    if (changing.length === 0) return;
    setBusy(changing.length === 1 ? changing[0].id : "bulk");
    try {
      const results = await Promise.all(changing.map((row) => updateOrganizationStatus(row.id, isActive)));
      const failed = results.filter((result) => !result.success);
      if (changing.length === 1) {
        const [row] = changing;
        if (failed.length) {
          toast.error(t("toasts.statusFailed"), { description: actionError(failed[0].success ? undefined : failed[0].error, tCommon("errorBody")) });
        } else {
          toast.success(isActive ? t("toasts.activated") : t("toasts.suspended"), {
            description: isActive ? t("toasts.activatedBody", { name: row.name }) : t("toasts.suspendedBody", { name: row.name }),
          });
        }
      } else if (failed.length) {
        toast.error(t("toasts.bulkFailed"));
      } else {
        const values = { count: changing.length, value: n(changing.length) };
        toast.success(isActive ? t("toasts.bulkActivated", values) : t("toasts.bulkSuspended", values));
        setSelected(new Set());
      }
      refresh();
    } catch {
      toast.error(tCommon("errorTitle"), { description: tCommon("errorBody") });
    } finally {
      setBusy(null);
    }
  };

  const requestStatus = (targets: DealershipRow[], isActive: boolean) => {
    if (isActive) return setStatus(targets, true);
    const active = targets.filter((row) => row.isActive);
    if (active.length > 0) setSuspending(active);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(`delete-${deleting.id}`);
    try {
      const result = await deleteOrganization(deleting.id);
      if (result.success) {
        toast.success(t("toasts.deleted"), { description: t("toasts.deletedBody", { name: deleting.name }) });
        setSelected((current) => {
          const next = new Set(current);
          next.delete(deleting.id);
          return next;
        });
        refresh();
      } else {
        toast.error(t("toasts.deleteFailed"), { description: actionError(result.error, tCommon("errorBody")) });
      }
    } catch {
      toast.error(tCommon("errorTitle"), { description: tCommon("errorBody") });
    } finally {
      setBusy(null);
      setDeleting(null);
    }
  };

  const filename = () => `autome-dealerships-${new Date().toISOString().slice(0, 10)}.csv`;
  const exportAll = async () => {
    setExporting(true);
    try {
      const params = Object.fromEntries(new URLSearchParams(dealershipQueryString(query)));
      const result = await exportDealerships(params);
      if (result.success && result.data) downloadCsv(display.csv(result.data), filename());
      else toast.error(t("exportFailed"));
    } catch {
      toast.error(t("exportFailed"));
    } finally {
      setExporting(false);
    }
  };

  const from = data.total === 0 ? 0 : (query.page - 1) * DEALERSHIPS_PER_PAGE + 1;
  const to = Math.min(query.page * DEALERSHIPS_PER_PAGE, data.total);
  const pageHref = (page: number) => `${BASE}${dealershipQueryString({ ...query, page })}`;

  return {
    query,
    rows,
    display,
    pending,
    startTransition,
    selected,
    setSelected,
    busy,
    exporting,
    impersonating,
    setImpersonating,
    deleting,
    setDeleting,
    suspending,
    setSuspending,
    chosen,
    allChosen,
    toggle,
    setStatus,
    requestStatus,
    confirmDelete,
    exportAll,
    filename,
    from,
    to,
    pageHref,
  };
}
