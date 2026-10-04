"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "@/i18n/navigation";
import type { Plan } from "@/lib/generated/prisma";

export default function OrganizationsHeader({ plans }: { plans: Plan[] }) {
  const t = useTranslations("superAdmin.organizations");
  const tCommon = useTranslations("superAdmin.common");
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
    params.set("page", "1");
    router.push(`/super-admin/organizations?${params.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/super-admin/organizations?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Title and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/super-admin/organizations/create">
            <Plus className="h-4 w-4 me-2" />
            {t("create")}
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            {tCommon("search")}
          </Button>
        </form>

        {/* Status Filter */}
        <Select
          value={searchParams.get("status") || "all"}
          onValueChange={(value) => handleFilterChange("status", value)}
        >
          <SelectTrigger className="w-[150px]">
            <Filter className="h-4 w-4 me-2" />
            <SelectValue placeholder={t("filters.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
            <SelectItem value="active">{tCommon("active")}</SelectItem>
            <SelectItem value="inactive">{tCommon("inactive")}</SelectItem>
          </SelectContent>
        </Select>

        {/* Plan Filter */}
        <Select
          value={searchParams.get("plan") || "all"}
          onValueChange={(value) => handleFilterChange("plan", value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t("filters.plan")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allPlans")}</SelectItem>
            {plans.map((plan) => (
              <SelectItem key={plan.id} value={plan.type}>
                {plan.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
