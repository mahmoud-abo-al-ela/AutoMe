"use client";

export default function PlansHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Plans & Pricing</h1>
        <p className="text-muted-foreground">
          Manage subscription plans and pricing tiers
        </p>
      </div>
    </div>
  );
}
