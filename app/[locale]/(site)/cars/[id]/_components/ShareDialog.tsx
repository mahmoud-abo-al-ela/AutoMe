"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Copy, Facebook, Twitter, Share2 } from "lucide-react";
import { toast } from "sonner";
import { socialShares } from "@/lib/SocialShare";
import type { CarDetail } from "../_lib/car-detail-types";
import { useTranslations } from "next-intl";

const ShareDialog = ({
  isOpen,
  onOpenChange,
  title,
  // Optional: the dealership share button reuses this dialog and has no car,
  // which the document.title fallback below already handles.
  car = null,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  car?: CarDetail | null;
}) => {
  const t = useTranslations("carDetail.share");
  const [copying, setCopying] = useState(false);

  // A default parameter cannot call a hook, so the fallback is resolved here.
  const dialogTitle = title ?? t("title");

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  // CarInfoCard has always passed `car`; it was simply never read. Car.title is
  // frequently null, so fall back to the year/make/model line, and to the
  // document title if there is no car at all.
  const shareTitle =
    car?.title ||
    [car?.year, car?.make, car?.model].filter(Boolean).join(" ") ||
    (typeof document !== "undefined" ? document.title : "");
  const shares = socialShares(shareUrl, shareTitle);

  const copyToClipboard = async () => {
    if (typeof window !== "undefined") {
      setCopying(true);
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success(t("copied"));
      } catch {
        toast.error(t("copyFailed"));
      } finally {
        setCopying(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-start sm:text-center text-base sm:text-xl">
            {dialogTitle}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-2">
          <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-lg border w-full">
            <div className="w-full overflow-hidden">
              <span className="text-sm block truncate text-gray-600 text-ellipsis w-[250px] md:w-full">
                {shareUrl}
              </span>
            </div>
            <Button
              size="sm"
              onClick={copyToClipboard}
              disabled={copying}
              className="gap-1.5 whitespace-nowrap w-full sm:w-auto cursor-pointer"
            >
              <Copy className="h-4 w-4" />
              {copying ? "Copying..." : t("copyLink")}
            </Button>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              {t("shareVia")}
            </h3>
            <div className="grid grid-cols-4 md:grid-cols-2 gap-6 md:gap-2 w-fit md:w-full">
              {shares.map((social) => (
                <Button
                  key={social.name}
                  variant="outline"
                  className="flex items-center justify-center gap-2 p-2 h-auto hover:bg-gray-50 transition-all w-fit md:w-full cursor-pointer"
                  onClick={social.action}
                >
                  <div
                    className={`h-8 w-8 rounded-full ${social.bgColor} flex items-center justify-center`}
                  >
                    {social.icon === "Facebook" && (
                      <Facebook className="h-5 w-5 text-white" />
                    )}
                    {social.icon === "Twitter" && (
                      <Twitter className="h-5 w-5 text-white" />
                    )}
                    {social.icon === "WhatsApp" && (
                      <Share2 className="h-5 w-5 text-white" />
                    )}
                    {social.icon === "Mail" && (
                      <Mail className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <span className="text-xs font-medium hidden md:block">
                    {social.name}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
