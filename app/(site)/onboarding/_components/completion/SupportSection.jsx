"use client";

import { motion } from "framer-motion";

export default function SupportSection() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100"
        >
            <p className="text-gray-700">
                Need help getting started?{" "}
                <a
                    href="mailto:support@autome.com"
                    className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                >
                    Contact our support team
                </a>
            </p>
        </motion.div>
    );
}
