"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Car, Building2, Star } from "lucide-react";
import { useTranslations } from "next-intl";

const Stats = () => {
    const t = useTranslations("home.stats");

    const stats = [
      // The figures are translated rather than run through Intl: "50K+" has no
      // sensible Arabic rendering as a formatted number, so each locale writes
      // it out. None of these are measured values.
      { icon: Users, key: "customers" },
      { icon: Car, key: "vehicles" },
      { icon: Building2, key: "dealerships" },
      { icon: Star, key: "rating" },
    ];

    return (
        <section className="py-12 sm:py-16 bg-background border-b border-border">
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
                                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl mb-3 sm:mb-4 group-hover:bg-primary/20 transition-all duration-300">
                                    <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                                </div>
                                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1">
                                    {t(`${stat.key}Value`)}
                                </div>
                                <div className="text-sm sm:text-base font-semibold text-foreground mb-1">
                                    {t(`${stat.key}Label`)}
                                </div>
                                <div className="text-xs sm:text-sm text-muted-foreground">
                                    {t(`${stat.key}Description`)}
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
