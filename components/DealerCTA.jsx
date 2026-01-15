"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { Building2, CheckCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

function DealerCTA() {
  const benefits = [
    "Free to get started",
    "AI-powered car listings",
    "Manage test drives online",
    "Built-in customer messaging",
  ];

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-blue-900 to-[#1A1F2C] text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium text-blue-300 uppercase tracking-wide">
                  For Dealerships
                </span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Start Your Own{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-primary">
                  Digital Dealership
                </span>
              </h2>
              
              <p className="text-lg text-gray-300 mb-6">
                Join AutoMe and get your dealership online in minutes. 
                Manage inventory, handle customer inquiries, and schedule 
                test drives - all in one powerful platform.
              </p>

              <ul className="space-y-3 mb-8">
                {benefits.map((benefit, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3 text-gray-200"
                  >
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    {benefit}
                  </motion.li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Link href="/onboarding" className="flex items-center gap-2">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white/20 bg-white/5 hover:bg-white/10"
                >
                  <Link href="/faq">Learn More</Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="hidden md:block"
            >
              <div className="relative">
                {/* Mock dashboard preview */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="bg-white/5 rounded px-3 py-2 text-sm">
                        Your Dealership Dashboard
                      </div>
                      <div className="bg-primary/20 text-primary px-3 py-1 rounded text-xs">
                        Pro Plan
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold">24</div>
                        <div className="text-xs text-gray-400">Cars</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold">12</div>
                        <div className="text-xs text-gray-400">Test Drives</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold">5</div>
                        <div className="text-xs text-gray-400">Messages</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="bg-white/5 rounded h-8 w-full" />
                      <div className="bg-white/5 rounded h-8 w-3/4" />
                      <div className="bg-white/5 rounded h-8 w-5/6" />
                    </div>
                  </div>
                </div>
                
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                  +3 New Leads Today
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DealerCTA;
