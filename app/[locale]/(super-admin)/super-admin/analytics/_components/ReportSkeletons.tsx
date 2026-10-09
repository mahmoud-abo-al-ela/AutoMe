"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { parseAnalyticsQuery, type AnalyticsReport } from "@/lib/services/super-admin/analytics-options";

/**
 * Each Analytics report on its way, in its own shape — shown while switching
 * report or period, and on a reload by the page's loading state. Shimmer,
 * like every admin skeleton.
 */

const sk = "skeleton-shimmer";
const card = "overflow-hidden rounded-[20px] border border-border bg-card";

function PanelHead({ width = "w-40" }: { width?: string }) {
  return (
    <div className="border-b border-border px-5 py-4">
      <span className={`${sk} block h-5 ${width} rounded`} />
    </div>
  );
}

function BarsPanel({ rows = 5 }: { rows?: number }) {
  return (
    <div className={card}>
      <PanelHead />
      <div className="flex flex-col gap-3 px-5 py-4">
        {Array.from({ length: rows }, (_, i) => (
          <span key={i} className="grid grid-cols-[6rem_1fr_2.5rem] items-center gap-3">
            <span className={`${sk} h-3.5 rounded`} />
            <span className={`${sk} h-2.5 rounded`} style={{ width: `${90 - i * 14}%` }} />
            <span className={`${sk} h-3.5 rounded`} />
          </span>
        ))}
      </div>
    </div>
  );
}

function Stats() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-2 rounded-[20px] border border-border bg-card px-5 py-4">
          <span className={`${sk} h-3.5 w-28 rounded`} />
          <span className={`${sk} h-8 w-16 rounded`} />
          <span className={`${sk} h-3 w-32 max-w-full rounded`} />
        </div>
      ))}
    </div>
  );
}

function TablePanel({ rows = 6 }: { rows?: number }) {
  return (
    <div className={card}>
      <PanelHead />
      <div className="h-10 border-b border-border bg-muted/60" />
      <ul className="divide-y divide-border">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="flex items-center gap-6 px-5 py-3">
            <span className={`${sk} h-4 w-36 rounded`} />
            <span className={`${sk} h-4 flex-1 rounded`} />
            <span className={`${sk} h-4 w-12 rounded`} />
            <span className={`${sk} h-4 w-12 rounded`} />
            <span className={`${sk} h-4 w-12 rounded`} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Marketplace() {
  return (
    <>
      <div className={card}>
        <PanelHead width="w-48" />
        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 xl:grid-cols-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col gap-2 bg-card px-5 py-4">
              <span className={`${sk} h-4 w-24 rounded`} />
              <span className={`${sk} h-8 w-16 rounded`} />
              <span className={`${sk} h-3 w-28 rounded`} />
              <span className={`${sk} mt-1 h-2.5 rounded`} style={{ width: `${100 - i * 15}%` }} />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <BarsPanel />
        <BarsPanel rows={6} />
        <div className={card}>
          <PanelHead width="w-32" />
          <div className="flex flex-col divide-y divide-border">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col gap-2 px-5 py-4">
                <span className={`${sk} h-3.5 w-48 max-w-full rounded`} />
                <span className={`${sk} h-6 w-20 rounded`} />
                <span className={`${sk} h-3 w-28 rounded`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Dealerships() {
  return (
    <>
      <Stats />
      <div className="grid gap-5 lg:grid-cols-2">
        <BarsPanel rows={3} />
        <BarsPanel rows={8} />
      </div>
      <TablePanel rows={8} />
    </>
  );
}

function Buyers() {
  return (
    <>
      <Stats />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className={card}>
          <PanelHead />
          <ul className="divide-y divide-border">
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i} className="flex items-center gap-3 px-5 py-3">
                <span className={`${sk} h-4 w-4 shrink-0 rounded`} />
                <span className="flex flex-1 flex-col gap-1.5">
                  <span className={`${sk} h-4 w-48 max-w-full rounded`} />
                  <span className={`${sk} h-3 w-40 max-w-full rounded`} />
                </span>
                <span className={`${sk} h-5 w-6 shrink-0 rounded`} />
              </li>
            ))}
          </ul>
        </div>
        <BarsPanel />
      </div>
    </>
  );
}

function Ai() {
  return (
    <>
      <Stats />
      <TablePanel rows={8} />
      <div className="grid gap-5 lg:grid-cols-2">
        <TablePanel rows={5} />
        <BarsPanel rows={4} />
      </div>
      {/* The listing assistant's quality section. */}
      <Stats />
      <div className="grid gap-5 xl:grid-cols-2">
        <TablePanel rows={4} />
        <TablePanel rows={4} />
      </div>
    </>
  );
}

const SKELETONS: Record<AnalyticsReport, () => React.JSX.Element> = {
  marketplace: Marketplace,
  dealerships: Dealerships,
  buyers: Buyers,
  ai: Ai,
};

export function ReportSkeleton({ report }: { report: AnalyticsReport }) {
  const Skeleton = SKELETONS[report];
  return (
    <div aria-busy className="flex flex-col gap-5">
      <Skeleton />
    </div>
  );
}

function FromUrl() {
  const params = useSearchParams();
  return <ReportSkeleton report={parseAnalyticsQuery(Object.fromEntries(params)).report} />;
}

/** The skeleton for the report in the URL — for the page's loading state. */
export function ReportSkeletonFromUrl() {
  return (
    <Suspense fallback={<ReportSkeleton report="marketplace" />}>
      <FromUrl />
    </Suspense>
  );
}
