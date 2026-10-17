import { alexandria } from "@/components/brand/site-font";
import { AdminTopBar } from "./AdminTopBar";

export function AdminFrame({ children, after }: { children: React.ReactNode; after?: React.ReactNode }) {
  return (
    <div
      data-theme="site"
      data-surface="work"
      className={`${alexandria.variable} flex min-h-screen flex-col bg-background text-foreground`}
    >
      <AdminTopBar />
      <main className="mx-auto flex w-full max-w-[1760px] flex-1 flex-col px-4 pb-16 pt-6 sm:px-6 md:px-8 md:pt-10">
        {children}
      </main>
      {after}
    </div>
  );
}
