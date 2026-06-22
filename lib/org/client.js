export function getOrgSlugFromPath(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "org" && segments[1]) {
    return segments[1];
  }
  return null;
}
