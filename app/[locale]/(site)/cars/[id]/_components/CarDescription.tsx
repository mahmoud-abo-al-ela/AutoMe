"use client";

import { Languages } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { localeDirection, type Locale } from "@/i18n/routing";
import { resolveCarDescription, type BilingualCarText } from "@/lib/utils/car-text";

const CarDescription = ({ car }: { car: BilingualCarText }) => {
  const t = useTranslations("carDetail.description");
  const locale = useLocale() as Locale;
  const resolved = resolveCarDescription(car, locale);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="sr-only">{t("title")}</h3>
      {/*
        `dir` follows the language of the text, not the page. A dealer's
        English paragraph inside the Arabic page renders with its trailing
        punctuation displaced without this, which reads as a rendering bug
        rather than as a missing translation.
      */}
      <p
        dir={resolved ? localeDirection[resolved.locale] : undefined}
        className="max-w-[68ch] whitespace-pre-line text-body sm:text-[1.0625rem] sm:leading-8"
      >
        {resolved?.text || t("empty")}
      </p>

      {resolved?.fellBack && (
        <p className="flex items-center gap-1.5 text-micro text-muted-foreground">
          <Languages className="size-3.5 shrink-0" aria-hidden />
          {t("notTranslated")}
        </p>
      )}
    </div>
  );
};

export default CarDescription;
