import type { Locale } from "@/i18n/routing";
import * as billingRepo from "@/lib/repositories/billing";
import { sendEmail } from "@/lib/resend";
import { buildBillingEmail, type BillingEmail } from "@/lib/services/notification/billing-email-template";
import { logError } from "@/lib/utils/errors";

/**
 * Billing emails to a dealership's owners, in the dealership's email
 * language. The daily job's emails are claimed once per period in the
 * BillingNotice ledger first (`once`), so a re-run never sends twice and a
 * send that reached nobody gives its claim back for the next run. Emails
 * that follow a payment need no ledger: only the settlement that wins marks
 * a payment paid or failed, so they go out once anyway.
 */

/** Ledger kinds: one email of each per subscription period. */
export type NoticeKind = "renewal_due" | "renewal_reminder" | "past_due" | "downgraded";

/** Returns how many owners it reached; never throws. */
export async function emailOwners(
  organizationId: string,
  email: BillingEmail,
  once?: { kind: NoticeKind; periodEnd: Date }
): Promise<number> {
  try {
    const contacts = await billingRepo.findBillingContacts(organizationId);
    const recipients =
      contacts?.memberships.map((m) => m.user.email).filter((to): to is string => Boolean(to)) ?? [];
    if (!contacts || recipients.length === 0) return 0;

    if (once && !(await billingRepo.claimBillingNotice(organizationId, once.kind, once.periodEnd))) return 0;

    const locale: Locale = contacts.emailLocale === "en" ? "en" : "ar";
    const { subject, html } = buildBillingEmail({ locale, dealership: contacts.name, slug: contacts.slug, email });

    let delivered = 0;
    for (const to of recipients) {
      try {
        const result = await sendEmail({ to, subject, html });
        if (!result.error) delivered += 1;
        else logError(`Billing email ${email.kind} was not sent`, result.error);
      } catch (error) {
        logError(`Billing email ${email.kind} was not sent`, error);
      }
    }

    if (delivered === 0 && once) {
      await billingRepo.releaseBillingNotice(organizationId, once.kind, once.periodEnd);
    }
    return delivered;
  } catch (error) {
    logError(`Billing email ${email.kind} failed for ${organizationId}`, error);
    return 0;
  }
}
