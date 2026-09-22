"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Info, Languages } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { localeDirection, type Locale } from "@/i18n/routing";
import {
  resolveCarDescription,
  type BilingualCarText,
} from "@/lib/utils/car-text";

const CarDescription = ({ car }: { car: BilingualCarText }) => {
  const t = useTranslations("carDetail.description");
  const locale = useLocale() as Locale;
  const resolved = resolveCarDescription(car, locale);

  return (
    <Card className="shadow-lg border-0 bg-white p-0">
      <CardContent className="p-4 sm:p-6 md:p-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
          <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          </div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
            {t("title")}
          </h3>
        </div>

        {/*
          `dir` follows the language of the text, not the page. A dealer's
          English paragraph inside the Arabic page renders with its trailing
          punctuation displaced without this, which reads as a rendering bug
          rather than as a missing translation.
        */}
        <p
          dir={resolved ? localeDirection[resolved.locale] : undefined}
          className="text-gray-700 leading-relaxed text-sm sm:text-base md:text-lg"
        >
          {resolved?.text || t("empty")}
        </p>

        {resolved?.fellBack && (
          <p className="mt-3 sm:mt-4 flex items-center gap-1.5 text-xs text-gray-500">
            <Languages className="w-3.5 h-3.5 shrink-0" aria-hidden />
            {t("notTranslated")}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CarDescription;
