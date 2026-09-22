import { Skeleton } from "@/components/ui/skeleton";
import {
    Card,
    CardContent,
    CardHeader,
    CardFooter,
} from "@/components/ui/card";

function BillingHeaderSkeleton() {
    return (
        <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
                <Skeleton className="h-7 w-52" />
                <Skeleton className="h-4 w-80" />
            </div>
        </div>
    );
}

function CurrentPlanSkeleton() {
    return (
        <div className="space-y-4">
            {/* Status banner skeleton */}
            <Skeleton className="h-20 w-full rounded-lg" />

            {/* Main plan card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-6 w-28" />
                                <Skeleton className="h-5 w-16 rounded-full" />
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                            <Skeleton className="h-4 w-48" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-9 w-40" />
                            <Skeleton className="h-9 w-32" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-4 w-4" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                    <Skeleton className="h-4 w-12" />
                                </div>
                                <Skeleton className="h-2 w-full rounded-full" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function PaymentMethodSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-4 w-28" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-18 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

function PlanComparisonSkeleton() {
    return (
        <div className="space-y-6">
            {/* Heading */}
            <div className="text-center space-y-4">
                <div className="space-y-2 flex flex-col items-center">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-72" />
                </div>
                {/* Billing toggle */}
                <div className="flex justify-center">
                    <Skeleton className="h-10 w-56 rounded-lg" />
                </div>
            </div>

            {/* Plan cards grid */}
            <div className="grid gap-6 md:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="mt-6">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Skeleton className="h-9 w-9 rounded-lg" />
                                <Skeleton className="h-6 w-24" />
                            </div>
                            <div className="pt-2">
                                <Skeleton className="h-10 w-20" />
                                <Skeleton className="h-3 w-16 mt-1" />
                            </div>
                        </CardHeader>
                        <CardContent className="pb-4">
                            <div className="space-y-2.5">
                                {[...Array(6)].map((_, j) => (
                                    <div key={j} className="flex items-center gap-2">
                                        <Skeleton className="h-4 w-4 flex-shrink-0" />
                                        <Skeleton className="h-4 w-full" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Skeleton className="h-9 w-full" />
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* Footer text */}
            <div className="flex justify-center">
                <Skeleton className="h-4 w-96" />
            </div>
        </div>
    );
}

function InvoiceHistorySkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-4 w-64 mt-1" />
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between py-3">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-48" />
                            </div>
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-5 w-16" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-8 w-8" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function BillingHistorySkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-6 w-28" />
                </div>
                <Skeleton className="h-4 w-72 mt-1" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Table header */}
                    <div className="grid grid-cols-4 gap-4 pb-2 border-b">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-8" />
                    </div>
                    {/* Table rows */}
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="grid grid-cols-4 gap-4 py-2">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-5 w-20 rounded-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default function BillingLoading() {
    return (
        <div className="space-y-8">
            <BillingHeaderSkeleton />
            <CurrentPlanSkeleton />
            <PaymentMethodSkeleton />
            <PlanComparisonSkeleton />
            <InvoiceHistorySkeleton />
            <BillingHistorySkeleton />
        </div>
    );
}
