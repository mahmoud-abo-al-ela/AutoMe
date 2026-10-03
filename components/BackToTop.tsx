"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const BackToTop = () => {
  const t = useTranslations("common.actions");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => setIsVisible(window.scrollY > 600);
    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  if (!isVisible) return null;

  return (
    <Button
      variant="inverse"
      size="icon-xl"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      // Below lg it clears the phone tab bar and the car page's contact bar.
      className="fixed end-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 rounded-full shadow-float lg:end-6 lg:bottom-6"
      aria-label={t("backToTop")}
      title={t("backToTop")}
    >
      <ArrowUp />
    </Button>
  );
};

export default BackToTop;
