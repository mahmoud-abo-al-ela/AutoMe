"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Receipt, ExternalLink } from "lucide-react";

// Mock billing history - in production, this would come from Stripe
const mockInvoices = [
  {
    id: "inv_1",
    date: new Date("2024-12-01"),
    amount: 4900,
    status: "PAID",
    description: "Pro Plan - December 2024",
    invoiceUrl: "#",
  },
  {
    id: "inv_2",
    date: new Date("2024-11-01"),
    amount: 4900,
    status: "PAID",
    description: "Pro Plan - November 2024",
    invoiceUrl: "#",
  },
  {
    id: "inv_3",
    date: new Date("2024-10-01"),
    amount: 0,
    status: "PAID",
    description: "Starter Plan - October 2024 (Trial)",
    invoiceUrl: "#",
  },
];

const statusColors = {
  PAID: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function BillingHistory({ organizationId }) {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Billing History
        </CardTitle>
        <CardDescription>
          View and download your past invoices
        </CardDescription>
      </CardHeader>
      <CardContent>
        {mockInvoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No billing history yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {formatDate(invoice.date)}
                  </TableCell>
                  <TableCell>{invoice.description}</TableCell>
                  <TableCell>{formatAmount(invoice.amount)}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[invoice.status]}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <a
                      href={invoice.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      View
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
          <p>
            Need help with billing?{" "}
            <a href="mailto:billing@autome.com" className="text-primary hover:underline">
              Contact our billing team
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
