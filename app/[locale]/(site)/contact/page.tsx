import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ChevronRight, MapPin } from "lucide-react";
import { PageHeader } from "@/components/brand";
import { telHref } from "@/lib/utils/phone";
import { formatNumber } from "@/lib/utils/number";
import { contactMethods, faqQuickLinks, RESPONSE_HOURS } from "./contact-data";
import ContactForm from "./_components/ContactForm";
import type { Locale } from "@/i18n/routing";
import { localizedPageMetadata } from "@/lib/utils/page-seo";

const container = "mx-auto w-full max-w-[1360px] px-4 sm:px-6 xl:px-0";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact.meta" });

  return localizedPageMetadata("/contact", locale as Locale, {
    title: t("title"),
    description: t("description"),
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // Statically rendered pages do not inherit the locale from the root layout
  // the way dynamic ones do, so without this the whole tree — including the
  // shared header and footer — renders in the default locale.
  const { locale } = await params;
  const t = await getTranslations("contact");
  // Formatted before interpolation: a raw number renders in Western digits on
  // the Arabic page (see lib/utils/number).
  const responseHours = formatNumber(RESPONSE_HOURS, locale as Locale);

  // How to reach the team, in the hero's second column. Email and phone are
  // links, so a phone dials and a desktop opens the mail client.
  const methods = (
    <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-control border border-inverse-foreground/15 bg-inverse-foreground/15 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      {contactMethods.map((method) => {
        const Icon = method.icon;
        const detail = "detail" in method ? method.detail : t(`methods.${method.key}.detail`);
        const href =
          method.key === "email" ? `mailto:${detail}` : method.key === "phone" ? telHref(detail) ?? undefined : undefined;
        return (
          <li key={method.key} className="flex items-start gap-3 bg-inverse p-4 sm:p-5">
            <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-plate bg-inverse-foreground/10">
              <Icon className="size-[18px]" />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-micro text-inverse-foreground/70">{t(`methods.${method.key}.title`)}</p>
              {/* A phone number and an email address are Latin runs: dir="ltr"
                  keeps "+20 2 …" from being reordered, and self-start sizes
                  the link to its text so it still sits at the line's start —
                  the right, on the Arabic page — instead of filling the line
                  as an LTR block and aligning left. */}
              {href ? (
                <a href={href} dir="ltr" className="self-start text-caption font-semibold text-marker [overflow-wrap:anywhere] hover:underline">
                  {detail}
                </a>
              ) : (
                <p dir="auto" className="break-words text-caption font-semibold">
                  {detail}
                </p>
              )}
              <p className="text-micro text-inverse-foreground/60">
                {t(`methods.${method.key}.description`, { hours: responseHours })}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="flex flex-col pb-16">
      <PageHeader
        tone="inverse"
        eyebrow={t("hero.eyebrow")}
        title={t("hero.headline")}
        accent={t("hero.headlineAccent")}
        subtitle={t("hero.subtitle")}
        aside={methods}
      />

      <section aria-labelledby="contact-form-title" className={`${container} pt-12 sm:pt-16`}>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
          <div className="flex flex-col">
            <h2 id="contact-form-title" className="text-h1 font-extrabold">
              {t("form.title")}
            </h2>
            <p className="mb-8 mt-2 text-body text-muted-foreground">
              {t("form.subtitle", { hours: responseHours })}
            </p>
            <ContactForm />
          </div>

          <aside className="flex flex-col gap-4">
            <h2 className="text-h3 font-semibold">{t("help.title")}</h2>
            <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-control border border-border bg-card">
              {faqQuickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.key}>
                    <Link
                      href={link.href}
                      className="group flex items-center gap-4 p-4 transition-colors hover:bg-muted"
                    >
                      <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-plate bg-muted transition-colors group-hover:bg-card">
                        <Icon className="size-5" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-caption font-semibold">{t(`help.${link.key}.title`)}</span>
                        <span className="text-micro text-muted-foreground">{t(`help.${link.key}.description`)}</span>
                      </span>
                      <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" />
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-start gap-4 rounded-control border border-border bg-muted p-4">
              <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-plate bg-card">
                <MapPin className="size-5" />
              </span>
              <div className="flex flex-col gap-0.5">
                <p className="text-caption font-semibold">{t("address.city")}</p>
                <p className="text-micro text-muted-foreground">
                  {t("address.lines")}
                  <br />
                  {t("methods.visit.detail")}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
