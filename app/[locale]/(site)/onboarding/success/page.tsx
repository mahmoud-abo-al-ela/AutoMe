import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { checkUser } from "@/lib/checkUser";
import { confirmSignupPayment } from "@/actions/onboarding";
import { PaymentConfirming } from "@/components/billing/PaymentConfirming";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
    resolveActionError,
    type ActionError,
    type ErrorTranslator,
} from "@/lib/utils/error-messages";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { formatNumber } from "@/lib/utils/number";

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

/**
 * Where Paymob returns the buyer after a sign-up payment. `ref` is our Payment
 * id; the other parameters Paymob appends are unsigned and never read. The
 * dealership exists once the payment settles, through Paymob's callback or
 * through confirmSignupPayment asking Paymob here.
 */
export default async function OnboardingSuccessPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ ref?: string }>;
}) {
    const { locale } = await params;
    const { ref } = await searchParams;

    if (!ref) {
        redirect({ href: "/onboarding", locale });
    }

    const user = await checkUser();
    if (!user) {
        redirect({ href: "/sign-in", locale });
    }

    const result = await confirmSignupPayment(ref);
    if (!result.success) return <FailurePage error={result.error} />;

    const { state, organizationSlug } = result.data;
    if (state === "paid" && organizationSlug) {
        return (
            <SuccessPage
                orgSlug={organizationSlug}
                dashboardUrl={`/org/${organizationSlug}/dashboard`}
            />
        );
    }
    if (state === "failed") return <DeclinedPage />;

    const t = await getTranslations("onboarding.success.confirming");
    return (
        <PaymentConfirming
            title={t("title")}
            body={t("body")}
            slowBody={t("slow")}
            checkAgain={t("checkAgain")}
        />
    );
}

/** The card was declined or the checkout abandoned: nothing was charged. */
async function DeclinedPage() {
    const t = await getTranslations("onboarding.success.declined");

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
                <CardContent className="pt-6 text-center space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <h1 className="text-xl font-semibold">{t("title")}</h1>
                    <p className="text-muted-foreground text-sm">{t("body")}</p>
                    {/* Onboarding resumes the saved session, so nothing is re-typed. */}
                    <Link
                        href="/onboarding"
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        {t("retry")}
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}

async function FailurePage({ error }: { error: ActionError }) {
    const t = await getTranslations("onboarding.success.failed");
    const tErrors = await getTranslations("errors");
    const locale = (await getLocale()) as Locale;

    // The action names its error with a key; the English `message` it also
    // carries is only the developer-facing fallback.
    const message = resolveActionError(
        tErrors as unknown as ErrorTranslator,
        error,
        t("body"),
        (n) => formatNumber(n, locale)
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
