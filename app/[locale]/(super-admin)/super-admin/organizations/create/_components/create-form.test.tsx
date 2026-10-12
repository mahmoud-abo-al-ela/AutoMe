import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import superAdmin from "@/messages/en/superAdmin.json";
import plans from "@/messages/en/plans.json";

// The hook's module reaches the server actions and the router; these components only need its types and STEPS.
vi.mock("@/actions/super-admin", () => ({ checkDealershipSlug: vi.fn(), checkOwnerEmail: vi.fn(), createOrganization: vi.fn() }));
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), Link: () => null }));

import { PlanStep } from "./PlanStep";
import { StepIndicator } from "./StepIndicator";
import type { CreateDealershipState, Plan } from "./use-create-dealership";

/**
 * The pieces the add-a-dealership form was split into render from the props
 * the form's hook hands them.
 */

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <NextIntlClientProvider locale="en" messages={{ superAdmin, plans }} timeZone="Africa/Cairo">
      {node}
    </NextIntlClientProvider>
  );

const values: CreateDealershipState["values"] = {
  name: "Nile Motors",
  slug: "nile-motors",
  description: "",
  region: "",
  city: "",
  address: "12 Tahrir St",
  ownerEmail: "owner@test.local",
  phone: "",
  email: "",
  website: "",
  planId: "pro",
};

const PLANS: Plan[] = [
  { id: "starter", type: "STARTER", name: "Starter", monthlyPrice: 0, maxCars: 5, maxMembers: 3, maxImagesPerCar: 5 },
  { id: "pro", type: "PRO", name: "Pro", monthlyPrice: 80000, maxCars: 50, maxMembers: -1, maxImagesPerCar: 10 },
];

const noop = () => {};

describe("StepIndicator", () => {
  it("names the step in progress and sums up the steps done", () => {
    const html = render(<StepIndicator step={1} values={values} place={() => "Cairo"} goTo={noop} />);
    expect(html).toContain('aria-current="step"');
    expect(html).toContain("Nile Motors, Cairo");
  });
});

describe("PlanStep", () => {
  it("marks the chosen plan and lists every answer to check", () => {
    const html = render(
      <PlanStep
        plans={PLANS}
        values={values}
        owner={{ checking: false, result: { hasAccount: true, name: "Owner" } } as CreateDealershipState["owner"]}
        set={noop}
        goTo={noop}
        place={() => "Cairo"}
        planName={(plan) => plan.name}
      />
    );
    expect(html).toMatch(/value="pro"[^>]*checked|checked[^>]*value="pro"/);
    expect(html).toContain("Nile Motors");
    expect(html).toContain("owner@test.local");
  });
});
