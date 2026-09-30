"use client";

import { useState, useEffect, useCallback } from "react";
import { useFormatters } from "@/hooks/use-formatters";
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
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { intlLocale } from "@/lib/utils/intl-locale";
import type { Locale } from "@/i18n/routing";
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
function formatCurrency(amount: number, currency = "usd", locale: Locale = "en") {
    // The currency is Stripe's, which is why this is not routed through
    // lib/utils/currency — but the digits and separators are the reader's.
    return new Intl.NumberFormat(intlLocale(locale), {
        style: "currency",
        currency: currency.toUpperCase(),
        minimumFractionDigits: 2,
    }).format(amount / 100);
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
    const t = useTranslations("org.billing.invoices");

    return (
        <EmptyState 
            variant="inline" 
            icon={Receipt} 
            title={t("emptyTitle")}
            description={t("emptyBody")}
        />
    );
}

function InvoicesError({ onRetry }: { onRetry: () => void }) {
    const t = useTranslations("org.billing.invoices");

    return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
                {t("loadFailed")}
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
                {t("tryAgain")}
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
    const t = useTranslations("org.billing.invoices");
    const locale = useLocale() as Locale;
    const { date: formatDate } = useFormatters();

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
                throw new Error(result.error?.message || t("loadFailed"));
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
                (err instanceof Error && err.message) || t("loadFailed")
            );
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    // `t` is read only for the error fallback. Listing it would refetch on a
    // language switch, which is a network round trip for the same data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                    {t("historyTitle")}
                </CardTitle>
                <CardDescription>
                    {t("historySubtitle")}
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
                                        <TableHead>{t("date")}</TableHead>
                                        <TableHead>{t("description")}</TableHead>
                                        <TableHead>{t("amount")}</TableHead>
                                        <TableHead>{t("status")}</TableHead>
                                        <TableHead className="text-end">{t("actions")}</TableHead>
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
                                                        {t("invoiceNumber", { number: invoice.number })}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium whitespace-nowrap">
                                                {formatCurrency(
                                                    invoice.amount,
                                                    invoice.currency,
                                                    locale
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={
                                                        STATUS_STYLES[invoice.status] ||
                                                        STATUS_STYLES.UNKNOWN
                                                    }
                                                >
                                                    {t(`statuses.${invoice.status}`)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-end">
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
                                                                title={t("downloadPdf")}
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
                                                                title={t("viewInvoice")}
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
                                            <Loader2 className="h-4 w-4 me-2 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        t("loadMore")
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
