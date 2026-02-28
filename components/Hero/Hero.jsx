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
      className="relative bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#1A1F2C] text-white min-h-screen flex items-center overflow-hidden"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1470')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0f1a]/70 to-[#0a0f1a]/95"></div>
      </div>

      <div className="container mx-auto relative z-10 px-4 md:px-6 -mt-20 md:mt-0">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-4 sm:mb-6 md:mb-8 leading-tight"
          >
            Find Your Perfect Car{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-primary">
              Powered by AI
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100/90 mb-6 sm:mb-8 md:mb-10 max-w-3xl mx-auto px-2 sm:px-0 leading-relaxed"
          >
            Our AI technology analyzes thousands of vehicles to match you with
            the perfect car based on your preferences, budget, and needs.
          </motion.p>

          <HeroSearch />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-8 md:mb-10 text-xs sm:text-sm md:text-base px-1 sm:px-0"
          >
            <Link
              href="/cars?fuelType=Electric"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-105"
            >
              ⚡ Electric Vehicles
            </Link>
            <Link
              href="/cars?bodyType=SUV"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-105"
            >
              🚙 SUVs
            </Link>
            <Link
              href="/cars?bodyType=Sedan"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-105 hidden sm:block"
            >
              🚗 Sedans
            </Link>
            <Link
              href="/cars?transmission=Automatic"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-105"
            >
              ⚙️ Automatic
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap justify-center items-center gap-3 sm:gap-6 text-xs md:text-sm"
          >
            <div className="flex items-center bg-white/5 backdrop-blur-sm border border-white/10 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-400 mr-2" />
              <span className="text-blue-100">AI-Powered Recommendations</span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-white/20"></div>
            <div className="flex items-center bg-white/5 backdrop-blur-sm border border-white/10 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-400 mr-2" />
              <span className="text-blue-100">Market Price Analysis</span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-white/20"></div>
            <div className="flex items-center bg-white/5 backdrop-blur-sm border border-white/10 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-400 mr-2" />
              <span className="text-blue-100">Virtual Car Tours</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="absolute -bottom-30 left-1/2 transform -translate-x-1/2"
          >
            <a
              href="#features"
              onClick={scrollToFeatures}
              className="flex items-center justify-center w-12 h-12 text-white rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 animate-bounce transition-all duration-300 hover:scale-110"
              aria-label="Scroll to featured section"
            >
              <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6" />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
