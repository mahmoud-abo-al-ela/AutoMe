"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    FileText,
    Download,
    ExternalLink,
    Receipt,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { getInvoices } from "@/actions/billing";
import { EmptyState } from "@/components/common/EmptyState";

const STATUS_STYLES = {
    PAID: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    OPEN: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
    VOID: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
    UNCOLLECTIBLE:
        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    UNKNOWN: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
};

// Currency comes from the Stripe invoice rather than being assumed, which is
// why this one is not routed through lib/utils/currency.
function formatCurrency(amount: number, currency = "usd") {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
        minimumFractionDigits: 2,
    }).format(amount / 100);
}

function formatDate(dateString: string | number | Date) {
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function InvoicesSkeleton() {
    return (
        <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-8 w-8" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyInvoices() {
    return (
        <EmptyState 
            variant="inline" 
            icon={Receipt} 
            title="No invoices yet" 
            description="Invoices will appear here after your first payment" 
        />
    );
}

function InvoicesError({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
                Failed to load invoices
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
                Try Again
            </Button>
        </div>
    );
}

/** One invoice as the billing action returns it. */
type Invoice = Extract<
    Awaited<ReturnType<typeof getInvoices>>,
    { success: true }
>["data"]["invoices"][number];

export default function InvoiceHistory({
    organizationId,
}: {
    organizationId: string;
}) {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);

    const fetchInvoices = useCallback(async (cursor: string | null = null) => {
        try {
            if (cursor) {
                setIsLoadingMore(true);
            } else {
                setIsLoading(true);
            }
            setError(null);

            const result = await getInvoices(organizationId, {
                limit: 10,
                startingAfter: cursor || undefined,
            });

            if (!result.success) {
                throw new Error(result.error?.message || "Failed to load invoices");
            }

            const { invoices: fetched, hasMore, nextCursor } = result.data;

            if (cursor) {
                setInvoices((prev) => [...prev, ...fetched]);
            } else {
                setInvoices(fetched);
            }
            setHasMore(hasMore);
            setNextCursor(nextCursor);
        } catch (err) {
            console.error("Failed to fetch invoices:", err);
            setError(
                (err instanceof Error && err.message) || "Failed to load invoices"
            );
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [organizationId]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const handleLoadMore = () => {
        if (nextCursor) {
            fetchInvoices(nextCursor);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Invoice History
                </CardTitle>
                <CardDescription>
                    View and download your past invoices from Stripe
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <InvoicesSkeleton />
                ) : error ? (
                    <InvoicesError onRetry={() => fetchInvoices()} />
                ) : invoices.length === 0 ? (
                    <EmptyInvoices />
                ) : (
                    <>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.map((invoice) => (
                                        <TableRow key={invoice.id}>
                                            <TableCell className="whitespace-nowrap">
                                                {formatDate(invoice.date)}
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate">
                                                {invoice.description}
                                                {invoice.number && (
                                                    <span className="block text-xs text-muted-foreground">
                                                        #{invoice.number}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium whitespace-nowrap">
                                                {formatCurrency(invoice.amount, invoice.currency)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={
                                                        STATUS_STYLES[invoice.status] ||
                                                        STATUS_STYLES.UNKNOWN
                                                    }
                                                >
                                                    {invoice.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {invoice.pdfUrl && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            asChild
                                                        >
                                                            <a
                                                                href={invoice.pdfUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                title="Download PDF"
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </a>
                                                        </Button>
                                                    )}
                                                    {invoice.hostedUrl && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            asChild
                                                        >
                                                            <a
                                                                href={invoice.hostedUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                title="View invoice"
                                                            >
                                                                <ExternalLink className="h-4 w-4" />
                                                            </a>
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {hasMore && (
                            <div className="flex justify-center mt-4">
                                <Button
                                    variant="outline"
                                    onClick={handleLoadMore}
                                    disabled={isLoadingMore}
                                >
                                    {isLoadingMore ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        "Load More"
                                    )}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
