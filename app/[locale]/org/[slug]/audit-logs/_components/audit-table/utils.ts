import type { Locale } from "@/i18n/routing";
import { formatDateTime } from "@/lib/utils/datetime";
export const formatActionLabel = (action: string) => {
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export const formatDate = (date: Date | string, locale: Locale = "en") => {
  return formatDateTime(date, locale);
};
