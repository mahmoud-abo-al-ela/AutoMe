"use client";

import { useTranslations } from "next-intl";
import { planKeyFor } from "@/components/Pricing/pricing-plans";
import type { Change } from "@/components/dashboard/use-describe-entry";
import { useAuditLabels } from "@/hooks/use-audit-labels";
import { useFormatters } from "@/hooks/use-formatters";
import { describeUserAgent } from "@/lib/utils/user-agent";
import type { ActivityLookups } from "@/lib/services/audit/activity";
import type { PlatformActivityEntry } from "@/lib/services/super-admin/platform-activity";

const read = (value: unknown, key: string): unknown =>
  value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined;
const str = (value: unknown) => (typeof value === "string" && value ? value : null);

/**
 * How the Activity table names things: the person who made a change, who
 * they were signed in as during a support session, what the change was to —
 * a car, a person, a plan, the dealership — and the device it came from.
 * Also the CSV, in the admin's language.
 */
export function useActivityDisplay() {
  const t = useTranslations("superAdmin.auditLogs");
  const tPlans = useTranslations("plans");
  const label = useAuditLabels();
  const fmt = useFormatters();

  const carName = (car: { make: string | null; model: string | null; year: number | null } | null | undefined) =>
    car ? [car.make, car.model, car.year ? fmt.number(car.year, { useGrouping: false }) : null].filter(Boolean).join(" ") : null;
  const planName = (lookups: ActivityLookups, id: unknown) => {
    const plan = typeof id === "string" ? lookups.plans[id] : undefined;
    if (!plan) return null;
    const key = planKeyFor(plan.type);
    return key ? tPlans(`plans.${key}.name`) : plan.name;
  };
  const person = (lookups: ActivityLookups, id: unknown) => {
    const userId = str(id);
    const name = userId ? lookups.users[userId] : null;
    return name && userId ? { label: name, href: `/super-admin/users/${userId}` } : null;
  };

  /** What the change was to, and where its page is when it has one. */
  const target = (entry: PlatformActivityEntry, lookups: ActivityLookups): { label: string; href: string | null } | null => {
    switch (entry.entityType) {
      case "CAR":
      case "TEST_DRIVE": {
        const carId = entry.entityType === "CAR" ? entry.entityId : str(read(entry.newValue, "carId"));
        const name = carName(entry.car) ?? carName(carId ? lookups.cars[carId] : null);
        return name ? { label: name, href: null } : null;
      }
      case "MEMBERSHIP": {
        const member = person(lookups, read(entry.newValue, "userId") ?? read(entry.oldValue, "userId"));
        if (member) return member;
        const name = entry.entityId ? lookups.memberships[entry.entityId] : null;
        return name ? { label: name, href: null } : null;
      }
      case "USER":
        return person(lookups, entry.entityId);
      case "IMPERSONATION_SESSION":
        return person(lookups, read(entry.newValue, "targetUserId"));
      case "SUBSCRIPTION": {
        const plan = planName(lookups, read(entry.newValue, "planId")) ?? planName(lookups, read(entry.oldValue, "planId"));
        return plan ? { label: plan, href: null } : null;
      }
      // The dealership itself already has its own column — unless it was deleted.
      case "ORGANIZATION":
        return entry.deletedDealership ? { label: entry.deletedDealership, href: null } : null;
      case "WORKING_HOURS":
        return { label: label.entity(entry.entityType), href: null };
      default:
        return null;
    }
  };

  const who = (entry: PlatformActivityEntry) => entry.who || t("system");
  const signedInAs = (entry: PlatformActivityEntry, lookups: ActivityLookups) =>
    entry.signedInAs ? (lookups.users[entry.signedInAs] ?? null) : null;
  const device = (entry: PlatformActivityEntry) => {
    const found = describeUserAgent(entry.userAgent);
    if (!found) return null;
    if (found.browser && found.system) return t("device", { browser: found.browser, system: found.system });
    return found.browser ?? found.system;
  };

  const csv = (entries: PlatformActivityEntry[], lookups: ActivityLookups, changesOf: (entry: PlatformActivityEntry) => Change[]) => {
    const cell = (value: string | number | null | undefined) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const header = ["when", "who", "signedInAs", "what", "target", "dealership", "source", "changes", "ip", "device"].map((key) => t(`csv.${key}`));
    const lines = entries.map((entry) =>
      [
        fmt.dateTime(entry.createdAt, { second: "2-digit" }),
        who(entry),
        signedInAs(entry, lookups),
        label.action(entry.action),
        target(entry, lookups)?.label,
        entry.dealership?.name,
        t(`sources.${entry.source}`),
        changesOf(entry)
          .map((change) => (change.before ? `${change.label}: ${change.before} → ${change.after}` : `${change.label}: ${change.after}`))
          .join("; "),
        entry.ip,
        device(entry),
      ]
        .map(cell)
        .join(","),
    );
    return "﻿" + [header.map(cell).join(","), ...lines].join("\r\n");
  };

  return { target, who, signedInAs, device, csv, reason: (entry: PlatformActivityEntry) => str(read(entry.newValue, "reason")) };
}
