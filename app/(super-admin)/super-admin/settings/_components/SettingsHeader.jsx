import { Settings } from "lucide-react";

export default function SettingsHeader() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
        <Settings className="h-8 w-8" />
        Platform Settings
      </h1>
      <p className="text-muted-foreground">
        Configure global platform settings and defaults
      </p>
    </div>
  );
}
