import { pathnameWithoutLocale } from "./locale-path";

const PREFIX = "(.*)";

export type PathMatcher = (pathname: string) => boolean;

export function pathMatcher(patterns: readonly string[]): PathMatcher {
  const prefixes: string[] = [];
  const exact = new Set<string>();
  for (const pattern of patterns) {
    if (pattern.endsWith(PREFIX)) prefixes.push(pattern.slice(0, -PREFIX.length).toLowerCase());
    else exact.add(withoutTrailingSlash(pattern.toLowerCase()));
  }
  return (pathname) => {
    const path = normalize(pathname);
    return exact.has(withoutTrailingSlash(path)) || prefixes.some((prefix) => path.startsWith(prefix));
  };
}

/** The same, for page routes: matches with or without a leading locale. */
export function localizedPathMatcher(patterns: readonly string[]): PathMatcher {
  const matches = pathMatcher(patterns);
  return (pathname) => matches(pathnameWithoutLocale(normalize(pathname)));
}

function normalize(pathname: string): string {
  return pathname.toLowerCase().replace(/\/{2,}/g, "/");
}

function withoutTrailingSlash(path: string): string {
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}
