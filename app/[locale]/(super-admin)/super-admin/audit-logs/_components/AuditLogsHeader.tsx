"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuditLabels } from "@/hooks/use-audit-labels";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { FileText, Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AuditLogsHeader({
  actions,
  entities,
}: {
  actions: string[];
  entities: string[];
}) {
  const t = useTranslations("superAdmin.auditLogs");
  const labels = useAuditLabels();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set("search", search);
    } else {
      params.delete("search");
    }
    params.delete("page");
    router.push(`/super-admin/audit-logs?${params.toString()}`);
  };

  const handleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/super-admin/audit-logs?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 me-2" />
          {t("export")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-10"
            />
          </div>
        </form>
        <Select
          defaultValue={searchParams.get("action") || "all"}
          onValueChange={(value) => handleFilter("action", value)}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={t("filters.action")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allActions")}</SelectItem>
            {actions.map((action) => (
              <SelectItem key={action} value={action}>
                {labels.action(action)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          defaultValue={searchParams.get("entity") || "all"}
          onValueChange={(value) => handleFilter("entity", value)}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={t("filters.entity")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allEntities")}</SelectItem>
            {entities.map((entity) => (
              <SelectItem key={entity} value={entity}>
                {labels.entity(entity)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
