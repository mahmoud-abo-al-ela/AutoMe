"use client";

import React from "react";
import { CheckCircle, ChevronDown } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import HeroSearch from "./HeroSearch";

const Hero = () => {
  const scrollToFeatures = (e) => {
    e.preventDefault();
    const featuresSection = document.getElementById("featured");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="main-content"
      className="relative bg-gradient-to-r from-[#1A1F2C] to-blue-900 text-white min-h-screen flex items-center py-16 md:py-24"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1470')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0f1a]/60 to-[#0a0f1a]/90"></div>
      </div>

      <div className="container mx-auto relative z-10 px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-3 sm:mb-4 md:mb-6"
          >
            Find Your Perfect Car{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-primary">
              Powered by AI
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-sm sm:text-base md:text-lg lg:text-xl text-blue-100 mb-5 sm:mb-6 md:mb-8 max-w-2xl mx-auto px-2 sm:px-0"
          >
            Our AI technology analyzes thousands of vehicles to match you with
            the perfect car based on your preferences, budget, and needs.
          </motion.p>

          <HeroSearch />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-5 sm:mb-8 md:mb-10 text-xs sm:text-sm md:text-base px-1 sm:px-0"
          >
            <Link
              href="/cars?fuelType=Electric"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-full font-medium transition-all duration-300 hover:shadow-md hover:scale-105"
            >
              Electric Vehicles
            </Link>
            <Link
              href="/cars?bodyType=SUV"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-full font-medium transition-all duration-300 hover:shadow-md hover:scale-105"
            >
              SUVs
            </Link>
            <Link
              href="/cars?bodyType=Sedan"
              className="bg-white/10 hidden sm:block hover:bg-white/20 backdrop-blur-sm px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-full font-medium transition-all duration-300 hover:shadow-md hover:scale-105"
            >
              Sedans
            </Link>
            <Link
              href="/cars?transmission=Automatic"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-full font-medium transition-all duration-300 hover:shadow-md hover:scale-105"
            >
              Automatic
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9 }}
            className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 text-xs md:text-sm"
          >
            <div className="flex items-center bg-white/5 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary mr-1.5 sm:mr-2" />
              <span>AI-Powered Recommendations</span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-white/30 mx-1"></div>
            <div className="flex items-center bg-white/5 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary mr-1.5 sm:mr-2" />
              <span>Market Price Analysis</span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-white/30 mx-1"></div>
            <div className="flex items-center bg-white/5 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary mr-1.5 sm:mr-2" />
              <span>Virtual Car Tours</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="absolute -bottom-30 left-1/2 transform -translate-x-1/2"
          >
            <a
              href="#features"
              onClick={scrollToFeatures}
              className="flex items-center justify-center w-10 h-10 text-white rounded-full bg-white/10 hover:bg-white/20 animate-bounce"
              aria-label="Scroll to featured section"
            >
              <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
