import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function OnboardingSuccessLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
                <CardContent className="pt-6 text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <h1 className="text-xl font-semibold">Completing Your Setup</h1>
                    <p className="text-muted-foreground text-sm">
                        We&apos;re setting up your dealership. This will only take a
                        moment...
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
