"use client";

import { useState, type TransitionStartFunction } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SESSION_PERIODS, sessionQueryString, type SessionQuery } from "@/lib/services/super-admin/sessions-options";

const BASE = "/super-admin/impersonation";
const ANY = "any";
const trigger = "h-11 data-[size=default]:h-11 rounded-control border-[#8c8170] bg-field";

/**
 * Search, the admin who started the session, and the period, for the support
 * sessions list. Each change goes to the URL and back to page one.
 */
export function SessionsToolbar({
  query,
  admins,
  currentAdminId,
  startTransition,
}: {
  query: SessionQuery;
  admins: { id: string; name: string | null; email: string | null }[];
  currentAdminId: string;
  startTransition: TransitionStartFunction;
}) {
  const t = useTranslations("superAdmin.impersonation");
  const router = useRouter();
  const [search, setSearch] = useState(query.search);
  const go = (change: Partial<SessionQuery>) =>
    startTransition(() => router.replace(`${BASE}${sessionQueryString({ ...query, ...change, page: 1 })}`, { scroll: false }));
  const filtered = Boolean(query.search || query.admin || query.days !== "all");

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          go({ search: search.trim() });
        }}
        className="flex h-11 min-w-0 flex-[1_1_100%] items-center gap-2 rounded-control border border-[#8c8170] bg-field px-3 focus-within:ring-2 focus-within:ring-ring sm:max-w-[420px] sm:flex-[1_1_280px]"
      >
        <Search aria-hidden className="size-[18px] shrink-0 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label={t("searchLabel")}
          placeholder={t("searchPlaceholder")}
          className="min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
        />
        {search && (
          <button
            type="button"
            aria-label={t("filters.clear")}
            onClick={() => {
              setSearch("");
              if (query.search) go({ search: "" });
            }}
            className="-me-1 flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X aria-hidden className="size-4" />
          </button>
        )}
      </form>

      <Select value={query.admin ?? ANY} onValueChange={(value) => go({ admin: value === ANY ? null : value })}>
        <SelectTrigger aria-label={t("filters.admin")} className={cn(trigger, "w-[calc(50%-0.3125rem)] sm:w-[200px]")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-80 rounded-control">
          <SelectItem value={ANY}>{t("filters.anyAdmin")}</SelectItem>
          {admins.map((admin) => (
            <SelectItem key={admin.id} value={admin.id}>
              {admin.id === currentAdminId ? t("you") : admin.name || admin.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={query.days} onValueChange={(value) => go({ days: value as SessionQuery["days"] })}>
        <SelectTrigger aria-label={t("filters.period")} className={cn(trigger, "w-[calc(50%-0.3125rem)] sm:w-[170px]")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-control">
          {SESSION_PERIODS.map((period) => (
            <SelectItem key={period} value={period}>
              {t(`periods.${period}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {filtered && (
        <button
          type="button"
          onClick={() => {
            setSearch("");
            go({ search: "", admin: null, days: "all" });
          }}
          className="h-11 rounded-control px-3 text-caption font-semibold text-[#1d4e9e] underline-offset-2 hover:underline"
        >
          {t("filters.clear")}
        </button>
      )}
    </div>
  );
}
