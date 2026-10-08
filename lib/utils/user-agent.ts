/**
 * The browser and system a request came from, read from its user agent —
 * enough to say "Chrome on Windows" beside an audit entry. Names are product
 * names, so they are the same in every language. Null when neither is known.
 */
const BROWSERS: [RegExp, string][] = [
  [/Edg(e|A|iOS)?\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/SamsungBrowser\//, "Samsung Internet"],
  [/Firefox\/|FxiOS\//, "Firefox"],
  [/Chrome\/|CriOS\//, "Chrome"],
  [/Safari\//, "Safari"],
];

const SYSTEMS: [RegExp, string][] = [
  [/Windows/, "Windows"],
  [/iPhone/, "iPhone"],
  [/iPad/, "iPad"],
  [/Android/, "Android"],
  [/Mac OS X|Macintosh/, "macOS"],
  [/CrOS/, "ChromeOS"],
  [/Linux/, "Linux"],
];

export function describeUserAgent(userAgent: string | null | undefined): { browser: string | null; system: string | null } | null {
  if (!userAgent) return null;
  const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1] ?? null;
  const system = SYSTEMS.find(([pattern]) => pattern.test(userAgent))?.[1] ?? null;
  return browser || system ? { browser, system } : null;
}
