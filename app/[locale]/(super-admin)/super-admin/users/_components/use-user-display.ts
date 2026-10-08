"use client";

import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import type { UserRow } from "@/lib/services/super-admin/users";

export type UserKind = "admin" | "owner" | "member" | "buyer";

export const KIND_TONES: Record<UserKind, string> = {
  admin: "bg-inverse text-inverse-foreground",
  owner: "bg-[#e7eef8] text-[#1d4e9e]",
  member: "bg-[#eef3fa] text-[#1d4e9e]",
  buyer: "bg-muted text-muted-foreground",
};

/**
 * How a person reads in the users list and its CSV: a name (or their email
 * when they gave none), what kind of account they have, and their dealership.
 */
export function useUserDisplay() {
  const t = useTranslations("superAdmin.users");
  const fmt = useFormatters();

  const name = (row: UserRow) => row.name || row.email || row.phone || t("noName");
  const contact = (row: UserRow) => (row.name ? row.email || row.phone : row.email ? row.phone : null);

  /** A platform admin first; otherwise their role at their first dealership; otherwise a buyer. */
  const kind = (row: UserRow): UserKind =>
    row.role === "ADMIN" ? "admin" : row.memberships[0]?.role === "OWNER" ? "owner" : row.memberships[0] ? "member" : "buyer";

  const dealership = (row: UserRow) => {
    const [first, ...rest] = row.memberships;
    if (!first) return null;
    return { organization: first.organization, more: rest.length ? t("moreDealerships", { value: fmt.number(rest.length) }) : null };
  };

  const initials = (row: UserRow) =>
    name(row)
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();

  /** The rows as a CSV: headers in the reader's language, plain digits, a BOM for Excel's Arabic. */
  const csv = (rows: UserRow[]) => {
    const cell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const header = [t("csv.name"), t("csv.email"), t("csv.phone"), t("columns.account"), t("columns.dealership"), t("columns.savedCars"), t("columns.testDrives"), t("columns.joined")];
    const lines = rows.map((row) =>
      [
        row.name ?? "",
        row.email ?? "",
        row.phone ?? "",
        t(`kinds.${kind(row)}`),
        row.memberships.map((m) => m.organization.name).join("; "),
        // A buyer's numbers; empty for staff and admins.
        kind(row) === "buyer" ? row.savedCars : "",
        kind(row) === "buyer" ? row.testDrives : "",
        row.createdAt.slice(0, 10),
      ]
        .map(cell)
        .join(","),
    );
    return "\uFEFF" + [header.map(cell).join(","), ...lines].join("\r\n");
  };

  return { name, contact, kind, dealership, initials, csv, day: (iso: string) => fmt.date(iso, { year: undefined }) };
}
