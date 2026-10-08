import { cookies } from "next/headers";
import { PLATE_BAND_COOKIE, parsePlateBand } from "@/lib/org/client";
import { RootLoading } from "./_components/RootLoading";

/**
 * The boundary above every locale route (see RootLoading). It shows before
 * any layout has looked the user up, so the plate's band comes from the
 * cookie the header left on the last visit (useRememberPlateBand); a first
 * visit, or a value this app did not write, gets the plain EGYPT plate.
 */
export default async function Loading() {
  const band = parsePlateBand((await cookies()).get(PLATE_BAND_COOKIE)?.value);
  return <RootLoading band={band} />;
}
