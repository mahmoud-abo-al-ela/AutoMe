import { cookies } from "next/headers";
import { PLATE_BAND_COOKIE, parsePlateBand } from "@/lib/org/client";
import { RootLoading } from "./_components/RootLoading";

export default async function Loading() {
  const band = parsePlateBand((await cookies()).get(PLATE_BAND_COOKIE)?.value);
  return <RootLoading band={band} />;
}
