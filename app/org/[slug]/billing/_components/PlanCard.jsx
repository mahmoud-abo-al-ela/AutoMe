import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { formatPrice, getFeatures } from "./_lib/plan-display";

export default function PlanCard({
  plan,
  config,
  isCurrent,
  isPro,
  displayPrice,
  savings,
  billingCycle,
  isOwner,
  onSelect,
}) {
  const Icon = config.icon;

  return (
    <Card
      className={`relative transition-all duration-300 hover:shadow-lg mt-6 min-w-[280px] snap-center ${isCurrent ? "ring-2 ring-green-600 shadow-md" : config.border
        } ${isPro && !isCurrent ? "md:scale-105 md:z-10" : ""}`}
    >
      {config.badge && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
          <Badge className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1">
            {config.badge}
          </Badge>
        </div>
      )}
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
          <Badge className="bg-green-600 hover:bg-green-700 text-white px-3 py-1">
            Current Plan
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-2 rounded-lg bg-background/80 ${config.color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl">{plan.name}</CardTitle>
        </div>
        <div className="pt-2">
          {displayPrice === 0 ? (
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">Free</span>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">
                  {formatPrice(displayPrice)}
                </span>
                <span className="text-muted-foreground text-sm">
                  /{billingCycle === "yearly" ? "year" : "month"}
                </span>
              </div>
              {billingCycle === "yearly" && savings > 0 && (
                <div className="mt-1">
                  <Badge variant="secondary" className="text-xs">
                    Save {savings}%
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <ul className="space-y-2.5">
          {getFeatures(plan).map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              {feature.included ? (
                <Check className="h-4 w-4 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
              )}
              <span
                className={feature.included ? "" : "text-muted-foreground"}
              >
                {feature.name}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        {isOwner ? (
          isCurrent ? (
            <Button className="w-full" variant="outline" disabled>
              <Check className="h-4 w-4 mr-2" />
              Current Plan
            </Button>
          ) : (
            <Button
              className="cursor-pointer w-full"
              variant={isPro ? "default" : "outline"}
              onClick={() => onSelect(plan)}
            >
              Switch to {plan.name}
            </Button>
          )
        ) : (
          <Button className="w-full" variant="outline" disabled>
            Only Owner Can Change
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
