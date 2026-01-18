"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { SignedOut } from "@clerk/nextjs";

export default function MobileSignedOutSection({
  pathname,
  setIsMenuOpen,
}) {
  if (pathname === "/sign-in" || pathname === "/sign-up") return null;

  return (
    <SignedOut>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.15 }}
        className="mt-4"
      >
        <Link href="/sign-in" onClick={() => setIsMenuOpen(false)}>
          <Button className="w-full py-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/25">
            Sign In
          </Button>
        </Link>
      </motion.div>
    </SignedOut>
  );
}
