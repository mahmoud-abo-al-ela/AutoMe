import type { Locale } from "@/i18n/routing";
import * as userRepository from "@/lib/repositories/user";
import { carUrl, siteUrl } from "@/lib/services/public-catalog/urls";
import { getTestDrives } from "@/lib/services/test-drive/status";
import { getUserWishlist, setCarSaved } from "@/lib/services/wishlist";
import { ServiceUnavailableError } from "@/lib/utils/errors";

/**
 * The signed-in buyer's MCP endpoint (app/api/mcp/account): who is calling,
 * how a client finds out how to sign in, and the buyer's own data as tools
 * return it (plans/mcp AUTH_MCP_REVIEW.md, D-27).
 *
 * Identity comes only from the verified access token's Clerk user — no tool
 * names a user — and every read goes through the service the site's own
 * pages use, with its scoping and the public visibility rule.
 */

/** Off unless MCP_ACCOUNT_ENABLED is "true" — and off in production until Clerk's OAuth-token pricing is confirmed (D-27). */
export const accountMcpEnabled = () => process.env.MCP_ACCOUNT_ENABLED === "true";

export const ACCOUNT_MCP_PATH = "/api/mcp/account";
export const ACCOUNT_METADATA_PATH = `/.well-known/oauth-protected-resource${ACCOUNT_MCP_PATH}`;

/** Lists are short: an assistant reads them, a person does not page through them. */
const PAGE_SIZE = 10;

/**
 * The OAuth authorization server: the Clerk instance's Frontend API, which
 * the publishable key encodes ("pk_test_" + base64("<host>$")) — so it is
 * always the instance the app itself signs people in with.
 */
export function oauthIssuer(): string {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const encoded = key.replace(/^pk_(test|live)_/, "");
  let host = "";
  try {
    host = Buffer.from(encoded, "base64").toString("utf8").replace(/\$$/, "");
  } catch {
    host = "";
  }
  if (!encoded || encoded === key || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host)) {
    throw new ServiceUnavailableError("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY does not name a Clerk instance");
  }
  return `https://${host}`;
}

/**
 * OAuth 2.0 Protected Resource Metadata (RFC 9728) for the endpoint — what
 * an MCP client reads after a 401 to learn where to sign the person in.
 */
export function accountResourceMetadata() {
  return {
    resource: siteUrl(ACCOUNT_MCP_PATH),
    authorization_servers: [oauthIssuer()],
    scopes_supported: ["profile", "email", "offline_access"],
    bearer_methods_supported: ["header"],
    resource_name: "AutoMe — your account",
  };
}

/**
 * The AutoMe user an access token belongs to, or null — an unknown or deleted
 * account. With the dealerships they work at, for the buyer policy: staff may
 * not save or book their own dealership's cars, here as on the site. An
 * OAuth token is never a support session, so never impersonated.
 */
export async function resolveAccountCaller(clerkUserId: string) {
  const user = await userRepository.findUserByClerkIdWithMemberships(clerkUserId);
  if (!user?.id) return null;
  const id: string = user.id;
  const memberships = (user.memberships ?? []).map((membership) => ({ organizationId: membership.organizationId }));
  // The column defaults to USER; the serialized type only does not say so.
  const role = user.role ?? "USER";
  return { id, clerkId: clerkUserId, email: user.email ?? null, role, viewer: { role, memberships, isImpersonated: false } };
}

export type AccountCaller = NonNullable<Awaited<ReturnType<typeof resolveAccountCaller>>>;

const fromTool = (tool: string) => ({ source: "mcp", medium: tool });

/** The buyer's saved cars the public may still see, newest first. */
export async function listSavedCars(caller: AccountCaller, page: number, locale: Locale) {
  const result = await getUserWishlist(caller.clerkId, { page, limit: PAGE_SIZE });
  return {
    total: result.pagination.total,
    page,
    cars: result.cars.map((car) => ({
      id: car.id,
      car: `${car.make} ${car.model}`,
      year: car.year,
      priceEgp: car.price,
      km: car.mileage,
      status: car.status,
      url: carUrl(car.id, locale, fromTool("list_saved_cars")),
    })),
  };
}

const STATUSES = ["all", "pending", "confirmed", "completed", "cancelled"] as const;
export type TestDriveFilter = (typeof STATUSES)[number];
export const TEST_DRIVE_FILTERS = STATUSES;

/** The buyer's own test drives, newest request first — without their notes or contact details. */
export async function listMyTestDrives(caller: AccountCaller, status: TestDriveFilter, page: number, locale: Locale) {
  // No organization: on the main domain the service scopes to the caller's own bookings.
  const result = await getTestDrives({ status }, { page, limit: PAGE_SIZE }, caller.clerkId, null);
  return {
    total: result.pagination.total,
    page,
    testDrives: result.testDrives
      .filter((drive) => drive !== null)
      .map((drive) => {
        const car = drive.car as { id: string; make: string; model: string; year: number } | null | undefined;
        return {
          id: drive.id,
          status: drive.status,
          date: drive.date,
          startTime: drive.startTime,
          endTime: drive.endTime,
          car: car
            ? { id: car.id, car: `${car.make} ${car.model}`, year: car.year, url: carUrl(car.id, locale, fromTool("list_my_test_drives")) }
            : null,
        };
      }),
  };
}

/** Save a car to the buyer's list; as asked whatever its state (`changed` says if it was). */
export async function saveCar(caller: AccountCaller, carId: string) {
  return { carId, ...(await setCarSaved(carId, caller.clerkId, caller.viewer, true)) };
}

/** Remove a car from the buyer's list; as asked whatever its state. */
export async function unsaveCar(caller: AccountCaller, carId: string) {
  return { carId, ...(await setCarSaved(carId, caller.clerkId, caller.viewer, false)) };
}
