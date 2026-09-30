import { db } from "@/lib/prisma";
import type { EmailPreferencesInput } from "@/lib/validations/schemas";

const EMAIL_PREFERENCES_SELECT = { emailLocale: true, weeklyDigestEnabled: true } as const;

/** What the dealership receives by email, and in which language. */
export async function findEmailPreferences(organizationId: string) {
  return db.organization.findUnique({
    where: { id: organizationId },
    select: EMAIL_PREFERENCES_SELECT,
  });
}

export async function updateEmailPreferences(organizationId: string, data: EmailPreferencesInput) {
  return db.organization.update({
    where: { id: organizationId },
    data,
    select: EMAIL_PREFERENCES_SELECT,
  });
}
