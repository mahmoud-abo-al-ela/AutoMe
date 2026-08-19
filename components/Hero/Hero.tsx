"use client";

import React from "react";
import Image from "next/image";
import { CheckCircle, ChevronDown } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import HeroSearch from "./HeroSearch";

const Hero = () => {
  const scrollToFeatures = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const featuresSection = document.getElementById("featured");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="main-content"
      className="relative bg-slate-950 text-white min-h-screen flex items-center overflow-hidden"
    >
      {/* Self-hosted, optimized background image + brand-tinted ambient glows */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src="/hero-car.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Darkening overlays keep the white hero text legible over the photo */}
        <div className="absolute inset-0 bg-slate-950/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/60 to-slate-950/95" />
        {/* Brand glows inherit tenant --primary / --brand-accent */}
        <div className="absolute -top-1/4 right-1/4 w-[32rem] h-[32rem] bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[28rem] h-[28rem] bg-brand-accent/15 rounded-full blur-3xl" />
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
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-brand-accent">
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
