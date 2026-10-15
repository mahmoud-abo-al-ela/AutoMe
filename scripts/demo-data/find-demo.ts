import type { PrismaClient } from "../../lib/generated/prisma";
import { DEALERSHIPS } from "./dealerships";

/**
 * What counts as demo data, and nothing else may be touched.
 *
 * - Dealerships: the ten the old seed made (prisma/seed.ts) and the six this
 *   script makes — by slug.
 * - People: a Clerk id no real sign-in can have. The old seed's end in
 *   "_clerk_id" (admin_clerk_id, <slug>_admin_clerk_id, customer_3_clerk_id…);
 *   this script's start with "demo_". Real ones are Clerk's ("user_2Nx…").
 *
 * A listed dealership with a real member, or with a paid payment, stops the
 * whole run: that is a dealership someone is using, whatever its slug.
 */
const OLD_SEED_SLUGS = [
  "cairo-auto-gallery", "alexandria-motors", "giza-premium-cars", "delta-wheels", "tanta-auto-center",
  "upper-egypt-auto", "aswan-car-mart", "portsaid-automotive", "ismailia-car-gallery", "red-sea-motors",
];
export const DEMO_SLUGS = [...OLD_SEED_SLUGS, ...DEALERSHIPS.map((d) => d.slug)];

export const isDemoClerkId = (clerkId: string) => clerkId.startsWith("demo_") || clerkId.endsWith("_clerk_id");

export async function findDemo(db: PrismaClient) {
  const orgs = await db.organization.findMany({
    where: { slug: { in: DEMO_SLUGS } },
    select: {
      id: true,
      name: true,
      slug: true,
      memberships: { select: { user: { select: { clerkId: true, email: true } } } },
      payments: { where: { status: "PAID" }, select: { id: true } },
      _count: { select: { cars: true, testDrives: true, dealershipReviews: true } },
    },
  });
  const users = (await db.user.findMany({ select: { id: true, clerkId: true, email: true } })).filter((u) => isDemoClerkId(u.clerkId));
  const orgIds = orgs.map((o) => o.id);

  const problems: string[] = [];
  for (const org of orgs) {
    const real = org.memberships.filter((m) => !isDemoClerkId(m.user.clerkId));
    if (real.length > 0) problems.push(`${org.name}: has a real member (${real.map((m) => m.user.email).join(", ")})`);
    if (org.payments.length > 0) problems.push(`${org.name}: has ${org.payments.length} paid payment(s)`);
  }
  const strays = await db.membership.findMany({
    where: { userId: { in: users.map((u) => u.id) }, organizationId: { notIn: orgIds } },
    select: { user: { select: { email: true } }, organization: { select: { name: true } } },
  });
  for (const s of strays) problems.push(`demo user ${s.user.email} belongs to ${s.organization.name}, which is not demo`);

  return { orgs, users, orgIds, userIds: users.map((u) => u.id), problems };
}

export type Demo = Awaited<ReturnType<typeof findDemo>>;

/** Remove the demo data. Everything hanging off a dealership or a person cascades; the rest is cleared here. */
export async function removeDemo(db: PrismaClient, demo: Demo) {
  const { orgIds, userIds } = demo;
  await db.$transaction(
    async (tx) => {
      // These keep a dealership's or person's id with SET NULL; demo rows go with the demo.
      await tx.auditLog.deleteMany({ where: { OR: [{ organizationId: { in: orgIds } }, { userId: { in: userIds } }] } });
      await tx.aiUsage.deleteMany({ where: { OR: [{ organizationId: { in: orgIds } }, { userId: { in: userIds } }] } });
      await tx.payment.deleteMany({ where: { organizationId: { in: orgIds } } });
      await tx.organization.deleteMany({ where: { id: { in: orgIds } } });
      await tx.user.deleteMany({ where: { id: { in: userIds } } });
    },
    { timeout: 120_000 }
  );
}
