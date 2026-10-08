import { alexandria } from "@/components/brand/site-font";
import { AdminTopBar } from "./AdminTopBar";

/**
 * The super-admin frame: the dealer dashboard's theme, width and type, under
 * the admin top bar. The layout wraps every admin page in it, and the locale
 * root's loader draws the same frame on a reload, so the bar is already in
 * place while the admin check runs and nothing jumps when the page arrives.
 */
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
