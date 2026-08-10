export const DAYS = [
    { key: "monday", label: "Monday", short: "Mon" },
    { key: "tuesday", label: "Tuesday", short: "Tue" },
    { key: "wednesday", label: "Wednesday", short: "Wed" },
    { key: "thursday", label: "Thursday", short: "Thu" },
    { key: "friday", label: "Friday", short: "Fri" },
    { key: "saturday", label: "Saturday", short: "Sat" },
    { key: "sunday", label: "Sunday", short: "Sun" },
];

const WEEKEND = ["friday", "saturday"];

/**
 * `build` returns the row for a given day, so a preset can close specific days.
 * Weekend defaults to Fri/Sat, the common Egyptian pattern.
 */
export const PRESETS = [
    {
        id: "weekdays-9-6",
        label: "Sun–Thu, 9–6",
        build: (dayKey) => ({
            open: "09:00",
            close: "18:00",
            closed: WEEKEND.includes(dayKey),
        }),
    },
    {
        id: "everyday-10-8",
        label: "Every day, 10–8",
        build: () => ({ open: "10:00", close: "20:00", closed: false }),
    },
    {
        id: "everyday-9-5",
        label: "Every day, 9–5",
        build: () => ({ open: "09:00", close: "17:00", closed: false }),
    },
];
