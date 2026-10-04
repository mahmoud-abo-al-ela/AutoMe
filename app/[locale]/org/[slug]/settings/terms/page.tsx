"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Handshake, Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDealershipTerms, updateDealershipTerms } from "@/actions/settings";
import { queryKeys } from "@/lib/query-client";
import { useActionError } from "@/hooks/use-action-error";
import type { ActionError } from "@/lib/utils/error-messages";
import {
  DEALERSHIP_TERM_FLAGS,
  UNSET,
  triStateFromForm,
  triStateToForm,
  type TriStateFormValue,
} from "@/lib/utils/car-disclosures";
import SettingsSkeleton from "../_components/Skeleton";

type Flag = (typeof DEALERSHIP_TERM_FLAGS)[number];
type FormState = Record<Flag, TriStateFormValue> & { financingNote: string };

const EMPTY: FormState = {
  offersFinancing: UNSET,
  acceptsTradeIn: UNSET,
  allowsInspection: UNSET,
  offersDelivery: UNSET,
  financingNote: "",
};

/**
 * The dealership's standing terms: shown on every one of its listings, and
 * cited by the buyer assistant. "Not stated" shows nothing and lets the
 * assistant say "ask the dealer" — it is never read as "no".
 */
export default function DealershipTermsPage() {
  const t = useTranslations("org.settings.terms");
  const tSettings = useTranslations("org.settings");
  const { slug } = useParams<{ slug: string }>();
  const actionError = useActionError();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);

  const query = useQuery({
    queryKey: queryKeys.dashboard.dealershipTerms(),
    queryFn: () => getDealershipTerms(),
  });

  useEffect(() => {
    const terms = query.data?.success ? query.data.data : null;
    if (!terms) return;
    setForm({
      offersFinancing: triStateToForm(terms.offersFinancing),
      acceptsTradeIn: triStateToForm(terms.acceptsTradeIn),
      allowsInspection: triStateToForm(terms.allowsInspection),
      offersDelivery: triStateToForm(terms.offersDelivery),
      financingNote: terms.financingNote ?? "",
    });
  }, [query.data]);

  const save = useMutation({
    mutationFn: async () => {
      const response = await updateDealershipTerms({
        offersFinancing: triStateFromForm(form.offersFinancing),
        acceptsTradeIn: triStateFromForm(form.acceptsTradeIn),
        allowsInspection: triStateFromForm(form.allowsInspection),
        offersDelivery: triStateFromForm(form.offersDelivery),
        financingNote: form.financingNote.trim() || null,
      });
      if (!response.success) throw response.error;
      return response.data;
    },
    onSuccess: () => toast.success(t("saved")),
    onError: (error) => toast.error(actionError(error as unknown as ActionError, t("saveFailed"))),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.dealershipTerms() }),
  });

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/org/${slug}/settings`} aria-label={tSettings("back")}>
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </Button>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-emerald-50 p-2 rounded-lg">
            <Handshake className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">{t("title")}</h1>
            <p className="text-xs sm:text-base text-gray-500">{t("subtitle")}</p>
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
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {DEALERSHIP_TERM_FLAGS.map((flag) => (
                <div key={flag} className="space-y-2">
                  <Label htmlFor={flag}>{t(`fields.${flag}`)}</Label>
                  <Select
                    value={form[flag]}
                    onValueChange={(value) => setForm({ ...form, [flag]: value as TriStateFormValue })}
                  >
                    <SelectTrigger id={flag}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNSET}>{t("notStated")}</SelectItem>
                      <SelectItem value="yes">{t("yes")}</SelectItem>
                      <SelectItem value="no">{t("no")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {form.offersFinancing === "yes" && (
              <div className="space-y-2">
                <Label htmlFor="financingNote">{t("fields.financingNote")}</Label>
                <Textarea
                  id="financingNote"
                  // "auto" only once there is text: an empty field has nothing to judge by
                  // (the placeholder does not count), so "auto" fell back to LTR and the
                  // Arabic page showed its placeholder and caret on the left. Empty, it
                  // follows the page; typed, it follows the text.
                  dir={form.financingNote ? "auto" : undefined}
                  maxLength={200}
                  rows={2}
                  placeholder={t("financingNotePlaceholder")}
                  value={form.financingNote}
                  onChange={(event) => setForm({ ...form, financingNote: event.target.value })}
                />
              </div>
            )}

            <div className="border-t pt-4">
              <Button
                onClick={() => save.mutate()}
                disabled={save.isPending}
                className="w-full cursor-pointer sm:w-auto"
              >
                {save.isPending && <Loader2 className="h-4 w-4 animate-spin me-2" aria-hidden />}
                {t("save")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
