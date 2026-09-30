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

  return (
    <div className="fixed top-0 start-0 end-0 z-50 bg-yellow-500 text-yellow-900">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">
            {t.rich(organization ? "viewingAsIn" : "viewingAs", {
              name: session?.targetUser?.name || t("unknownUser"),
              org: organization?.name,
              b: (chunks) => <strong>{chunks}</strong>,
            })}
          </span>
          <span className="text-xs opacity-75">
            {t("superAdmin", { name: session?.superAdmin?.name ?? "" })}
          </span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleEndImpersonation}
          disabled={ending}
          className="bg-yellow-100 hover:bg-yellow-200 text-yellow-900"
        >
          {ending ? (
            <>
              <Loader2 className="h-3 w-3 me-1 animate-spin" />
              {t("ending")}
            </>
          ) : (
            <>
              <LogOut className="h-3 w-3 me-1" />
              {t("exit")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
