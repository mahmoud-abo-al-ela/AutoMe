import type { ReactNode } from "react";
import { PageHeader } from "@/components/brand";

/**
 * The shared frame of the legal pages (privacy, terms, cookies): a plain page
 * header with the revision date, then a single reading column. The body is
 * styled from here so each page only lists its sections — the `prose` class
 * these used was a no-op, as the typography plugin is not installed.
 */
export function LegalDocument({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[1360px] px-4 pb-16 pt-6 sm:px-6 sm:pt-8 xl:px-0">
      <PageHeader title={title} subtitle={updated} />
      <article className="flex max-w-3xl flex-col gap-4 text-body leading-relaxed [&_h2]:mt-6 [&_h2]:text-h3 [&_h2]:font-semibold [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:ps-6">
        {children}
      </article>
    </div>
  );
}
