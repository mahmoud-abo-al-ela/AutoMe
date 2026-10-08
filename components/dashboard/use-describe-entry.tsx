"use client";

import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { planKeyFor } from "@/components/Pricing/pricing-plans";
import { useAuditLabels } from "@/hooks/use-audit-labels";
import { useFormatters } from "@/hooks/use-formatters";
import { findCity, findGovernorate } from "@/lib/locations/data";
import type { ActivityEntry, ActivityLookups } from "@/lib/services/audit/activity";

export type Change = { key: string; label: string; before: string; after: string };
export type Described = { sentence: ReactNode; changes: Change[] };

const WEEK = ["SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const TERM_FLAGS = ["offersFinancing", "acceptsTradeIn", "allowsInspection", "offersDelivery"];

const read = (value: unknown, key: string): unknown =>
  value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined;

/**
 * Turns an audit entry into a sentence — "Sara Hassan marked BMW X4 2023 as
 * sold" — and the values it changed, each formatted as the dashboard shows it
 * elsewhere: prices as prices, days by name, terms as Yes / No / Not stated.
 * Anything it does not recognise still reads, as "{who}: {action}".
 *
 * Shared by the dealer's Activity and the super-admin dealership page;
 * `carHref` says where a car's name links, or leaves it plain text.
 */
export function useDescribeEntry(
  lookups: ActivityLookups,
  dealershipName: string,
  { carHref }: { carHref?: (carId: string) => string } = {},
) {
  const t = useTranslations("org.auditLogs");
  const tStatus = useTranslations("org.cars.ledger.status");
  const tRoles = useTranslations("org.settings.team.roles");
  const tPlans = useTranslations("plans");
  const tDays = useTranslations("dealerships.days");
  const label = useAuditLabels();
  const fmt = useFormatters();
  const locale = useLocale();

  const place = (entry: { en: string; ar: string } | undefined) => (entry ? (locale === "ar" ? entry.ar : entry.en) : null);
  const carName = (car: { make: string | null; model: string | null; year: number | null } | null | undefined) =>
    car ? [car.make, car.model, car.year ? fmt.number(car.year, { useGrouping: false }) : null].filter(Boolean).join(" ") : null;
  const planName = (id: unknown) => {
    const plan = typeof id === "string" ? lookups.plans[id] : undefined;
    if (!plan) return null;
    const key = planKeyFor(plan.type);
    return key ? tPlans(`plans.${key}.name`) : plan.name;
  };
  const hours = (value: unknown) => {
    if (value === "closed" || typeof value !== "string") return t("values.closed");
    const [open, close] = value.split("-");
    return `${fmt.clockTime(open)} – ${fmt.clockTime(close)}`;
  };
  const yesNo = (value: unknown) => (value === true ? t("values.yes") : value === false ? t("values.no") : t("values.notStated"));
  const text = (value: unknown) => (value === null || value === undefined || value === "" ? t("values.empty") : String(value));

  /** One field's value, formatted for what it is. */
  const show = (key: string, value: unknown): string => {
    switch (key) {
      case "price":
        return typeof value === "number" ? fmt.price(value) : text(value);
      case "mileage":
        return typeof value === "number" ? fmt.mileage(value) : text(value);
      case "year":
        return typeof value === "number" ? fmt.number(value, { useGrouping: false }) : text(value);
      case "status":
        return typeof value === "string" && tStatus.has(value) ? tStatus(value) : text(value);
      case "featured":
        return yesNo(value);
      case "role":
        return typeof value === "string" && tRoles.has(value) ? tRoles(value) : text(value);
      case "region":
        return place(findGovernorate(value as string)) ?? text(value);
      case "city":
        return place(findCity(value as string)) ?? text(value);
      default:
        if (TERM_FLAGS.includes(key)) return yesNo(value);
        if (WEEK.includes(key)) return hours(value);
        return text(value);
    }
  };

  const changesOf = (entry: ActivityEntry, keys?: string[]): Change[] => {
    const after = (entry.newValue ?? {}) as Record<string, unknown>;
    const before = (entry.oldValue ?? {}) as Record<string, unknown>;
    const all = keys ?? Object.keys(after);
    // Days in week order; everything else in the order it was stored.
    const ordered = all.some((key) => WEEK.includes(key)) ? WEEK.filter((day) => all.includes(day)) : all;
    return ordered.map((key) => ({
      key,
      label: WEEK.includes(key) ? tDays(key) : t.has(`fields.${key}`) ? t(`fields.${key}`) : key,
      // A long text is not quoted twice: it was rewritten.
      before: key === "description" ? "" : show(key, before[key]),
      after: key === "description" ? t("values.rewritten") : show(key, after[key]),
    }));
  };

  return (entry: ActivityEntry): Described => {
    const support = entry.action.startsWith("IMPERSONATION_");
    const who = support ? t("support") : entry.who || t("system");
    const carId = entry.entityType === "CAR" ? entry.entityId : (read(entry.newValue, "carId") as string | undefined);
    const known = carId ? lookups.cars[carId] : undefined;
    const car = carName(entry.car) ?? carName(known) ?? t("aCar");
    const memberId = read(entry.newValue, "userId") ?? read(entry.oldValue, "userId");
    const member =
      (typeof memberId === "string" && lookups.users[memberId]) || (entry.entityId ? lookups.memberships[entry.entityId] : null) || t("aMember");

    const chunks = {
      b: (c: ReactNode) => <b className="font-semibold text-foreground">{c}</b>,
      // A deleted car has no page to open, so its name is plain text.
      link: (c: ReactNode) =>
        known && carId && carHref ? (
          <Link href={carHref(carId)} className="font-semibold text-[#1d4e9e] underline-offset-2 hover:underline">
            {c}
          </Link>
        ) : (
          <b className="font-semibold text-foreground">{c}</b>
        ),
    };
    // A person's feed spans dealerships, so each entry may name its own.
    const here = (entry as { dealership?: { name: string } | null }).dealership?.name;
    const say = (key: string, values: Record<string, string | number> = {}) =>
      t.rich(`sentences.${key}`, { who, car, member, dealership: here || dealershipName || t("theDealership"), ...values, ...chunks });

    const slot = (() => {
      const date = read(entry.newValue, "date");
      if (typeof date !== "string") return null;
      const day = fmt.date(`${date}T00:00:00Z`, { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
      const time = read(entry.newValue, "startTime");
      return typeof time === "string" ? `${day}, ${fmt.clockTime(time)}` : day;
    })();

    switch (entry.action) {
      case "CAR_CREATED": {
        const price = read(entry.newValue, "price");
        return {
          sentence: typeof price === "number" ? say("CAR_CREATED_PRICED", { price: fmt.price(price) }) : say("CAR_CREATED"),
          changes: [],
        };
      }
      case "CAR_UPDATED":
      case "CAR_STATUS_CHANGED":
        return { sentence: say(entry.action), changes: changesOf(entry) };
      case "CAR_FEATURED_TOGGLED":
        return { sentence: say(read(entry.newValue, "featured") ? "CAR_FEATURED_ON" : "CAR_FEATURED_OFF"), changes: [] };
      case "CAR_DELETED":
      case "TEST_DRIVE_CREATED":
      case "TEST_DRIVE_COMPLETED":
      case "MEMBER_ACCEPTED":
      case "MEMBER_REMOVED":
      case "ORG_CREATED":
      case "ORG_SUSPENDED":
      case "ORG_ACTIVATED":
      case "IMPERSONATION_STARTED":
        return { sentence: say(entry.action), changes: [] };
      case "TEST_DRIVE_CONFIRMED":
      case "TEST_DRIVE_CANCELED":
        return { sentence: slot ? say(`${entry.action}_AT`, { slot }) : say(entry.action), changes: [] };
      case "MEMBER_INVITED":
        return { sentence: say("MEMBER_INVITED", { role: show("role", read(entry.newValue, "role")) }), changes: [] };
      case "MEMBER_ROLE_CHANGED":
        return { sentence: say("MEMBER_ROLE_CHANGED"), changes: changesOf(entry, ["role"]) };
      case "SUBSCRIPTION_CREATED":
      case "SUBSCRIPTION_UPGRADED":
      case "SUBSCRIPTION_DOWNGRADED":
      case "SUBSCRIPTION_CANCELED":
      case "SUBSCRIPTION_RENEWED": {
        const plan = planName(read(entry.newValue, "planId")) ?? planName(read(entry.oldValue, "planId")) ?? "";
        const from = planName(read(entry.oldValue, "planId"));
        const moved = (entry.action === "SUBSCRIPTION_UPGRADED" || entry.action === "SUBSCRIPTION_DOWNGRADED") && from && from !== plan;
        return {
          sentence: say(entry.action, { plan }),
          changes: moved ? [{ key: "plan", label: t("kinds.plan"), before: from, after: plan }] : [],
        };
      }
      case "ORG_UPDATED":
      case "ORG_SETTINGS_UPDATED":
      case "WORKING_HOURS_UPDATED":
        return { sentence: say(entry.action), changes: changesOf(entry) };
      case "IMPERSONATION_ENDED": {
        const minutes = Math.max(1, Math.round(Number(read(entry.newValue, "duration") ?? 0) / 60000));
        return { sentence: say("IMPERSONATION_ENDED", { minutes, value: fmt.number(minutes) }), changes: [] };
      }
      default:
        return { sentence: say("other", { action: label.action(entry.action) }), changes: [] };
    }
  };
}
