import type { WorkingHoursDay } from "../../_lib/onboarding-types";

/**
 * Row order only. Each day's name lives in messages/{en,ar}/onboarding.json
 * under `workingHours.days`, keyed by `key`.
 *
 * The week starts on Saturday and ends on Friday, which is how the Egyptian
 * week runs. The rows used to start on Monday and end on Sunday, so the weekly
 * holiday sat in the middle of the list.
 */
export const DAYS: WorkingHoursDay[] = [
    { key: "saturday" },
    { key: "sunday" },
    { key: "monday" },
    { key: "tuesday" },
    { key: "wednesday" },
    { key: "thursday" },
    { key: "friday" },
];
