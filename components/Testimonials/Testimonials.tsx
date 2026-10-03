import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/Home/SectionHeader";

/** Proper nouns — never translated, and index-aligned with `reviews.r1..r4`. */
const REVIEWER_NAMES = ["Sarah Johnson", "Michael Chen", "Emily Rodriguez", "David Thompson"] as const;

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

/**
 * Buyer reviews (Figma: Testimonial).
 *
 * ⚠️ PLACEHOLDER CONTENT — owner decision 2026-10-02. These are invented
 * reviews kept from the previous site until real ones exist. The stock-photo
 * faces are gone: an initials disc stands in, so nothing pretends to be a
 * photograph of a real buyer. No autoplay carousel — four cards, a sideways
 * scroll on phones.
 */
export default async function Testimonials({ brand }: { brand: string }) {
  const t = await getTranslations("home.testimonials");
  const reviews = ([1, 2, 3, 4] as const).map((n, i) => ({
    name: REVIEWER_NAMES[i],
    role: t(`reviews.r${n}.role`),
    content: t(`reviews.r${n}.content`),
  }));

  return (
    <>
      <SectionHeader title={`${t("title")} ${t("titleAccent")}`} subtitle={t("subtitle", { brand })} />
      <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-4">
        {reviews.map((review) => (
          <li key={review.name} className="w-[85%] shrink-0 snap-start md:w-auto">
            <figure className="flex h-full flex-col gap-5 rounded-control border border-border bg-card p-6">
              <blockquote className="flex-1 text-body">“{review.content}”</blockquote>
              <figcaption className="flex items-center gap-3">
                <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-micro font-bold">
                  {initials(review.name)}
                </span>
                <span className="flex flex-col">
                  <span dir="ltr" className="text-caption font-semibold">{review.name}</span>
                  <span className="text-micro text-muted-foreground">{review.role}</span>
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </>
  );
}
