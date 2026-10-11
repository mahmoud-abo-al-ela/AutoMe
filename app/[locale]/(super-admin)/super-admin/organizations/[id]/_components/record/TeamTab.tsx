"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";
import type { DealershipDetail } from "@/lib/services/super-admin/dealership-detail";
import ImpersonateModal from "../../../_components/ImpersonateModal";
import { panel, td, th } from "./record-styles";
import { TeamSidebar } from "./TeamSidebar";
import { usePlanName } from "./use-plan-name";

/**
 * The Team tab (canvas: dealership tabs round 1, "Team A · People table"):
 * each person with their role, when they joined and what they have done, and
 * a support session as them; beside it the seats the plan allows and anyone
 * invited who has not signed in yet.
 */
export function TeamTab({
  data,
}: {
  data: Extract<DealershipDetail, { team: unknown }>;
}) {
  const t = useTranslations("superAdmin.organizations.details.team");
  const tRoles = useTranslations("org.settings.team.roles");
  const fmt = useFormatters();
  const [signingInAs, setSigningInAs] = useState<string | null>(null);
  const { team, seats, dealership: org, subscription: sub } = data;
  const planNameOf = usePlanName();
  const planName = planNameOf({ type: sub?.plan.type ?? "STARTER", name: sub?.plan.name ?? "" });
  const pending = team.filter((member) => member.pending);
  const initials = (name: string) =>
    name
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section aria-labelledby="people" className={panel}>
        <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <h2 id="people" className="text-[1.25rem] font-extrabold">
            {t("people")}
          </h2>
        </header>
        {team.length === 0 ? (
          <p className="border-t border-border px-4 py-5 text-caption text-muted-foreground sm:px-5">
            {t("empty")}
          </p>
        ) : (
          <>
            {/* Phones: one card per person. */}
            <ul className="flex flex-col border-t border-border lg:hidden">
              {team.map((member) => {
                const name = member.user.name || member.user.email || "";
                return (
                  <li
                    key={member.id}
                    className="flex flex-col gap-3 border-b border-border px-4 py-3 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e7eef8] text-micro font-extrabold text-[#1d4e9e]"
                      >
                        {initials(name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">
                          <bdi>{name}</bdi>
                        </p>
                        {member.user.name && member.user.email && (
                          <p
                            className="truncate text-micro text-muted-foreground"
                            dir="ltr"
                          >
                            {member.user.email}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-micro font-bold",
                          member.role === "OWNER"
                            ? "bg-[#e7eef8] text-[#1d4e9e]"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {tRoles(member.role)}
                      </span>
                    </div>
                    {member.pending && (
                      <p className="text-micro font-semibold text-[#7a5200]">
                        {t("notSignedIn")}
                      </p>
                    )}
                    <dl className="grid grid-cols-3 gap-2 text-micro text-muted-foreground">
                      {(
                        [
                          [
                            t("joined"),
                            fmt.date(member.joinedAt, { year: undefined }),
                          ],
                          [t("carsAdded"), fmt.number(member.carsAdded)],
                          [t("changes"), fmt.number(member.recentChanges)],
                        ] as const
                      ).map(([label, value]) => (
                        <div key={label}>
                          <dd className="text-caption font-semibold text-foreground tabular-nums">
                            {value}
                          </dd>
                          <dt>{label}</dt>
                        </div>
                      ))}
                    </dl>
                    <Button
                      variant="outline-strong"
                      size="sm"
                      className="h-10 w-full bg-field"
                      onClick={() => setSigningInAs(member.user.id)}
                    >
                      {t("signInAs", {
                        name: (member.user.name || name).split(" ")[0],
                      })}
                    </Button>
                  </li>
                );
              })}
            </ul>
            <div className="relative hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[820px] border-collapse text-caption">
                <thead>
                  <tr className="whitespace-nowrap border-y border-border bg-muted/60 text-muted-foreground">
                    <th scope="col" className={th}>
                      {t("person")}
                    </th>
                    <th scope="col" className={th}>
                      {t("role")}
                    </th>
                    <th scope="col" className={th}>
                      {t("joined")}
                    </th>
                    <th scope="col" className={th}>
                      {t("carsAdded")}
                    </th>
                    <th scope="col" className={th}>
                      {t("changes")}
                    </th>
                    <th scope="col" className={th}>
                      <span className="sr-only">
                        {t("signInAs", { name: "" })}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {team.map((member) => {
                    const name = member.user.name || member.user.email || "";
                    return (
                      <tr
                        key={member.id}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className={td}>
                          <div className="flex items-center gap-3">
                            <span
                              aria-hidden
                              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e7eef8] text-micro font-extrabold text-[#1d4e9e]"
                            >
                              {initials(name)}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold">
                                <bdi>{name}</bdi>
                              </p>
                              {member.user.name && member.user.email && (
                                <p
                                  className="text-micro text-muted-foreground"
                                  dir="ltr"
                                >
                                  {member.user.email}
                                </p>
                              )}
                              {member.pending && (
                                <p className="text-micro font-semibold text-[#7a5200]">
                                  {t("notSignedIn")}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={td}>
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-micro font-bold",
                              member.role === "OWNER"
                                ? "bg-[#e7eef8] text-[#1d4e9e]"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {tRoles(member.role)}
                          </span>
                        </td>
                        <td
                          className={cn(
                            td,
                            "whitespace-nowrap text-muted-foreground",
                          )}
                        >
                          {fmt.date(member.joinedAt)}
                        </td>
                        <td className={cn(td, "tabular-nums")}>
                          {fmt.number(member.carsAdded)}
                        </td>
                        <td className={cn(td, "tabular-nums")}>
                          {fmt.number(member.recentChanges)}
                        </td>
                        <td className={cn(td, "pe-4 text-end sm:pe-5")}>
                          <Button
                            variant="outline-strong"
                            size="sm"
                            className="h-9 bg-field"
                            onClick={() => setSigningInAs(member.user.id)}
                          >
                            {t("signInAs", {
                              name: (member.user.name || name).split(" ")[0],
                            })}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <TeamSidebar
        team={team}
        pending={pending}
        seats={seats}
        planName={planName}
        pendingOwnerEmail={org.pendingOwnerEmail}
      />

      {signingInAs && (
        <ImpersonateModal
          organization={org}
          userId={signingInAs}
          onClose={() => setSigningInAs(null)}
        />
      )}
    </div>
  );
}
