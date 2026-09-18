import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { checkUser } from "@/lib/checkUser";
import { createOrganizationAfterCheckout } from "@/actions/onboarding";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
    resolveActionError,
    type ActionError,
    type ErrorTranslator,
} from "@/lib/utils/error-messages";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({
        locale,
        namespace: "onboarding.success.meta",
    });

    return { title: t("title"), description: t("description") };
}

/** The four things a new dealer is pointed at, in the order they matter. */
const NEXT_STEPS = ["listCar", "inviteTeam", "brand", "hours"] as const;

export default async function OnboardingSuccessPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ session_id?: string }>;
}) {
    const { locale } = await params;

    const { session_id } = await searchParams;

    // Validate session_id is present
    if (!session_id) {
        redirect({ href: "/onboarding?error=missing_session", locale });
    }

    // Ensure user is authenticated
    const user = await checkUser();
    if (!user) {
        redirect({ href: "/sign-in", locale });
    }

    // Create the organization using the checkout session
    const result = await createOrganizationAfterCheckout(session_id);

    if (result.success) {
        // Two success shapes: the idempotent path carries a ready-made
        // `redirect`, the freshly-created path only the organization.
        const data = result.data;
        return (
            <SuccessPage
                orgSlug={data.organization.slug}
                dashboardUrl={
                    "redirect" in data
                        ? data.redirect
                        : `/org/${data.organization.slug}/dashboard`
                }
            />
        );
    }

    return <FailurePage error={result.error} />;
}

async function FailurePage({ error }: { error: ActionError }) {
    const t = await getTranslations("onboarding.success.failed");
    const tErrors = await getTranslations("errors");

    // The action names its error with a key; the English `message` it also
    // carries is only the developer-facing fallback.
    const message = resolveActionError(
        tErrors as unknown as ErrorTranslator,
        error,
        t("body")
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
                <CardContent className="pt-6 text-center space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <h1 className="text-xl font-semibold">{t("title")}</h1>
                    <p className="text-muted-foreground text-sm">{message}</p>
                    <p className="text-muted-foreground text-sm">{t("paid")}</p>
                    <div className="flex flex-col gap-2 pt-2">
                        <Link
                            href="/onboarding"
                            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            {t("retry")}
                        </Link>
                        <Link
                            href="mailto:support@autome.com"
                            className="text-sm text-muted-foreground hover:text-foreground underline"
                        >
                            {t("support")}
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

async function SuccessPage({
    orgSlug,
    dashboardUrl,
}: {
    orgSlug?: string;
    dashboardUrl: string;
}) {
    const t = await getTranslations("onboarding.success");
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
                        {t("title")}
                    </h1>
                    <p className="text-lg text-gray-600">{t("subtitle")}</p>
                </div>

                {/* Action Buttons */}
                <Card className="shadow-lg border-0">
                    <CardContent className="pt-6 space-y-4">
                        <h2 className="text-lg font-semibold text-center text-gray-800">
                            {t("nextPrompt")}
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link
                                href={dashboardUrl}
                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                            >
                                {t("dashboard")}
                                <ArrowRight className="h-5 w-5 rtl:rotate-180" />
                            </Link>
                            <Link
                                href={siteUrl}
                                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border-2 border-gray-200 hover:border-gray-300 bg-white text-gray-700 px-6 py-3 text-base font-semibold hover:bg-gray-50 transition-all duration-300"
                            >
                                {t("viewSite")}
                                {/* Not mirrored: the box-and-arrow means "opens
                                    elsewhere", not a direction of travel. */}
                                <ExternalLink className="h-4 w-4" />
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Next Steps */}
                <Card className="shadow-md border-0 bg-white/80">
                    <CardContent className="pt-6">
                        <h3 className="font-semibold text-gray-800 mb-3">
                            {t("nextStepsTitle")}
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            {NEXT_STEPS.map((step) => (
                                <li key={step} className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                    <span>{t(`nextSteps.${step}`)}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
