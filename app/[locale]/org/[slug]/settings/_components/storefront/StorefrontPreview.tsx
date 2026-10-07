"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import { OpenStatusBadge } from "@/components/dealership/OpenStatusBadge";
import { DealershipTermsList, hasStatedTerms } from "@/components/dealership/DealershipTermsList";
import { TimeRange } from "@/components/common/TimeRange";
import { findCity, findGovernorate } from "@/lib/locations/data";
import type { Locale } from "@/i18n/routing";
import { groupHours, hoursToEntries, termsToInput, unstatedTerms, type StorefrontState } from "./storefront-state";

/**
 * The dealership as buyers meet it, drawn from the unsaved form so every
 * keystroke shows. Built from the public page's own pieces — the open/closed
 * badge and the terms list buyers read on every listing — so it cannot drift
 * into describing a page that does not exist.
 */
export function StorefrontPreview({ state, logo }: { state: StorefrontState; logo: string | null }) {
  const t = useTranslations("org.settings.storefront.preview");
  const tTerms = useTranslations("org.settings.storefront.terms");
  const tDays = useTranslations("dealerships.days");
  const locale = useLocale() as Locale;
  const { profile, hours, terms } = state;
  const name = profile.name.trim() || t("unnamed");
  const label = (entry: { en: string; ar: string } | undefined) => (entry ? (locale === "ar" ? entry.ar : entry.en) : null);
  const place = [label(findCity(profile.city)), label(findGovernorate(profile.region))].filter(Boolean).join(locale === "ar" ? "، " : ", ");
  const stated = termsToInput(terms);
  const unstated = unstatedTerms(terms);
  const list = new Intl.ListFormat(locale, { type: "conjunction" });

  return (
    <div className="flex flex-col gap-3">
      <article className="overflow-hidden rounded-[18px] border border-border bg-field">
        <div className="flex items-start gap-4 p-5">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-control ring-1 ring-border">
            {logo ? (
              <Image src={logo} alt="" fill sizes="64px" className="object-contain" />
            ) : (
              // Initials on marker yellow, as on the public page and the dealership cards.
              <span aria-hidden className="flex size-full items-center justify-center border-2 border-border-strong bg-marker text-[1.5rem] font-black">
                {name
                  .split(/\s+/)
                  .filter(Boolean)
                  .map((word) => word[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </span>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            {/* bdi, not dir="auto": a Latin name keeps its own direction but lines up with the page, beside the logo. */}
            <h3 className="text-[1.375rem] font-extrabold leading-tight">
              <bdi>{name}</bdi>
            </h3>
            {(place || profile.address) && (
              <p className="flex items-start gap-1.5 text-caption text-muted-foreground">
                <MapPin aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  {place}
                  {place && profile.address && (locale === "ar" ? "، " : ", ")}
                  {profile.address && <bdi>{profile.address}</bdi>}
                </span>
              </p>
            )}
            <OpenStatusBadge workingHours={hoursToEntries(hours)} className="w-fit" />
          </div>
        </div>

        {profile.description.trim() && (
          <p className="line-clamp-4 whitespace-pre-line px-5 pb-4 text-body text-muted-foreground">
            <bdi>{profile.description}</bdi>
          </p>
        )}

        <div className="flex flex-col gap-2 border-t border-border px-5 py-4">
          <h4 className="text-caption font-semibold">{t("onEveryCar")}</h4>
          {hasStatedTerms(stated) ? <DealershipTermsList terms={stated} /> : <p className="text-caption text-muted-foreground">{t("noTerms")}</p>}
        </div>

        <div className="flex flex-col gap-2 border-t border-border px-5 py-4">
          <h4 className="text-caption font-semibold">{t("hours")}</h4>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-caption">
            {groupHours(hours).map((group) => (
              <div key={group.days[0]} className="contents">
                <dt className="text-muted-foreground">
                  {group.days.length === 1
                    ? tDays(group.days[0])
                    : t("dayRange", { from: tDays(group.days[0]), to: tDays(group.days.at(-1)!) })}
                </dt>
                <dd>{group.isOpen ? <TimeRange start={group.openTime} end={group.closeTime} /> : t("closed")}</dd>
              </div>
            ))}
          </dl>
        </div>
      </article>

      {unstated.length > 0 && (
        <p className="text-caption text-muted-foreground">
          {t("unstated", { count: unstated.length, terms: list.format(unstated.map((flag) => tTerms(`short.${flag}`))) })}
        </p>
      )}
    </div>
  );
}
