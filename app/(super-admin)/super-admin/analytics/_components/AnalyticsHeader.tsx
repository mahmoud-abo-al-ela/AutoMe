import { BarChart3 } from "lucide-react";

export default function AnalyticsHeader() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
        <BarChart3 className="h-8 w-8" />
        Platform Analytics
      </h1>
      <p className="text-muted-foreground">
        Monitor platform performance and growth metrics
      </p>
    </div>
  );
}
