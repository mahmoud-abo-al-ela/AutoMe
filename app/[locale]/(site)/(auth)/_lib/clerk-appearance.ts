import type { ComponentProps } from "react";
import type { SignIn } from "@clerk/nextjs";

type ClerkAppearance = NonNullable<ComponentProps<typeof SignIn>["appearance"]>;

export const clerkAppearance = {
  variables: {
    colorPrimary: "#1d4e9e",
    colorForeground: "#17181b",
    colorMutedForeground: "#5c5549",
    colorBackground: "#fffcf6",
    colorInput: "#ffffff",
    colorInputForeground: "#17181b",
    colorNeutral: "#17181b",
    colorDanger: "#c2452d",
    colorSuccess: "#1f7a5a",
    borderRadius: "12px",
    fontFamily: "inherit",
    fontFamilyButtons: "inherit",
  },
  elements: {
    // Important like the rest: without it Clerk's own width won, each card
    // shrank to its content, and sign-in came out narrower than sign-up.
    rootBox: "!w-full !max-w-[440px]",
    cardBox: "!w-full !rounded-sheet !border !border-border !shadow-float",
    card: "!border-0 !shadow-none !px-6 !py-8 sm:!px-8",
    headerTitle: "!text-h2 !font-extrabold",
    headerSubtitle: "!text-caption !text-muted-foreground",
    socialButtonsBlockButton: "!h-11 !border-2 !border-border-strong !bg-field !shadow-none hover:!bg-muted",
    socialButtonsBlockButtonText: "!text-caption !font-semibold",
    dividerLine: "!bg-border",
    formFieldLabel: "!text-caption !font-semibold",
    formFieldInput: "!h-11 !text-body",
    formButtonPrimary:
      "!h-12 !border-2 !border-border-strong !bg-marker !bg-none !text-body !font-semibold !text-marker-foreground !shadow-key hover:!bg-marker-hover active:!translate-y-0.5 active:!shadow-key-pressed",
    footer: "!bg-muted !bg-none",
    footerActionText: "!text-caption",
    footerActionLink: "!text-caption !font-semibold !text-primary",
    formFieldAction: "!font-semibold !text-primary",
    identityPreviewEditButton: "!text-primary",
    formResendCodeLink: "!font-semibold !text-primary",
  },
} satisfies ClerkAppearance;
