"use client";

import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, Car, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

/** Revenue metrics from the dashboard repository, via getAnalytics(). */
export type RevenueMetrics = {
  totalValue: number;
  averagePrice: number;
  addedThisMonth: number;
  addedLastMonth: number;
};

/** Conversion metrics from getConversionFunnel(), with its derived rates. */
export type ConversionFunnelData = {
  total: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  confirmedRate: number;
  completedRate: number;
};

// Helper for animated numbers
const AnimatedNumber = ({
  value,
  formatter = (v: number) => v.toString(),
}: {
  value: number;
  formatter?: (v: number) => string;
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const currentValueRef = useRef(0);

  useEffect(() => {
    let startTime: number | undefined;
    let rafId: number | undefined;
    const duration = 1000; // 1 second animation
    const startValue = currentValueRef.current;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function (easeOutQuart)
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (value - startValue) * easeProgress;
      
      currentValueRef.current = currentValue;
      setDisplayValue(currentValue);

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        currentValueRef.current = value;
        setDisplayValue(value);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [value]);

  return <span>{formatter(displayValue)}</span>;
};

const TrendBadge = ({ value, label = "" }: { value: number; label?: string }) => {
  const isPositive = value >= 0;
  return (
    <div className={cn(
      "flex items-center text-xs font-medium px-2 py-0.5 rounded-full",
      isPositive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    )}>
      {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1 rotate-180" />}
      {Math.abs(value)}% {label}
    </div>
  );
};

const AnalyticsCards = ({
  revenue,
  conversionFunnel,
}: {
  revenue: RevenueMetrics | null | undefined;
  conversionFunnel: ConversionFunnelData | null;
}) => {
  // Calculate inventory growth trend
  const lastMonth = revenue?.addedLastMonth || 0;
  const thisMonth = revenue?.addedThisMonth || 0;
  let inventoryTrend = 0;
  if (lastMonth > 0) {
    inventoryTrend = Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
  } else if (thisMonth > 0) {
    inventoryTrend = 100; // infinite growth if last month was 0 but this month is > 0
  }

  // BUG (surfaced by this conversion, NOT fixed here): AutoMe prices are EGP,
  // but these two cards format them as USD, so "Total Inventory Value" and
  // "Average Car Price" render a dollar sign against Egyptian-pound figures.
  // Changing the currency changes what every dealer sees, so it belongs in its
  // own commit alongside the other price formatters.
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const cards = [
    {
      title: "Total Inventory Value",
      value: revenue?.totalValue || 0,
      formatter: formatCurrency,
      icon: DollarSign,
      color: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      title: "Average Car Price",
      value: revenue?.averagePrice || 0,
      formatter: formatCurrency,
      icon: TrendingUp,
      color: "from-emerald-500 to-emerald-600",
      iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    {
      title: "Conversion Rate",
      value: conversionFunnel?.confirmedRate || 0,
      formatter: (v: number) => `${v.toFixed(1)}%`,
      icon: Percent,
      color: "from-purple-500 to-purple-600",
      iconBg: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      description: "Requests to confirmed"
    },
    {
      title: "Cars Added (This Month)",
      value: revenue?.addedThisMonth || 0,
      formatter: (v: number) => Math.round(v).toString(),
      icon: Car,
      color: "from-amber-500 to-amber-600",
      iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
      trend: inventoryTrend
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => (
        <Card key={idx} className="overflow-hidden border-none shadow-sm">
          <CardContent className="p-6 relative">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold tracking-tight text-foreground">
                    <AnimatedNumber value={card.value} formatter={card.formatter} />
                  </h3>
                </div>
              </div>
              <div className={cn("p-2.5 rounded-xl", card.iconBg)}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
            
            <div className="mt-4 flex items-center text-sm">
              {card.trend !== undefined ? (
                <TrendBadge value={card.trend} label="vs last month" />
              ) : (
                <span className="text-muted-foreground">{card.description || "Overall"}</span>
              )}
            </div>
            
            {/* Decorative background gradient line */}
            <div className={cn("absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r", card.color)} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AnalyticsCards;
