import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import superAdmin from "@/messages/en/superAdmin.json";
import org from "@/messages/en/org.json";
import plans from "@/messages/en/plans.json";
import { BillingPayments } from "./BillingPayments";
import { TeamSidebar } from "./TeamSidebar";

/**
 * The pieces the Billing and Team tabs were split into render what they are
 * handed — the props now carry what each used to read from the tab's data.
 */

const messages = { superAdmin, org, plans };

function render(node: React.ReactNode) {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="Africa/Cairo">
      {node}
    </NextIntlClientProvider>
  );
}

type Payments = Parameters<typeof BillingPayments>[0]["payments"];
type Team = Parameters<typeof TeamSidebar>[0]["team"];

const payment = {
  id: "pay-1",
  status: "PAID",
  purpose: "RENEWAL",
  billingPeriod: "MONTHLY",
  amountCents: 80000,
  maskedPan: "xxxx-4242",
  method: "card",
  paidAt: "2026-10-01T10:00:00.000Z",
  createdAt: "2026-10-01T09:59:00.000Z",
  plan: { type: "PRO", name: "Pro" },
} as unknown as Payments[number];

const member = (id: string, name: string, pending: boolean) =>
  ({ id, pending, user: { id: `u-${id}`, name, email: `${id}@test.local` } }) as unknown as Team[number];

describe("BillingPayments", () => {
  it("lists each payment with its card and the total paid", () => {
    const html = render(<BillingPayments payments={[payment]} paidCents={80000} />);
    expect(html).toContain("Payments");
    expect(html).toContain("4242");
    expect(html).toContain("paid so far");
  });

  it("says so when there are no payments", () => {
    const html = render(<BillingPayments payments={[]} paidCents={0} />);
    expect(html).not.toContain("paid so far");
    expect(html).not.toContain("<table");
  });
});

describe("TeamSidebar", () => {
  it("shows the seats used and who has not signed in yet", () => {
    const waiting = member("m2", "Waiting Member", true);
    const html = render(
      <TeamSidebar
        team={[member("m1", "Active Owner", false), waiting]}
        pending={[waiting]}
        seats={3}
        planName="Pro"
        pendingOwnerEmail="owner@test.local"
      />
    );
    expect(html).toContain("2 of 3 on Pro");
    expect(html).toContain("owner@test.local");
    expect(html).toContain("Waiting Member");
  });

  it("leaves out the seats when the plan has no seat count", () => {
    const html = render(<TeamSidebar team={[]} pending={[]} seats={null} planName="Pro" pendingOwnerEmail={null} />);
    expect(html).not.toContain("Seats");
  });
});
