"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ArrowRightCircle, Ban } from "lucide-react";

const FunnelStage = ({ title, count, percentage, colorClass, isLast, icon: Icon, subtitle }) => (
  <div className="relative group">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${colorClass.text}`} />
        <span className="font-medium">{title}</span>
      </div>
      <div className="text-right">
        <span className="text-xl font-bold">{count}</span>
        {percentage !== null && (
          <span className="text-sm text-muted-foreground ml-2 hidden sm:inline-block">
            ({percentage.toFixed(1)}%{subtitle ? ` ${subtitle}` : ''})
          </span>
        )}
      </div>
    </div>
    
    <Progress 
      value={percentage !== null ? percentage : 100} 
      className={`h-3 ${colorClass.track}`}
      indicatorClassName={colorClass.bg}
    />
    
    {!isLast && (
      <div className="absolute -bottom-6 left-6 h-6 border-l-2 border-dashed border-border" />
    )}
  </div>
);

const ConversionFunnel = ({ funnel }) => {
  if (!funnel) return null;

  // Colors for each stage
  const stages = [
    {
      title: "Total Requests",
      count: funnel.total,
      percentage: 100,
      icon: ArrowRightCircle,
      color: { bg: "bg-blue-500", text: "text-blue-500", track: "bg-blue-100 dark:bg-blue-950" }
    },
    {
      title: "Confirmed Test Drives",
      count: funnel.confirmed,
      percentage: funnel.confirmedRate,
      icon: CheckCircle2,
      color: { bg: "bg-emerald-500", text: "text-emerald-500", track: "bg-emerald-100 dark:bg-emerald-950" },
      subtitle: "of total"
    },
    {
      title: "Completed",
      count: funnel.completed,
      percentage: funnel.completedRate,
      icon: CheckCircle2,
      color: { bg: "bg-green-600", text: "text-green-600", track: "bg-green-100 dark:bg-green-950" },
      subtitle: "of confirmed"
    }
  ];

  const cancelledRate = funnel.total > 0 ? (funnel.cancelled / funnel.total) * 100 : 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Test Drive Funnel</CardTitle>
        <CardDescription>Conversion rates across the test drive pipeline</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 pt-4">
        {stages.map((stage, idx) => (
          <FunnelStage 
            key={idx}
            title={stage.title}
            count={stage.count}
            percentage={stage.percentage}
            colorClass={stage.color}
            icon={stage.icon}
            subtitle={stage.subtitle}
            isLast={idx === stages.length - 1}
          />
        ))}

        <div className="mt-8 pt-6 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Ban className="h-4 w-4 text-red-500" />
              <span>Cancelled</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{funnel.cancelled}</span>
              <span className="text-muted-foreground">({cancelledRate.toFixed(1)}%)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversionFunnel;
