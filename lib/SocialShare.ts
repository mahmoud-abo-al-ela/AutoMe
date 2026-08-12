/** One social destination rendered by ShareDialog. */
export interface SocialShareTarget {
  name: string;
  icon: "Facebook" | "Twitter" | "WhatsApp" | "Mail";
  bgColor: string;
  action: () => void;
}

/**
 * Build the share targets for a given page.
 *
 * Takes the url and title as arguments rather than closing over module scope:
 * the values are per-render (the url comes from window.location) and there is
 * no sensible module-level value for either.
 */
export function socialShares(
  shareUrl: string,
  shareTitle: string
): SocialShareTarget[] {
  return [
    {
      name: "Facebook",
      icon: "Facebook",
      bgColor: "bg-[#1877F2]",
      action: () =>
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            shareUrl
          )}`,
          "_blank"
        ),
    },
    {
      name: "Twitter",
      icon: "Twitter",
      bgColor: "bg-[#1DA1F2]",
      action: () =>
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(
            shareUrl
          )}&text=${encodeURIComponent(shareTitle)}`,
          "_blank"
        ),
    },
    {
      name: "WhatsApp",
      icon: "WhatsApp",
      bgColor: "bg-[#25D366]",
      action: () =>
        window.open(
          `https://wa.me/?text=${encodeURIComponent(
            `${shareTitle}: ${shareUrl}`
          )}`,
          "_blank"
        ),
    },
    {
      name: "Email",
      icon: "Mail",
      bgColor: "bg-gray-600",
      action: () =>
        window.open(
          `mailto:?subject=${encodeURIComponent(
            shareTitle
          )}&body=${encodeURIComponent(`I found this amazing car: ${shareUrl}`)}`,
          "_blank"
        ),
    },
  ];
}
