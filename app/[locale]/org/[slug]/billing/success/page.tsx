import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { planKeyFor } from "@/components/Pricing/pricing-plans";
import { checkUser } from "@/lib/checkUser";
import { getOrganizationBySlug } from "@/lib/getOrganization";
import { confirmBillingPayment } from "@/actions/billing";
import { PaymentConfirming } from "@/components/billing/PaymentConfirming";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { AutoReturn } from "@/components/billing/AutoReturn";
import { formatDate } from "@/lib/utils/datetime";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

/**
 * Where Paymob returns the owner after paying for an upgrade or a renewal.
 * `ref` is our Payment id; the rest of Paymob's query string is unsigned and
 * never read. confirmBillingPayment answers only for this dealership's own
 * payment, to its owner, and settles it from Paymob if the callback is late.
 */
export default async function BillingSuccessPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ ref?: string }>;
}) {
    const { slug } = await params;
    const { ref } = await searchParams;
    const locale = (await getLocale()) as Locale;
    const billingPath = `/org/${slug}/billing`;

    if (!ref) redirect({ href: billingPath, locale });

    const user = await checkUser();
    if (!user) redirect({ href: "/sign-in", locale });

    const organization = await getOrganizationBySlug(slug);
    if (!organization) redirect({ href: "/", locale });

    const result = await confirmBillingPayment(organization.id, ref);
    // Not this owner's payment, or not this dealership's: back to billing.
    if (!result.success) redirect({ href: billingPath, locale });

    const t = await getTranslations("org.billing.success");
    const { state, purpose, plan, periodEnd } = result.data;

    if (state === "pending") {
        return (
            <PaymentConfirming
                title={t("confirming.title")}
                body={t("confirming.body")}
                slowBody={t("confirming.slow")}
                checkAgain={t("confirming.checkAgain")}
            />
        );
    }

    if (state === "failed") {
        return (
            <ResultCard
                icon={<AlertCircle className="h-16 w-16 text-destructive" />}
                title={t("declined.title")}
                body={t("declined.body")}
                back={t("back")}
                href={billingPath}
            />
        );
    }

    const tPlans = await getTranslations("plans");
    const planKey = planKeyFor(plan.type);
    const planName = planKey ? tPlans(`plans.${planKey}.name`) : plan.name;
    const until = periodEnd ? formatDate(periodEnd, locale, { month: "long" }) : "";

    return (
        <ResultCard
            icon={<CheckCircle2 className="h-16 w-16 text-green-500" />}
            title={purpose === "UPGRADE" ? t("upgradedTitle", { plan: planName }) : t("renewedTitle")}
            body={
                purpose === "UPGRADE"
                    ? t("upgradedBody", { date: until })
                    : t("renewedBody", { plan: planName, date: until })
            }
            back={t("back")}
            href={billingPath}
            // A paid result has nothing left to do here: back to billing.
            autoReturn={t("returning")}
        />
    );
}

function ResultCard({
    icon,
    title,
    body,
    back,
    href,
    autoReturn,
}: {
    icon: React.ReactNode;
    title: string;
    body: string;
    back: string;
    href: string;
    /** When set, the page goes back to `href` on its own and says so. */
    autoReturn?: string;
}) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">{icon}</div>
                    <CardTitle className="text-2xl">{title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground">{body}</p>
                    {/* Styled link, not <Button asChild>: on a server page the
                        link can reach Radix Slot 1.2.2 as a lazy element,
                        which it renders as nothing — the button vanished. */}
                    <Link href={href} className={buttonVariants({ className: "w-full" })}>
                        {back}
                    </Link>
                    {autoReturn && <AutoReturn href={href} label={autoReturn} />}
                </CardContent>
            </Card>
        </div>
    );
}
