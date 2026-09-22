/**
 * Egypt's places: the dataset, how a stored value renders, and how a query
 * reaches it. Import from here rather than from the individual files.
 *
 * `data` is deliberately free of message-file imports so a client component
 * needing only the dropdown options does not pull the display and search layers
 * into the bundle with it.
 */

export * from "./data";
export * from "./names";
export * from "./aliases";
export { normalizePlaceName } from "./normalize";
