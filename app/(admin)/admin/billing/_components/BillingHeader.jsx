"use client";

import { CreditCard } from "lucide-react";

export default function BillingHeader() {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-primary/10 rounded-lg">
        <CreditCard className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground text-sm">
          Manage your subscription plan and billing information
        </p>
      </div>
    </div>
  );
}
