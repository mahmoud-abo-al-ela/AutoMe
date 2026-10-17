export const imageSearchPrompt = {
  version: "2026-10-10.1",
  text: `Identify the car in this photo so it can be matched against a car
marketplace.

Report only what you can actually see. If you cannot tell the make, the body
type or the colour with reasonable confidence, answer with an empty string for
that field instead of guessing — a wrong filter hides every matching car, an
empty one does not.

Use the colour a car buyer would say, not a paint-catalogue name: "silver", not
"lunar titanium metallic".

Set confidence to how sure you are of the overall identification, from 0 to 1.`,
} as const;
