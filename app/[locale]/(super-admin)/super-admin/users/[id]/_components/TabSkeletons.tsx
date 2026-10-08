"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { USER_TABS, type UserTab } from "@/lib/services/super-admin/users-options";

/**
 * Each tab of a person's page on its way, in its own shape — shown while a
 * tab switches, and on a reload by the page's loading state. Shimmer, like
 * every admin skeleton.
 */

const sk = "skeleton-shimmer";
const card = "overflow-hidden rounded-[20px] border border-border bg-card";
type Row = "car" | "dealership" | "review" | "session" | "feed";

function Rows({ row, count = 6 }: { row: Row; count?: number }) {
  return (
    <ul className="divide-y divide-border">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3 sm:px-5">
          {row === "car" && <span className={`${sk} h-11 w-16 shrink-0 rounded-[8px]`} />}
          {row === "dealership" && <span className={`${sk} size-10 shrink-0 rounded-[10px]`} />}
          {row === "feed" && <span className={`${sk} size-2.5 shrink-0 self-start rounded-full mt-1.5`} />}
          <span className="flex flex-1 flex-col gap-1.5">
            {row === "review" && <span className={`${sk} h-3.5 w-24 rounded`} />}
            <span className={`${sk} h-4 rounded ${row === "feed" || row === "review" ? "w-4/5" : "w-2/3"}`} />
            <span className={`${sk} h-3 w-1/2 rounded`} />
          </span>
          {row === "car" && <span className={`${sk} h-5 w-20 shrink-0 rounded-full`} />}
          {row === "dealership" && <span className={`${sk} h-5 w-16 shrink-0 rounded-full`} />}
          {(row === "session" || row === "feed") && <span className={`${sk} h-3 w-14 shrink-0 rounded`} />}
        </li>
      ))}
    </ul>
  );
}

function SummarySkeleton() {
  return (
    <>
      <div className={`grid grid-cols-2 lg:grid-cols-3 ${card}`}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-2 border-border p-4 odd:border-e sm:px-5 lg:border-e [&:nth-child(3)]:col-span-2 [&:nth-child(3)]:border-t lg:[&:nth-child(3)]:col-span-1 lg:[&:nth-child(3)]:border-t-0 lg:last:border-e-0"
          >
            <span className={`${sk} h-3.5 w-24 rounded`} />
            <span className={`${sk} h-7 w-16 rounded`} />
            <span className={`${sk} h-3 w-20 rounded`} />
          </div>
        ))}
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-2">
        {[0, 1].map((panel) => (
          <div key={panel} className={card}>
            <div className="flex items-center justify-between px-4 py-4 sm:px-5">
              <span className={`${sk} h-6 w-36 rounded`} />
              <span className={`${sk} h-4 w-14 rounded`} />
            </div>
            <div className="border-t border-border">
              <Rows row="car" count={5} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

const ROWS: Record<Exclude<UserTab, "summary">, Row> = {
  dealerships: "dealership",
  drives: "car",
  saved: "car",
  reviews: "review",
  sessions: "session",
  activity: "feed",
};

export function UserTabSkeleton({ tab }: { tab: UserTab }) {
  return (
    <div aria-busy className="flex flex-col gap-6">
      {tab === "summary" ? (
        <SummarySkeleton />
      ) : (
        <div className={card}>
          <Rows row={ROWS[tab]} count={tab === "dealerships" ? 2 : 8} />
        </div>
      )}
    </div>
  );
}

function FromUrl() {
  const tab = useSearchParams().get("tab");
  return <UserTabSkeleton tab={(USER_TABS as readonly string[]).includes(tab ?? "") ? (tab as UserTab) : "summary"} />;
}

/** The skeleton for the tab in the URL — for the page's loading state, before the tab is known on the server. */
export function UserTabSkeletonFromUrl() {
  return (
    <Suspense fallback={<UserTabSkeleton tab="summary" />}>
      <FromUrl />
    </Suspense>
  );
}
