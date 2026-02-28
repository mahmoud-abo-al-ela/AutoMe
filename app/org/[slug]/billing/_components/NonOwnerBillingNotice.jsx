"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert, Mail, User } from "lucide-react";

/**
 * Notice displayed to non-owner members on the billing page.
 * Shows a clear message that billing management requires owner access,
 * and provides the owner's contact information.
 */
export default function NonOwnerBillingNotice({ ownerName, ownerEmail }) {
    return (
        <Alert className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/10 dark:border-blue-800">
            <ShieldAlert className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800 dark:text-blue-400">
                View-Only Access
            </AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-300">
                <p>
                    You can view the current plan and usage, but only the organization
                    owner can manage billing, change plans, or update payment methods.
                </p>

                {(ownerName || ownerEmail) && (
                    <Card className="mt-3 bg-white/60 dark:bg-gray-900/40 border-blue-200 dark:border-blue-800">
                        <CardContent className="py-3 px-4">
                            <p className="text-xs font-medium text-blue-800 dark:text-blue-400 mb-2">
                                Organization Owner
                            </p>
                            <div className="flex flex-col gap-1">
                                {ownerName && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <User className="h-3.5 w-3.5 text-blue-500" />
                                        <span>{ownerName}</span>
                                    </div>
                                )}
                                {ownerEmail && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="h-3.5 w-3.5 text-blue-500" />
                                        <a
                                            href={`mailto:${ownerEmail}?subject=Billing%20Request`}
                                            className="text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            {ownerEmail}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </AlertDescription>
        </Alert>
    );
}
