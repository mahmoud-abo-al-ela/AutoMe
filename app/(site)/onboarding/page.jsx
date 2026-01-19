import { checkUser } from "@/lib/checkUser";
import { redirect } from "next/navigation";
import { getOnboardingData } from "@/lib/services/onboarding";
import OnboardingWizard from "./_components/OnboardingWizard";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function OnboardingLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container max-w-4xl py-12 px-4">
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <Skeleton className="h-9 w-64 mx-auto" />
            <Skeleton className="h-5 w-96 mx-auto" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-2 w-full" />
            <div className="flex justify-between">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-10 rounded-full" />
              ))}
            </div>
          </div>
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default async function OnboardingPage() {
  const user = await checkUser();

  // If no user, middleware will handle redirect
  if (!user) {
    return null;
  }

  const { plans, existingOwnership } = await getOnboardingData(user.id);

  // Redirect if user already owns an organization
  if (existingOwnership) {
    const orgSlug = existingOwnership.organization.slug;
    redirect(`/org/${orgSlug}/dashboard`);
  }

  return (
    <Suspense fallback={<OnboardingLoader />}>
      <div className="bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto py-12 pt-20 px-4">
          <OnboardingWizard user={user} plans={plans} />
        </div>
      </div>
    </Suspense>
  );
}
