import { Toaster } from "sonner";
import { localeDirection, type Locale } from "@/i18n/routing";

/**
 * Toasts in the site's design (Figma: Toast): asphalt, one action, icon and
 * words. Shared by the public site and the dealer dashboard.
 *
 * `mobileOffset` lifts them above whatever sits on a phone's bottom edge —
 * the public site's tab bar (84px incl. safe area).
 */
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
