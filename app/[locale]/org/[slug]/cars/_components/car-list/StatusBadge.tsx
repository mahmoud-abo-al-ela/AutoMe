"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";

const StatusBadge = ({
  status,
  compact = false,
  iconOnly = false,
}: {
  /** Lower-cased CarStatus; the switch below matches "available" etc. */
  status: string;
  compact?: boolean;
  iconOnly?: boolean;
}) => {
  // The status names live in carAttributes, keyed by the Prisma enum, because
  // the public car pages read the same three words.
  const tStatus = useTranslations("carAttributes.status");
  const t = useTranslations("org.cars.table");

  const getStatusConfig = () => {
    switch (status) {
      case "available":
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          text: tStatus("AVAILABLE"),
          className: "text-green-600 bg-green-50 border-green-200",
        };
      case "sold":
        return {
          icon: <XCircle className="h-3 w-3" />,
          text: tStatus("SOLD"),
          className: "text-red-600 bg-red-50 border-red-200",
        };
      case "unavailable":
        return {
          icon: <Clock className="h-3 w-3" />,
          text: tStatus("UNAVAILABLE"),
          className: "text-orange-600 bg-orange-50 border-orange-200",
        };
      default:
        return {
          icon: <Clock className="h-3 w-3" />,
          text: t("unknownStatus"),
          className: "text-gray-600 bg-gray-50 border-gray-200",
        };
    }
  };

  const { icon, text, className } = getStatusConfig();

  return (
    <Badge
      variant="outline"
      className={`text-xs whitespace-nowrap ${className} ${iconOnly ? "h-6 w-6 p-0 flex items-center justify-center" : "px-2 py-1"
        }`}
      // The icon-only and compact forms drop the words, so the name has to
      // survive somewhere a screen reader and a hover can still reach it.
      title={compact || iconOnly ? text : undefined}
      aria-label={compact || iconOnly ? text : undefined}
    >
      <span className={compact || iconOnly ? "" : "me-1"}>{icon}</span>
      {!compact && !iconOnly && text}
    </Badge>
  );
};

export default StatusBadge;
