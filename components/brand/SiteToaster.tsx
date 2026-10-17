import { Toaster } from "sonner";
import { localeDirection, type Locale } from "@/i18n/routing";

export function SiteToaster({
  locale,
  position = "bottom-right",
  mobileOffset,
}: {
  locale: Locale;
  position?: "bottom-right" | "top-right";
  mobileOffset?: { bottom?: number; top?: number };
}) {
  return (
    <Toaster
      position={position}
      dir={localeDirection[locale]}
      mobileOffset={mobileOffset}
      toastOptions={{
        classNames: {
          toast: "!rounded-control !border-0 !bg-inverse !text-inverse-foreground !shadow-float !font-sans",
          description: "!text-inverse-foreground/75",
          actionButton: "!bg-transparent !text-marker !font-semibold",
          cancelButton: "!bg-transparent !text-inverse-foreground/70",
          success: "[&_[data-icon]]:!text-marker",
          error: "[&_[data-icon]]:!text-[#ff8c7a]",
          info: "[&_[data-icon]]:!text-marker",
        },
      }}
    />
  );
}
