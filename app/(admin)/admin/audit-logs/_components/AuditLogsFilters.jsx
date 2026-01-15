"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

const actionOptions = [
  { value: "", label: "All Actions" },
  { value: "CAR_CREATED", label: "Car Created" },
  { value: "CAR_UPDATED", label: "Car Updated" },
  { value: "CAR_DELETED", label: "Car Deleted" },
  { value: "CAR_STATUS_CHANGED", label: "Car Status Changed" },
  { value: "TEST_DRIVE_CREATED", label: "Test Drive Created" },
  { value: "TEST_DRIVE_CONFIRMED", label: "Test Drive Confirmed" },
  { value: "TEST_DRIVE_CANCELED", label: "Test Drive Canceled" },
  { value: "MEMBER_INVITED", label: "Member Invited" },
  { value: "MEMBER_ROLE_CHANGED", label: "Member Role Changed" },
  { value: "MEMBER_REMOVED", label: "Member Removed" },
  { value: "SETTINGS_UPDATED", label: "Settings Updated" },
];

const entityTypeOptions = [
  { value: "", label: "All Types" },
  { value: "CAR", label: "Car" },
  { value: "TEST_DRIVE", label: "Test Drive" },
  { value: "MEMBERSHIP", label: "Membership" },
  { value: "ORGANIZATION", label: "Organization" },
  { value: "CONVERSATION", label: "Conversation" },
];

export default function AuditLogsFilters({ currentFilters }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // Reset to page 1 on filter change
    router.push(`/admin/audit-logs?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/admin/audit-logs");
  };

  const hasFilters = currentFilters.action || currentFilters.entityType || currentFilters.userId;

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <Select 
              value={currentFilters.action || ""} 
              onValueChange={(value) => updateFilter("action", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                {actionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value || "all"}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <Select 
              value={currentFilters.entityType || ""} 
              onValueChange={(value) => updateFilter("entityType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by entity type" />
              </SelectTrigger>
              <SelectContent>
                {entityTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value || "all"}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
