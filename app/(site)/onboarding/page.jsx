import { checkUser } from "@/lib/checkUser";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import OnboardingWizard from "./_components/OnboardingWizard";

async function getPlans() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });
  return plans;
}

export default async function OnboardingPage() {
  const user = await checkUser();

  if (!user) {
    redirect("/sign-in?redirect=/onboarding");
  }

  // Check if user already owns an organization
  const existingOrg = await prisma.membership.findFirst({
    where: {
      userId: user.id,
      role: "OWNER",
    },
    include: {
      organization: true,
    },
  });

  if (existingOrg) {
    // Redirect to their org's admin dashboard
    const orgSlug = existingOrg.organization.slug;
    redirect(`/org/${orgSlug}/admin`);
  }

  const plans = await getPlans();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container max-w-4xl py-12 px-4">
        <OnboardingWizard user={user} plans={plans} />
      </div>
    </div>
  );
}
