/**
 * Copy the users of one Clerk instance into another — AutoMe's move from the
 * development instance it launched on to its production instance. Each copy
 * carries its old Clerk ID as `external_id`; on the person's first sign-in in
 * the new instance, checkUser (or the user.created webhook) finds their
 * existing database row by it and moves the row to the new ID, so every
 * dealership, booking and saved car comes along. This script never touches
 * AutoMe's database.
 *
 *   pnpm clerk:migrate-users            # dry run: what would be copied
 *   pnpm clerk:migrate-users --apply    # copy
 *
 * Reads two keys — and nothing else — from .env.clerk-migration (gitignored):
 *   CLERK_MIGRATE_FROM_SECRET_KEY=sk_test_…   the instance the users are in
 *   CLERK_MIGRATE_TO_SECRET_KEY=sk_live_…     the production instance
 *
 * Safe to run again (and meant to be, just before the switch, for anyone who
 * signed up since): a user already copied is skipped; an email already taken
 * in the target by an account that is not a copy is reported, never touched.
 * Passwords cannot be read from Clerk's API, so copies have none — AutoMe's
 * users sign in with Google, which Clerk links to the copy by its email.
 * Output names Clerk IDs only, never an email.
 */

interface ClerkUser {
  id: string;
  external_id: string | null;
  primary_email_address_id: string | null;
  email_addresses: { id: string; email_address: string }[];
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  public_metadata: Record<string, unknown>;
  private_metadata: Record<string, unknown>;
  unsafe_metadata: Record<string, unknown>;
  created_at: number;
}

const API = "https://api.clerk.com/v1";
const PAGE = 500;

function keyFromEnv(name: string, prefix: string): string {
  const key = process.env[name];
  if (!key) throw new Error(`${name} is not set (see the header of this script)`);
  if (!key.startsWith(prefix)) throw new Error(`${name} must be a ${prefix}… key`);
  return key;
}

function client(secretKey: string) {
  return async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json", ...init.headers },
    });
    if (!response.ok) {
      // Clerk's error body names the problem; it never echoes the key.
      throw new Error(`${init.method ?? "GET"} ${path.split("?")[0]} → ${response.status} ${await response.text()}`);
    }
    return (await response.json()) as T;
  };
}

async function allUsers(call: ReturnType<typeof client>): Promise<ClerkUser[]> {
  const users: ClerkUser[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const page = await call<ClerkUser[]>(`/users?limit=${PAGE}&offset=${offset}&order_by=%2Bcreated_at`);
    users.push(...page);
    if (page.length < PAGE) return users;
  }
}

const primaryEmail = (user: ClerkUser) =>
  user.email_addresses.find((email) => email.id === user.primary_email_address_id)?.email_address ??
  user.email_addresses[0]?.email_address ??
  null;

async function main() {
  const apply = process.argv.includes("--apply");
  const fromKey = keyFromEnv("CLERK_MIGRATE_FROM_SECRET_KEY", "sk_test_");
  const toKey = keyFromEnv("CLERK_MIGRATE_TO_SECRET_KEY", "sk_live_");
  const from = client(fromKey);
  const to = client(toKey);

  const users = await allUsers(from);
  const outcome = { copied: 0, wouldCopy: 0, alreadyCopied: 0, emailTaken: 0, noEmail: 0 };
  console.info(`${users.length} users in the source instance — ${apply ? "copying" : "dry run"}`);

  for (const user of users) {
    const existing = await to<ClerkUser[]>(`/users?external_id=${encodeURIComponent(user.id)}`);
    if (existing.length > 0) {
      outcome.alreadyCopied++;
      console.info(`  ${user.id}: already copied as ${existing[0].id}`);
      continue;
    }
    const email = primaryEmail(user);
    if (!email) {
      // AutoMe's users all have one; a copy without it could not be linked to on sign-in.
      outcome.noEmail++;
      console.warn(`  ${user.id}: no email address — not copied`);
      continue;
    }
    const taken = await to<ClerkUser[]>(`/users?email_address=${encodeURIComponent(email)}`);
    if (taken.length > 0) {
      outcome.emailTaken++;
      console.warn(`  ${user.id}: its email is already used by ${taken[0].id} in the target, which is not a copy — left alone`);
      continue;
    }
    if (!apply) {
      outcome.wouldCopy++;
      console.info(`  ${user.id}: would copy`);
      continue;
    }
    const created = await to<ClerkUser>("/users", {
      method: "POST",
      body: JSON.stringify({
        external_id: user.id,
        email_address: [email],
        first_name: user.first_name ?? undefined,
        last_name: user.last_name ?? undefined,
        username: user.username ?? undefined,
        public_metadata: user.public_metadata,
        private_metadata: user.private_metadata,
        unsafe_metadata: user.unsafe_metadata,
        skip_password_requirement: true,
        created_at: new Date(user.created_at).toISOString(),
      }),
    });
    outcome.copied++;
    console.info(`  ${user.id}: copied as ${created.id}`);
  }

  console.info(JSON.stringify(outcome));
  if (outcome.emailTaken > 0 || outcome.noEmail > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
