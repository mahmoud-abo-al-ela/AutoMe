"use client";

import {
  Check,
  X,
  MoreVertical,
  Pencil,
  Trash2,
  Building2,
  Car,
  Users,
  Image,
  Sparkles,
  MessageSquare,
  Zap,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

const planColors = {
  STARTER: "border-gray-200 dark:border-gray-700",
  PRO: "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800",
  ENTERPRISE: "border-purple-500 ring-2 ring-purple-200 dark:ring-purple-800",
};

export default function PlanCard({ plan, onEdit, onDelete }) {
  const features = plan.features || {};

  const allFeatures = [
    { key: "aiProcessing", label: "AI Processing", icon: Sparkles, enabled: features.aiProcessing?.enabled || false },
    { key: "chat", label: "Live Chat", icon: MessageSquare, enabled: features.chat || false },
    { key: "prioritySupport", label: "Priority Support", icon: Zap, enabled: features.prioritySupport || false },
  ];

  return (
    <Card className={`relative ${planColors[plan.type] || ""}`}>
      {plan.type === "PRO" && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-blue-500 hover:bg-blue-600">Most Popular</Badge>
        </div>
      )}
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{plan.name}</CardTitle>
            <CardDescription>
              <Badge variant="outline" className="mt-1">{plan.type}</Badge>
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(plan)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Plan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(plan)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Plan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-4">
          <span className="text-4xl font-bold">
            ${plan.monthlyPrice === 0 ? "0" : (plan.monthlyPrice / 100).toFixed(2)}
          </span>
          <span className="text-muted-foreground">/month</span>
          {plan.monthlyPrice > 0 && plan.yearlyPrice > 0 && (
            <div className="text-sm text-muted-foreground">
              or ${(plan.yearlyPrice / 100).toFixed(2)}/year (save{" "}
              {Math.round(
                (1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100
              )}
              %)
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Car className="h-4 w-4 text-muted-foreground" />
            <span>
              {plan.maxCars === -1 ? "Unlimited" : plan.maxCars} car listings
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              {plan.maxMembers === -1 ? "Unlimited" : plan.maxMembers} team members
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Image className="h-4 w-4 text-muted-foreground" />
            <span>{plan.maxImagesPerCar} images per car</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {plan.auditLogRetentionDays === null
                ? "Unlimited audit logs"
                : `${plan.auditLogRetentionDays} days audit logs`}
            </span>
          </div>
        </div>

        {allFeatures.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">Features</p>
              {allFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.key} className="flex items-center gap-2 text-sm">
                    {feature.enabled ? (
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                    )}
                    <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className={feature.enabled ? "" : "text-muted-foreground"}>{feature.label}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
      <CardFooter>
        <div className="w-full text-center">
          <Badge variant="outline" className="text-sm">
            <Building2 className="h-3 w-3 mr-1" />
            {plan.activeSubscriptions} active subscription
            {plan.activeSubscriptions !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardFooter>
    </Card>
  );
}
