import type { DayOfWeek, Organization, Prisma } from "@/lib/generated/prisma";
import type { OrganizationInput } from "@/lib/validations/schemas";

export type WorkingHoursInput = NonNullable<OrganizationInput["workingHours"]>;

/** The dealership's own details, as the onboarding form collected them. */
export interface OrganizationDetails {
  name: string;
  slug: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  logoUrl?: string | null;
  workingHours?: WorkingHoursInput | null;
}

/**
 * Create an organization, its working hours, the owner's membership and its
 * subscription, inside a transaction the caller owns, so a paid sign-up can
 * mark its payment and create the dealership as one unit.
 *
 * Writes no audit log: the audit helpers use their own connection, so the
 * caller logs once the transaction has committed.
 */
export async function createOrganizationRecords(
  tx: Prisma.TransactionClient,
  details: OrganizationDetails,
  ownerId: string,
  subscription: Omit<Prisma.SubscriptionUncheckedCreateInput, "organizationId">
): Promise<Organization> {
  const { name, slug, email, phone, address, country, region, city, logoUrl, workingHours } = details;

  const org = await tx.organization.create({
    data: {
      name,
      slug,
      email,
      phone: phone || null,
      address: address || null,
      // Prisma defaults country to "EG"; passing null would override that.
      ...(country ? { country } : {}),
      region: region || null,
      city: city || null,
      logo: logoUrl || null,
    },
  });

  if (workingHours) {
    const workingHoursData: Prisma.WorkingHoursCreateManyInput[] = Object.entries(workingHours).map(
      ([day, hours]) => ({
        organizationId: org.id,
        // Form keys are lowercase day names, so the uppercased key is the
        // DayOfWeek member; the record's key type can't express that.
        dayOfWeek: [day.toUpperCase() as DayOfWeek],
        openTime: hours.open,
        closeTime: hours.close,
        isOpen: !hours.closed,
      })
    );

    await tx.workingHours.createMany({ data: workingHoursData });
  }

  await tx.membership.create({
    data: { userId: ownerId, organizationId: org.id, role: "OWNER" },
  });

  await tx.subscription.create({
    data: { ...subscription, organizationId: org.id },
  });

  return org;
}
