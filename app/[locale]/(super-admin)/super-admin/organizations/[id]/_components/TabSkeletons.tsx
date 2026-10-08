"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { parseDealershipTab, type DealershipTab } from "@/lib/services/super-admin/dealerships-options";

/**
 * Each dealership tab on its way, in its own shape — shown while a tab
 * switches, and on a reload by the page's loading state. Shimmer, like every
 * admin skeleton.
 */

const sk = "skeleton-shimmer";
const card = "overflow-hidden rounded-[20px] border border-border bg-card";

function Chips({ count }: { count: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="flex gap-1.5 overflow-hidden">
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className={`${sk} h-10 w-24 shrink-0 rounded-full`} />
        ))}
      </div>
      <span className={`${sk} h-10 w-full rounded-control sm:ms-auto sm:w-64`} />
    </div>
  );
}

function SummarySkeleton() {
  return (
    <>
      <div className={`grid grid-cols-2 lg:grid-cols-4 ${card}`}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-2 border-s border-border p-4 first:border-s-0 sm:px-5">
            <span className={`${sk} h-3.5 w-28 rounded`} />
            <span className={`${sk} h-7 w-20 rounded`} />
          </div>
        ))}
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className={`flex flex-col gap-3 p-5 ${card}`}>
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className={`${sk} h-5 w-full rounded`} />
          ))}
        </div>
        <div className={`flex flex-col gap-3 p-5 ${card}`}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`${sk} h-4 w-full rounded`} />
          ))}
        </div>
      </div>
    </>
  );
}

function CarsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Chips count={4} />
      <div className={card}>
        <div className="hidden h-11 border-b border-border bg-muted/60 lg:block" />
        <ul className="divide-y divide-border">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <li key={i} className="flex items-center gap-4 px-4 py-3 sm:px-5">
              <span className={`${sk} h-11 w-16 shrink-0 rounded-[8px]`} />
              <span className="flex flex-1 flex-col gap-1.5">
                <span className={`${sk} h-4 w-48 max-w-full rounded`} />
                <span className={`${sk} h-3 w-28 rounded`} />
              </span>
              <span className={`${sk} hidden h-5 w-20 rounded-full sm:block`} />
              <span className={`${sk} hidden h-4 w-24 rounded lg:block`} />
              <span className={`${sk} hidden h-4 w-16 rounded lg:block`} />
              <span className={`${sk} size-10 shrink-0 rounded-control`} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TeamSkeleton() {
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className={card}>
        <div className="px-4 py-4 sm:px-5">
          <span className={`${sk} block h-6 w-28 rounded`} />
        </div>
        <ul className="divide-y divide-border border-t border-border">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <span className={`${sk} size-10 shrink-0 rounded-full`} />
              <span className="flex flex-1 flex-col gap-1.5">
                <span className={`${sk} h-4 w-40 max-w-full rounded`} />
                <span className={`${sk} h-3 w-52 max-w-full rounded`} />
              </span>
              <span className={`${sk} h-5 w-16 rounded-full`} />
              <span className={`${sk} hidden h-4 w-24 rounded lg:block`} />
            </li>
          ))}
        </ul>
      </div>
      <div className={`flex flex-col gap-3 p-5 ${card}`}>
        <span className={`${sk} h-6 w-32 rounded`} />
        {[0, 1, 2].map((i) => (
          <span key={i} className={`${sk} h-4 w-full rounded`} />
        ))}
      </div>
    </div>
  );
}

function BillingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-2.5 rounded-[20px] border border-border bg-card px-5 py-4">
            <span className={`${sk} h-5 w-24 rounded`} />
            <span className={`${sk} h-8 w-36 rounded`} />
            <span className={`${sk} h-3.5 w-full rounded`} />
            <span className={`${sk} h-3.5 w-3/4 rounded`} />
            <span className={`${sk} mt-1 h-10 w-full rounded-control`} />
          </div>
        ))}
      </div>
      <div className={card}>
        <div className="px-4 py-4 sm:px-5">
          <span className={`${sk} block h-6 w-32 rounded`} />
        </div>
        <ul className="divide-y divide-border border-t border-border">
          {[0, 1, 2, 3, 4].map((i) => (
            <li key={i} className="flex items-center gap-4 px-4 py-3 sm:px-5">
              <span className={`${sk} h-4 w-24 rounded`} />
              <span className={`${sk} h-4 flex-1 rounded`} />
              <span className={`${sk} h-5 w-16 rounded-full`} />
              <span className={`${sk} h-4 w-20 rounded`} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Chips count={5} />
      <div className={card}>
        {[0, 1].map((day) => (
          <div key={day}>
            <div className="px-5 pb-1.5 pt-4">
              <span className={`${sk} block h-4 w-24 rounded`} />
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3">
                <span className={`${sk} mt-1 size-2.5 shrink-0 rounded-full`} />
                <span className="flex flex-1 flex-col gap-1.5">
                  <span className={`${sk} h-4 w-3/4 rounded`} />
                  <span className={`${sk} h-3 w-1/3 rounded`} />
                </span>
                <span className={`${sk} h-3 w-12 rounded`} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const SKELETONS: Record<DealershipTab, () => React.JSX.Element> = {
  summary: SummarySkeleton,
  cars: CarsSkeleton,
  team: TeamSkeleton,
  billing: BillingSkeleton,
  activity: ActivitySkeleton,
};

export function DealershipTabSkeleton({ tab }: { tab: DealershipTab }) {
  const Skeleton = SKELETONS[tab];
  return (
    <div aria-busy className="flex flex-col gap-5">
      <Skeleton />
    </div>
  );
}

function FromUrl() {
  const tab = useSearchParams().get("tab");
  return <DealershipTabSkeleton tab={parseDealershipTab(tab)} />;
}

/** The skeleton for the tab in the URL — for the page's loading state, before the tab is known on the server. */
export function DealershipTabSkeletonFromUrl() {
  return (
    <Suspense fallback={<DealershipTabSkeleton tab="summary" />}>
      <FromUrl />
    </Suspense>
  );
}
