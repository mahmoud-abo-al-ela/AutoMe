"use client";

import React from "react";
import { Badge } from "../ui/badge";
import { motion } from "framer-motion";
import WhyCard from "./WhyCard";
import { whyConfig } from "@/lib/WhyConfig";

const Why = () => {
  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-10 sm:py-16">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-20"
        >
          <Badge
            variant="primary"
            className="mb-3 sm:mb-4 text-xs sm:text-sm font-medium px-3 sm:px-4 py-1 sm:py-1.5"
          >
            Why Choose Us
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight px-2 sm:px-0">
            The Smarter Way to <span className="text-blue-600">Buy Cars</span>
          </h2>
          <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-2 sm:px-0">
            Experience a revolutionary car buying journey powered by advanced AI
            technology that puts you in control
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-8 md:gap-10">
          {whyConfig.map((card, index) => (
            <WhyCard
              key={index}
              icon={card.icon}
              title={card.title}
              description={card.description}
              delay={index * 0.2}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Why;
