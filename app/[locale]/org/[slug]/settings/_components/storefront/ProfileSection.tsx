"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import SearchableLocationSelect from "@/components/SearchableLocationSelect";
import { useEgyptLocations } from "@/hooks/use-egypt-locations";
import { useFormatters } from "@/hooks/use-formatters";
import { Field, inputClass } from "../../../_components/form-ui";
import { SectionPanel } from "../../../_components/SectionPanel";
import type { ProfileState } from "./storefront-state";

const MAX_DESCRIPTION = 1000;

/** The dealership's details: its name, how to reach it, where it is, and a line about it. */
export function ProfileSection({
  profile,
  onChange,
  nameError,
}: {
  profile: ProfileState;
  onChange: (next: ProfileState) => void;
  nameError: boolean;
}) {
  const t = useTranslations("org.settings.storefront.profile");
  const fmt = useFormatters();
  const { governorateOptions, cityOptions } = useEgyptLocations(profile.region);
  // Email and website are folded away until there is one: most dealers sell by phone.
  const [showMore, setShowMore] = useState(Boolean(profile.email || profile.website));
  const set = (field: keyof ProfileState, value: string) => onChange({ ...profile, [field]: value });

  return (
    <SectionPanel title={t("title")}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="sf-name" label={t("name")} error={nameError ? t("nameRequired") : undefined}>
          <input
            id="sf-name"
            value={profile.name}
            onChange={(event) => set("name", event.target.value)}
            maxLength={100}
            autoComplete="organization"
            aria-invalid={nameError || undefined}
            aria-describedby={nameError ? "sf-name-error" : undefined}
            className={inputClass({ error: nameError })}
          />
        </Field>
        <Field id="sf-phone" label={t("phone")}>
          <input
            id="sf-phone"
            type="tel"
            inputMode="tel"
            // A phone number reads left to right in both languages.
            dir="ltr"
            value={profile.phone}
            onChange={(event) => set("phone", event.target.value)}
            maxLength={40}
            autoComplete="tel"
            className={`${inputClass()} rtl:text-right`}
          />
        </Field>
        <Field id="sf-region" label={t("region")}>
          <SearchableLocationSelect
            id="sf-region"
            value={profile.region || undefined}
            options={governorateOptions}
            placeholder={t("regionPlaceholder")}
            searchPlaceholder={t("search")}
            emptyMessage={t("noMatch")}
            // A new governorate clears the area: the old one is not in its list.
            onValueChange={(region) => onChange({ ...profile, region, city: "" })}
            triggerClassName={inputClass()}
          />
        </Field>
        <Field id="sf-city" label={t("city")}>
          <SearchableLocationSelect
            id="sf-city"
            value={profile.city || undefined}
            options={cityOptions}
            placeholder={t("cityPlaceholder")}
            searchPlaceholder={t("search")}
            emptyMessage={t("noMatch")}
            disabled={!profile.region || cityOptions.length === 0}
            onValueChange={(city) => set("city", city)}
            triggerClassName={inputClass()}
          />
        </Field>
        <Field id="sf-address" label={t("address")} className="sm:col-span-2">
          <input
            id="sf-address"
            value={profile.address}
            onChange={(event) => set("address", event.target.value)}
            maxLength={240}
            autoComplete="street-address"
            dir={profile.address ? "auto" : undefined}
            className={inputClass()}
          />
        </Field>
        <Field
          id="sf-description"
          label={t("description")}
          hint={t("count", { used: fmt.number(profile.description.length), max: fmt.number(MAX_DESCRIPTION) })}
          className="sm:col-span-2"
        >
          <textarea
            id="sf-description"
            value={profile.description}
            onChange={(event) => set("description", event.target.value)}
            maxLength={MAX_DESCRIPTION}
            rows={4}
            placeholder={t("descriptionPlaceholder")}
            // Empty, it follows the page; typed, it follows the text.
            dir={profile.description ? "auto" : undefined}
            aria-describedby="sf-description-hint"
            className={`${inputClass()} h-auto min-h-28 resize-y py-2.5`}
          />
        </Field>

        {showMore ? (
          <>
            <Field id="sf-email" label={t("email")}>
              <input
                id="sf-email"
                type="email"
                dir="ltr"
                value={profile.email}
                onChange={(event) => set("email", event.target.value)}
                maxLength={120}
                autoComplete="email"
                className={`${inputClass()} rtl:text-right`}
              />
            </Field>
            <Field id="sf-website" label={t("website")}>
              <input
                id="sf-website"
                type="url"
                dir="ltr"
                value={profile.website}
                onChange={(event) => set("website", event.target.value)}
                maxLength={200}
                placeholder="https://"
                autoComplete="url"
                className={`${inputClass()} rtl:text-right`}
              />
            </Field>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setShowMore(true)}
            className="w-fit cursor-pointer text-caption font-semibold text-[#1d4e9e] underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
          >
            {t("addMore")}
          </button>
        )}
      </div>
    </SectionPanel>
  );
}
