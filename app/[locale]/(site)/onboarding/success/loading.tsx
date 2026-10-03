"use client";

import { useTranslations } from "next-intl";
import { RoadLoader } from "@/components/brand";

// A client component on purpose: a Suspense fallback has to render
// synchronously, and the server-side `getTranslations` is async. The wait has
// a reason worth naming — the payment is being confirmed — so the loader says
// that instead of its generic caption.
export default function OnboardingSuccessLoading() {
    const t = useTranslations("onboarding.success.pending");

    return <RoadLoader label={t("title")} description={t("body")} />;
}
