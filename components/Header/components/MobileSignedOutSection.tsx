"use client";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Show, SignInButton } from "@clerk/nextjs";
import { useAuthRedirects } from "@/hooks/use-auth-redirects";

export default function MobileSignedOutSection({
  setIsMenuOpen,
}: {
  setIsMenuOpen: (open: boolean) => void;
}) {
  const t = useTranslations("nav");
  const { afterSignIn } = useAuthRedirects();
  return (
    <Show when="signed-out">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.15 }}
        className="mt-4"
      >
        <SignInButton mode="modal" forceRedirectUrl={afterSignIn}>
          <Button
            className="w-full py-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/25"
            onClick={() => setIsMenuOpen(false)}
          >
            {t("signIn")}
          </Button>
        </SignInButton>
      </motion.div>
    </Show>
  );
}
