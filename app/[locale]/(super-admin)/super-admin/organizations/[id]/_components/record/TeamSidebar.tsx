"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";
import type { DealershipDetail } from "@/lib/services/super-admin/dealership-detail";

type Member = Extract<DealershipDetail, { team: unknown }>["team"][number];

/**
 * Beside the Team tab's people: the seats the plan allows, and anyone invited
 * who has not signed in yet.
 */
export function TeamSidebar({
  team,
  pending,
  seats,
  planName,
  pendingOwnerEmail,
}: {
  team: Member[];
  pending: Member[];
  seats: number | null;
  planName: string;
  pendingOwnerEmail: string | null;
}) {
  const t = useTranslations("superAdmin.organizations.details.team");
  const fmt = useFormatters();
  const rich = {
    b: (chunks: ReactNode) => (
      <b className="font-semibold text-foreground">{chunks}</b>
    ),
  };

  return (
    <div className="flex flex-col gap-6">
      {seats !== null && (
        <section
          aria-labelledby="seats"
          className="rounded-[20px] border border-border bg-card px-4 py-4 sm:px-[22px]"
        >
          <h2 id="seats" className="text-[1.25rem] font-extrabold">
            {t("seats")}
          </h2>
          <p className="mt-1 text-caption text-muted-foreground">
            {seats < 0
              ? t("seatsUnlimited", {
                  used: fmt.number(team.length),
                  plan: planName,
                })
              : t("seatsLine", {
                  used: fmt.number(team.length),
                  limit: fmt.number(seats),
                  plan: planName,
                })}
          </p>
          <div
            aria-hidden
            className={cn("mt-3 flex gap-1.5", seats < 0 && "hidden")}
          >
            {Array.from({ length: Math.min(seats, 20) }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "h-3 flex-1 rounded-full",
                  i < team.length - pending.length
                    ? "bg-chart-1"
                    : i < team.length
                      ? "bg-[#e0a400]"
                      : "bg-muted",
                )}
              />
            ))}
          </div>
        </section>
      )}
      <section
        aria-labelledby="invitations"
        className="rounded-[20px] border border-border bg-card px-4 py-4 sm:px-[22px]"
      >
        <h2 id="invitations" className="text-[1.25rem] font-extrabold">
          {t("invitations")}
        </h2>
        <ul className="mt-2 flex flex-col gap-2 text-caption text-muted-foreground">
          {pendingOwnerEmail && (
            <li>
              {t.rich("ownerInvite", {
                email: pendingOwnerEmail,
                ...rich,
              })}
            </li>
          )}
          {pending.map((member) => (
            <li key={member.id}>
              {t.rich("memberPending", {
                name: member.user.name || member.user.email || "",
                ...rich,
              })}
            </li>
          ))}
          {!pendingOwnerEmail && pending.length === 0 && (
            <li>{t("noInvitations")}</li>
          )}
        </ul>
      </section>
    </div>
  );
}
