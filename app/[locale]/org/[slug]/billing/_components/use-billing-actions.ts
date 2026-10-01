"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useActionError } from "@/hooks/use-action-error";
import { cancelPlan, keepCurrentPlan, payRenewal } from "@/actions/billing";
import { useFormatters } from "@/hooks/use-formatters";
import type { ActionResponse } from "@/lib/utils/response";

type Busy = "pay" | "cancel" | "keep" | null;

/**
 * The owner's buttons on the billing page: pay the renewal (to Paymob), cancel
 * at period end, keep the current plan. One place for the loading state, the
 * toasts and the refresh, which the banner and the plan card both use.
 */
export function useBillingActions(organizationId: string) {
  const router = useRouter();
  const t = useTranslations("org.billing.current");
  const actionError = useActionError();
  const { date } = useFormatters();
  const [busy, setBusy] = useState<Busy>(null);

  const run = async <T,>(
    kind: Exclude<Busy, null>,
    call: () => Promise<ActionResponse<T>>,
    onDone: (data: T) => void
  ) => {
    setBusy(kind);
    try {
      const result = await call();
      if (!result.success) {
        toast.error(actionError(result.error, t("actionFailed")));
        setBusy(null);
        return;
      }
      onDone(result.data);
    } catch (error) {
      console.error(`Billing action ${kind} failed:`, error);
      toast.error(t("actionFailed"));
      setBusy(null);
    }
  };

  return {
    busy,
    /** To Paymob's checkout; the page stays busy while the browser leaves. */
    payNow: () =>
      run("pay", () => payRenewal(organizationId), ({ url }) => {
        window.location.href = url;
      }),
    cancel: () =>
      run("cancel", () => cancelPlan(organizationId), (result) => {
        toast.success(
          result.type === "scheduled" && result.effectiveAt
            ? t("canceled", { date: date(result.effectiveAt, { month: "long" }) })
            : t("canceledNow")
        );
        setBusy(null);
        router.refresh();
      }),
    keep: () =>
      run("keep", () => keepCurrentPlan(organizationId), () => {
        toast.success(t("kept"));
        setBusy(null);
        router.refresh();
      }),
  };
}
