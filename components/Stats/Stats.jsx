"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Car, Building2, Star } from "lucide-react";

const Stats = () => {
    const stats = [
        {
            icon: Users,
            value: "50K+",
            label: "Happy Customers",
            description: "Trusted by thousands of car buyers",
        },
        {
            icon: Car,
            value: "10K+",
            label: "Vehicles Listed",
            description: "Wide selection of quality cars",
        },
        {
            icon: Building2,
            value: "500+",
            label: "Partner Dealerships",
            description: "Verified and trusted sellers",
        },
        {
            icon: Star,
            value: "4.9",
            label: "Average Rating",
            description: "Based on customer reviews",
        },
    ];

    return (
        <section className="py-12 sm:py-16 bg-white border-b border-gray-100">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="text-center group"
                            >
                                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl mb-3 sm:mb-4 group-hover:from-blue-100 group-hover:to-indigo-100 transition-all duration-300">
                                    <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
                                </div>
                                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                                    {stat.value}
                                </div>
                                <div className="text-sm sm:text-base font-semibold text-gray-800 mb-1">
                                    {stat.label}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-500">
                                    {stat.description}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Stats;
