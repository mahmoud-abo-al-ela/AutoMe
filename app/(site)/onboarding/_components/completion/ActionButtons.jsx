"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ExternalLink, ArrowRight } from "lucide-react";

export default function ActionButtons({ siteUrl, adminUrl }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
        >
            <Button
                variant="outline"
                asChild
                className="cursor-pointer px-8 py-6 text-base font-semibold h-14 border-2 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300"
            >
                <a href={siteUrl} className="flex items-center gap-2">
                    View Your Site
                    <ExternalLink className="h-5 w-5" />
                </a>
            </Button>
            <Button
                asChild
                className="cursor-pointer bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-6 text-base font-semibold h-14 shadow-lg hover:shadow-xl transition-all duration-300"
            >
                <a href={adminUrl} className="flex items-center gap-2">
                    Go to Dashboard
                    <ArrowRight className="h-5 w-5" />
                </a>
            </Button>
        </motion.div>
    );
}
