"use client";

import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * For members: they can see the plan and what it covers, but only an owner
 * changes it or pays — so the notice says who to ask, with their email.
 */
export default function NonOwnerBillingNotice({
  ownerName,
  ownerEmail,
}: {
  ownerName: string | null | undefined;
  ownerEmail: string | null | undefined;
}) {
  const t = useTranslations("org.billing.nonOwner");

  return (
    <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-2xl border border-border bg-card px-4 py-3 text-caption">
      <Lock aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      <span>{t("body")}</span>
      {(ownerName || ownerEmail) && (
        <span className="text-muted-foreground">
          {t("ask")}{" "}
          {ownerEmail ? (
            <a href={`mailto:${ownerEmail}`} className="font-semibold text-[#1d4e9e] underline-offset-2 hover:underline">
              <bdi>{ownerName || ownerEmail}</bdi>
            </a>
          ) : (
            <bdi className="font-semibold text-foreground">{ownerName}</bdi>
          )}
        </span>
      )}
    </p>
  );
}
