"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// A client component on purpose: a Suspense fallback has to render
// synchronously, and the server-side `getTranslations` is async.
export default function OnboardingSuccessLoading() {
    const t = useTranslations("onboarding.success.pending");

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
                <CardContent className="pt-6 text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <h1 className="text-xl font-semibold">{t("title")}</h1>
                    <p className="text-muted-foreground text-sm">{t("body")}</p>
                </CardContent>
            </Card>
        </div>
    );
}
