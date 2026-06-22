import { redirect } from "next/navigation";
import { checkUser } from "@/lib/checkUser";
import { createOrganizationAfterCheckout } from "@/actions/onboarding";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export const metadata = {
    title: "Setup Complete | AutoMe",
    description: "Your dealership has been set up successfully.",
};

export default async function OnboardingSuccessPage({ searchParams }) {
    const { session_id } = await searchParams;

    // Validate session_id is present
    if (!session_id) {
        redirect("/onboarding?error=missing_session");
    }

    // Ensure user is authenticated
    const user = await checkUser();
    if (!user) {
        redirect("/sign-in");
    }

    // Create the organization using the checkout session
    const result = await createOrganizationAfterCheckout(session_id);

    // If org was already created (idempotency), show success with redirect link
    if (result.success && result.redirect) {
        return (
            <SuccessPage
                orgSlug={result.organization?.slug}
                dashboardUrl={result.redirect}
            />
        );
    }

    // If org was just created, show success page
    if (result.success && result.organization) {
        return (
            <SuccessPage
                orgSlug={result.organization.slug}
                dashboardUrl={`/org/${result.organization.slug}/dashboard`}
            />
        );
    }

    // If there was an error, show an error page
    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
                <CardContent className="pt-6 text-center space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <h1 className="text-xl font-semibold">Setup Failed</h1>
                    <p className="text-muted-foreground text-sm">
                        {result.error ||
                            "Something went wrong while setting up your dealership."}
                    </p>
                    <p className="text-muted-foreground text-sm">
                        Your payment was successful. Please try again or contact support if
                        the issue persists.
                    </p>
                    <div className="flex flex-col gap-2 pt-2">
                        <Link
                            href="/onboarding"
                            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            Return to Onboarding
                        </Link>
                        <Link
                            href="mailto:support@autome.com"
                            className="text-sm text-muted-foreground hover:text-foreground underline"
                        >
                            Contact Support
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function SuccessPage({ orgSlug, dashboardUrl }) {
    const siteUrl = orgSlug ? `/org/${orgSlug}` : "#";

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full space-y-6">
                {/* Success Header */}
                <div className="text-center space-y-4">
                    <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        🎉 You&apos;re All Set!
                    </h1>
                    <p className="text-lg text-gray-600">
                        Your dealership has been successfully created and your subscription
                        is active.
                    </p>
                </div>

                {/* Action Buttons */}
                <Card className="shadow-lg border-0">
                    <CardContent className="pt-6 space-y-4">
                        <h2 className="text-lg font-semibold text-center text-gray-800">
                            What would you like to do next?
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link
                                href={dashboardUrl}
                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                            >
                                Go to Dashboard
                                <ArrowRight className="h-5 w-5" />
                            </Link>
                            <Link
                                href={siteUrl}
                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border-2 border-gray-200 hover:border-gray-300 bg-white text-gray-700 px-6 py-3 text-base font-semibold hover:bg-gray-50 transition-all duration-300"
                            >
                                View Your Site
                                <ExternalLink className="h-4 w-4" />
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Next Steps */}
                <Card className="shadow-md border-0 bg-white/80">
                    <CardContent className="pt-6">
                        <h3 className="font-semibold text-gray-800 mb-3">
                            Recommended Next Steps
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <span>Add your first car listing to start attracting customers</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <span>Invite team members to help manage your dealership</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <span>Customize your dealership profile and branding</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <span>Review your working hours and contact information</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
