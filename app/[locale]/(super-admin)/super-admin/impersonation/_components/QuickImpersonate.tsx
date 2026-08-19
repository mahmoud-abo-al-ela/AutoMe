"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ExternalLink, Building2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { startImpersonation } from "@/actions/super-admin";
import { EmptyState } from "@/components/common/EmptyState";
import type { User } from "@/lib/generated/prisma";

/**
 * An impersonatable organization: the columns page.tsx selects, plus the
 * OWNER membership's user flattened onto `owner` (null when there is none).
 */
export type ImpersonatableOrganization = {
  id: string;
  name: string;
  slug: string;
  owner: Pick<User, "id" | "name" | "email" | "imageUrl"> | null;
};

export default function QuickImpersonate({
  organizations,
}: {
  organizations: ImpersonatableOrganization[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const filteredOrgs = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleImpersonate = async (org: ImpersonatableOrganization) => {
    if (!org.owner) {
      toast.error("Cannot impersonate", {
        description: "This organization has no owner to impersonate.",
      });
      return;
    }

    setLoading(org.id);
    try {
      const result = await startImpersonation(org.id, org.owner.id);
      if (result.success) {
        toast.success(`Impersonation started`, {
          description: `Now viewing as ${org.owner.name} in ${org.name}.`,
        });
        // Redirect to the org's dashboard page
        window.location.href = `/org/${org.slug}/dashboard`;
      } else {
        toast.error("Failed to start impersonation", {
          description: result.error.message,
        });
      }
    } catch (error) {
      toast.error("An error occurred", {
        description: "Please try again later.",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>Quick Impersonate</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredOrgs.slice(0, 10).map((org) => (
            <div
              key={org.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium text-sm">{org.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {org.owner ? org.owner.email : "No owner"}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={!org.owner || loading === org.id}
                onClick={() => handleImpersonate(org)}
              >
                {loading === org.id ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </>
                )}
              </Button>
            </div>
          ))}

          {filteredOrgs.length === 0 && (
            <EmptyState variant="filtered" title="No organizations found" />
          )}

          {filteredOrgs.length > 10 && (
            <p className="text-center text-xs text-muted-foreground">
              Showing 10 of {filteredOrgs.length} results
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
