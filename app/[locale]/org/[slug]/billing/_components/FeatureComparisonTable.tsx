import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X } from "lucide-react";
import {
  PLAN_CONFIG,
  formatPrice,
  getAllFeatureNames,
  getFeatureLookup,
} from "./_lib/plan-display";
import type { BillingPlan } from "./_lib/billing-types";

export default function FeatureComparisonTable({
  plans,
  currentPlanId,
  billingCycle,
  isOwner,
  onSelectPlan,
}: {
  plans: BillingPlan[];
  /** undefined/null when the org has no subscription — i.e. free Starter. */
  currentPlanId: string | null | undefined;
  billingCycle: "monthly" | "yearly";
  isOwner: boolean;
  onSelectPlan: (plan: BillingPlan) => void;
}) {
  const allFeatures = getAllFeatureNames(plans);
  const getDisplayPrice = (plan: BillingPlan) =>
    billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

  return (
    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
      <div className="min-w-[600px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px] sticky start-0 bg-background z-10">
                Feature
              </TableHead>
              {plans.map((plan) => {
                const isCurrent =
                  plan.id === currentPlanId ||
                  (!currentPlanId && plan.type === "STARTER");
                const config = PLAN_CONFIG[plan.type] || PLAN_CONFIG.STARTER;
                const Icon = config.icon;

                return (
                  <TableHead key={plan.id} className="text-center min-w-[150px]">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        <span className="font-semibold">{plan.name}</span>
                      </div>
                      <span className="text-xs font-normal text-muted-foreground">
                        {getDisplayPrice(plan) === 0
                          ? "Free"
                          : `${formatPrice(getDisplayPrice(plan))}/${billingCycle === "yearly" ? "yr" : "mo"
                          }`}
                      </span>
                      {isCurrent && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-green-500 text-green-600"
                        >
                          Current
                        </Badge>
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {allFeatures.map((featureName) => (
              <TableRow key={featureName}>
                <TableCell className="font-medium text-sm sticky start-0 bg-background z-10">
                  {featureName}
                </TableCell>
                {plans.map((plan) => {
                  const lookup = getFeatureLookup(plan);
                  const included = lookup[featureName] ?? false;

                  return (
                    <TableCell key={plan.id} className="text-center">
                      {included ? (
                        <Check className="h-4 w-4 text-green-600 dark:text-green-500 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            {/* Action row */}
            <TableRow>
              <TableCell className="sticky start-0 bg-background z-10" />
              {plans.map((plan) => {
                const isCurrent =
                  plan.id === currentPlanId ||
                  (!currentPlanId && plan.type === "STARTER");
                const isPro = plan.type === "PRO";

                return (
                  <TableCell key={plan.id} className="text-center">
                    {isOwner ? (
                      isCurrent ? (
                        <Button size="sm" variant="outline" disabled>
                          <Check className="h-3 w-3 me-1" />
                          Current
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant={isPro ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => onSelectPlan(plan)}
                        >
                          Select
                        </Button>
                      )
                    ) : (
                      <Button size="sm" variant="outline" disabled>
                        Owner Only
                      </Button>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
