"use client";

import { motion } from "framer-motion";

export default function SuccessMessage({ orgName }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center space-y-4"
        >
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                🎉 Congratulations!
            </h1>
            <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
                Your dealership <span className="font-bold text-green-600">{orgName}</span> has been
                created successfully. You're now ready to start selling cars online!
            </p>
        </motion.div>
    );
}
