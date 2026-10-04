import { UserCog, AlertTriangle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatNumber } from "@/lib/utils/number";
import type { Locale } from "@/i18n/routing";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ImpersonationHeader({
  activeCount,
}: {
  activeCount: number;
}) {
  const t = useTranslations("superAdmin.impersonation");
  const locale = useLocale() as Locale;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <UserCog className="h-8 w-8" />
          {t("title")}
        </h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {activeCount > 0 && (
        <Alert
          // Alert defines only default and destructive; the warning look comes
          // entirely from these classes.
          className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t("activeAlert", {
              count: activeCount,
              value: formatNumber(activeCount, locale),
            })}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
