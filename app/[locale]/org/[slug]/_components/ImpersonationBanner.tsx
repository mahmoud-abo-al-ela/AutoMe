"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { AlertCircle, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { endImpersonationAction } from "@/actions/impersonation";
import { toast } from "sonner";
import { useActionError } from "@/hooks/use-action-error";
import type { getCurrentImpersonationSession } from "@/lib/services/impersonation/impersonation";
import type { Organization } from "@/lib/generated/prisma";

/**
 * Derived from the service rather than restated, so a change to what
 * getCurrentImpersonationSession selects shows up here. `import type` is erased,
 * so this does not pull the server module into the client bundle.
 */
type ImpersonationSession = NonNullable<
  Awaited<ReturnType<typeof getCurrentImpersonationSession>>
>;

export default function ImpersonationBanner({
  session,
  organization,
}: {
  session: ImpersonationSession;
  organization: Organization;
}) {
  const t = useTranslations("org.impersonation");
  const tError = useTranslations("errors");
  const actionError = useActionError();
  const locale = useLocale();
  const router = useRouter();
  const [ending, setEnding] = useState(false);

  const handleEndImpersonation = async () => {
    setEnding(true);
    try {
      const result = await endImpersonationAction();

      if (result.success) {
        toast.success(t("ended"));
        // A hard reload, because ending the session changes the server-side
        // context every page reads. The locale has to be written back in: both
        // locales are prefixed, so a bare "/super-admin" would land the reader
        // in English no matter which side they were reading.
        window.location.href = `/${locale}/super-admin`;
      } else {
        toast.error(actionError(result.error, t("endFailed")));
        setEnding(false);
      }
    } catch (error) {
      toast.error(tError("generic"));
      setEnding(false);
    }
  };

  // A band at the top of the work area rather than a fixed overlay, which
  // covered the top of every page. Marker yellow with hazard stripes: a state
  // to notice, not a decoration.
  return (
    <div role="status" className="relative isolate overflow-hidden border-b-2 border-border-strong bg-marker text-marker-foreground">
      <div aria-hidden className="hazard-stripes absolute inset-0 -z-10 opacity-60" />
      <div className="mx-auto flex w-full max-w-[1760px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6 md:px-8">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <AlertCircle aria-hidden className="size-4 shrink-0" />
          <span className="text-caption font-medium">
            {t.rich(organization ? "viewingAsIn" : "viewingAs", {
              name: session?.targetUser?.name || t("unknownUser"),
              org: organization?.name,
              b: (chunks) => <strong>{chunks}</strong>,
            })}
          </span>
          <span className="text-micro opacity-75">
            {t("superAdmin", { name: session?.superAdmin?.name ?? "" })}
          </span>
        </div>
        <Button size="control" variant="inverse" onClick={handleEndImpersonation} disabled={ending} className="h-9">
          {ending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <LogOut aria-hidden className="size-4" />}
          {ending ? t("ending") : t("exit")}
        </Button>
      </div>
    </div>
  );
}
