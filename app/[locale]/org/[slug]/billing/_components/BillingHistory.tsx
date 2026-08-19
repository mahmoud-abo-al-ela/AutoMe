"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Receipt, ArrowUpCircle, ArrowDownCircle, XCircle, RefreshCw, PlusCircle, Loader2 } from "lucide-react";
import { getBillingHistory } from "@/actions/billing";
import { EmptyState } from "@/components/common/EmptyState";
import type { LucideIcon } from "lucide-react";

// Keyed by AuditAction, but only the subscription actions are listed; the
// lookups below fall back for anything else the history can contain.
const actionIcons: Record<string, LucideIcon> = {
  SUBSCRIPTION_CREATED: PlusCircle,
  SUBSCRIPTION_UPGRADED: ArrowUpCircle,
  SUBSCRIPTION_DOWNGRADED: ArrowDownCircle,
  SUBSCRIPTION_CANCELED: XCircle,
  SUBSCRIPTION_RENEWED: RefreshCw,
};

const actionColors: Record<string, string> = {
  SUBSCRIPTION_CREATED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  SUBSCRIPTION_UPGRADED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  SUBSCRIPTION_DOWNGRADED: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  SUBSCRIPTION_CANCELED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  SUBSCRIPTION_RENEWED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

/** One audit-log-derived row of the billing history, as the action returns it. */
type BillingHistoryEntry = Extract<
  Awaited<ReturnType<typeof getBillingHistory>>,
  { success: true }
>["data"]["history"][number];

export default function BillingHistory({
  organizationId,
}: {
  organizationId: string;
}) {
  const [billingHistory, setBillingHistory] = useState<BillingHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBillingHistory() {
      try {
        const result = await getBillingHistory(organizationId);
        if (!result.success) {
          throw new Error(result.error?.message || "Failed to load billing history");
        }
        setBillingHistory(result.data.history || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load billing history"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchBillingHistory();
  }, [organizationId]);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      SUBSCRIPTION_CREATED: "Created",
      SUBSCRIPTION_UPGRADED: "Upgraded",
      SUBSCRIPTION_DOWNGRADED: "Downgraded",
      SUBSCRIPTION_CANCELED: "Canceled",
      SUBSCRIPTION_RENEWED: "Renewed",
    };
    return labels[action] || action;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription>View your subscription changes and billing events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Billing History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Failed to load billing history
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Billing History
        </CardTitle>
        <CardDescription>View your subscription changes and billing events</CardDescription>
      </CardHeader>
      <CardContent>
        {billingHistory.length === 0 ? (
          <EmptyState variant="inline" icon={Receipt} title="No billing history yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billingHistory.map((event) => {
                const Icon = actionIcons[event.action] || Receipt;
                return (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      {formatDate(event.date)}
                    </TableCell>
                    <TableCell>
                      <Badge className={actionColors[event.action] || "bg-gray-100 text-gray-800"}>
                        <Icon className="h-3 w-3 me-1" />
                        {formatActionLabel(event.action)}
                      </Badge>
                    </TableCell>
                    <TableCell>{event.description}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {event.actor}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
          <p>
            Need help with billing?{" "}
            <a
              href="mailto:billing@autome.com"
              className="text-primary hover:underline"
            >
              Contact our billing team
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
