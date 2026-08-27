"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";
import { useTranslations } from "next-intl";

const CarDescription = ({ description }: { description: string | null }) => {
  const t = useTranslations("carDetail.description");
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
        <p className="text-gray-700 leading-relaxed text-sm sm:text-base md:text-lg">
          {description || t("empty")}
        </p>
      </CardContent>
    </Card>
  );
};

export default CarDescription;
