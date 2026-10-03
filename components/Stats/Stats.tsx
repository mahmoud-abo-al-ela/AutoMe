import { getTranslations } from "next-intl/server";

/**
 * Headline figures (Figma: Stat).
 *
 * ⚠️ PLACEHOLDER CONTENT — owner decision 2026-10-02. These are the site's
 * existing marketing figures, not measured values, and they disagree with the
 * live counts in the hero eyebrow beside them. They stay until real numbers
 * are chosen; the translated values in home.stats are the only thing to edit.
 */
const STATS = ["customers", "vehicles", "dealerships", "rating"] as const;

export default async function Stats() {
  const t = await getTranslations("home.stats");

  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-control border border-border bg-card lg:grid-cols-4">
      {STATS.map((key, i) => (
        <div
          key={key}
          className={[
            "flex flex-col gap-1 p-5 sm:p-6",
            i % 2 === 1 ? "border-s border-border" : "",
            i >= 2 ? "border-t border-border lg:border-t-0" : "",
            i === 2 ? "lg:border-s" : "",
          ].join(" ")}
        >
          <dt className="order-2 text-caption font-semibold">{t(`${key}Label`)}</dt>
          <dd className="order-1 text-[2.25rem] leading-none font-black sm:text-[2.75rem]">{t(`${key}Value`)}</dd>
          <dd className="order-3 text-micro text-muted-foreground">{t(`${key}Description`)}</dd>
        </div>
      ))}
    </dl>
  );
}
