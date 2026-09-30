"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

const ErrorState = ({
  error,
  onRetry,
}: {
  // The render below handles an Error, a bare string, or nothing — the query
  // layer has produced all three.
  error: Error | string | null | undefined;
  onRetry: () => void;
}) => {
  const t = useTranslations("org.cars.error");
  const tCommon = useTranslations("common.actions");

  // A thrown Error carries a developer-facing English message. It is shown
  // when there is one, on the same reasoning as resolveActionError: a slightly
  // English sentence beats a blank while those throw sites are migrated.
  const detail = typeof error === "string" ? error : error?.message;

  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
      <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mb-3 sm:mb-4" />
      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">
        {t("title")}
      </h3>
      <p className="text-sm sm:text-base text-gray-500 mb-4 max-w-md">
        {detail || t("body")}
      </p>
      <Button onClick={onRetry} className="mb-2 text-sm">
        <RefreshCw className="me-2 h-3 w-3 sm:h-4 sm:w-4" />
        {tCommon("retry")}
      </Button>
    </div>
  );
};

export default ErrorState;
