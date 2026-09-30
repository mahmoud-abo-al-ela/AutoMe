"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getEmailPreferences, updateEmailPreferences } from "@/actions/settings";
import { queryKeys } from "@/lib/query-client";
import { useActionError } from "@/hooks/use-action-error";
import type { ActionError } from "@/lib/utils/error-messages";
import SettingsSkeleton from "../_components/Skeleton";

type EmailLocale = "ar" | "en";

/**
 * The weekly summary email: whether the owners get it every Saturday, and the
 * language the dealership's emails are written in (owner's choice — there was
 * no language setting before). Only an owner can save; the server checks.
 */
export default function WeeklySummarySettingsPage() {
  const t = useTranslations("org.settings.weeklySummary");
  const tSettings = useTranslations("org.settings");
  const { slug } = useParams<{ slug: string }>();
  const actionError = useActionError();
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(true);
  const [emailLocale, setEmailLocale] = useState<EmailLocale>("ar");

  const query = useQuery({
    queryKey: queryKeys.dashboard.emailPreferences(),
    queryFn: () => getEmailPreferences(),
  });

  useEffect(() => {
    const preferences = query.data?.success ? query.data.data : null;
    if (!preferences) return;
    setEnabled(preferences.weeklyDigestEnabled);
    setEmailLocale(preferences.emailLocale === "en" ? "en" : "ar");
  }, [query.data]);

  const save = useMutation({
    mutationFn: async () => {
      const response = await updateEmailPreferences({ weeklyDigestEnabled: enabled, emailLocale });
      if (!response.success) throw response.error;
      return response.data;
    },
    onSuccess: () => toast.success(t("saved")),
    onError: (error) => toast.error(actionError(error as unknown as ActionError, t("saveFailed"))),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.emailPreferences() }),
  });

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-2 sm:mb-6 sm:gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/org/${slug}/settings`} aria-label={tSettings("back")}>
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </Button>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="rounded-lg bg-sky-50 p-2">
            <Mail className="h-5 w-5 text-sky-600 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-3xl">{t("title")}</h1>
            <p className="text-xs text-gray-500 sm:text-base">{t("subtitle")}</p>
          </div>
        </div>
      </div>

      {query.isLoading ? (
        <SettingsSkeleton />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">{t("cardTitle")}</CardTitle>
            <CardDescription>{t("cardDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label htmlFor="weeklyDigestEnabled">{t("enabledLabel")}</Label>
                <p className="text-sm text-muted-foreground">{t("enabledHelp")}</p>
              </div>
              <Switch id="weeklyDigestEnabled" checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="space-y-2 sm:max-w-xs">
              <Label htmlFor="emailLocale">{t("languageLabel")}</Label>
              <Select value={emailLocale} onValueChange={(value) => setEmailLocale(value as EmailLocale)}>
                <SelectTrigger id="emailLocale">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">{t("languageHelp")}</p>
            </div>

            <div className="border-t pt-4">
              <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full cursor-pointer sm:w-auto">
                {save.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden />}
                {t("save")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
