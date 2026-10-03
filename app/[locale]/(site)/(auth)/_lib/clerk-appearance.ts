import type { ComponentProps } from "react";
import type { SignIn } from "@clerk/nextjs";

type ClerkAppearance = NonNullable<ComponentProps<typeof SignIn>["appearance"]>;

/**
 * The Clerk sign-in and sign-up cards in the site's design (Figma: Button,
 * Input): limestone card, asphalt text, plate-blue links, and the marker
 * yellow "Continue" with the hard key shadow — the one primary action, as
 * everywhere else on the site.
 *
 * `variables` are literal colours because Clerk derives its hover and border
 * shades from them and cannot read a CSS variable; they mirror the site
 * tokens in globals.css. The `elements` classes use the tokens themselves,
 * so links follow a dealership's own primary colour on its subdomain. They
 * are `!important` because Clerk's styles are unlayered and would otherwise
 * beat Tailwind's utilities layer.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: "#1d4e9e",
    colorText: "#17181b",
    colorTextSecondary: "#5c5549",
    colorBackground: "#fffcf6",
    colorInputBackground: "#ffffff",
    colorInputText: "#17181b",
    colorNeutral: "#17181b",
    colorDanger: "#c2452d",
    colorSuccess: "#1f7a5a",
    borderRadius: "12px",
    fontFamily: "inherit",
    fontFamilyButtons: "inherit",
  },
  elements: {
    rootBox: "w-full max-w-[440px]",
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
