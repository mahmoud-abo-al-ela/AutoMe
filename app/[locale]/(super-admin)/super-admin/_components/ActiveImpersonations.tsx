import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { formatRelativeToNow } from "@/lib/utils/datetime";
import { formatNumber } from "@/lib/utils/number";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { UserCog, ArrowRight, Clock, AlertCircle } from "lucide-react";
import {
  getActiveImpersonationCount,
  getImpersonationSessions,
} from "@/lib/services/impersonation";

export default async function ActiveImpersonations() {
  // A server component, so the locale comes from getLocale rather than the
  // useFormatters hook.
  const locale = (await getLocale()) as Locale;
  const relativeToNow = (value: Date | string | number) =>
    formatRelativeToNow(value, locale);
  const t = await getTranslations("superAdmin.overview.activeImpersonations");
  const tCommon = await getTranslations("superAdmin.common");
  const activeCount = await getActiveImpersonationCount();
  const { sessions } = await getImpersonationSessions({
    filters: { activeOnly: true },
    pagination: { page: 1, limit: 5 },
  });

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCog className="h-5 w-5 text-muted-foreground" />
            {t("title")}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t("subtitle")}
          </p>
        </div>
        {/* Styles on the Link, not <Button asChild>: in a server component
            Radix Slot 1.2.2 can receive the link as a lazy element and render
            nothing. */}
        <Link
          href="/super-admin/impersonation"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {tCommon("viewAll")}
          <ArrowRight className="h-4 w-4 ms-1 rtl:rotate-180" />
        </Link>
      </CardHeader>
      <CardContent>
        {activeCount > 0 ? (
          <div className="space-y-3">
            {/* Warning banner */}
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm text-yellow-700 dark:text-yellow-300">
                {t("count", {
                  count: activeCount,
                  value: formatNumber(activeCount, locale),
                })}
              </span>
            </div>

            {/* Active sessions list */}
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {session.superAdmin?.name || tCommon("unknown")}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground rtl:rotate-180" />
                      <span className="text-sm">
                        {session.targetUser?.name || tCommon("unknown")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {session.targetOrganization?.name || tCommon("unknown")}
                      </Badge>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {relativeToNow(new Date(session.startedAt))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
              <UserCog className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t("empty")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
