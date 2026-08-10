/**
 * BUG (surfaced by this conversion, NOT fixed here): every `action` below
 * closes over module-scope `shareUrl` / `shareTitle`, which are never declared
 * anywhere in this file. ShareDialog.jsx declares its own local `shareUrl` and
 * passes `social.action` straight to onClick, so each button throws a
 * ReferenceError the moment it is clicked — the share buttons have never
 * worked. The right shape is a `socialShares(shareUrl, shareTitle)` factory,
 * or passing the values in at call time; either is its own PR.
 *
 * These declarations exist only so the broken references still compile with
 * the same runtime behaviour (an undefined identifier at module scope).
 */
declare const shareUrl: string;
declare const shareTitle: string;

export const socialShares = [
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
