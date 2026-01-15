"use client";

import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

export default function TeamHeader({ memberCount, memberLimit }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Team Members</h1>
          <p className="text-muted-foreground text-sm">
            Manage your organization's team members and their roles
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <Badge variant="outline" className="font-normal">
          {memberCount} member{memberCount !== 1 ? "s" : ""}
          {memberLimit !== -1 && ` / ${memberLimit} allowed`}
        </Badge>
        {memberLimit !== -1 && memberCount >= memberLimit && (
          <Badge variant="destructive" className="font-normal">
            Limit reached
          </Badge>
        )}
      </div>
    </div>
  );
}
