"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";

const FAQ = ({ brandName = "AutoMe" }) => {
    const [openIndex, setOpenIndex] = useState(0);

    const faqs = [
        {
            question: `How does ${brandName}'s AI recommendation system work?`,
            answer:
                `Our AI analyzes thousands of data points including your budget, preferences, driving habits, and market trends to recommend the perfect car for you. The system learns from millions of successful car purchases to provide increasingly accurate suggestions.`,
        },
        {
            question: `Is it free to use ${brandName} as a buyer?`,
            answer:
                `Yes! ${brandName} is completely free for car buyers. You can browse listings, get AI recommendations, schedule test drives, and communicate with dealers at no cost. We only charge dealerships for premium features.`,
        },
        {
            question: "How do I schedule a test drive?",
            answer:
                "Simply find a car you're interested in, click the 'Schedule Test Drive' button, and choose your preferred date and time. The dealership will confirm your appointment, and the car will be ready when you arrive. No waiting, no hassle.",
        },
        {
            question: `Are the cars on ${brandName} verified?`,
            answer:
                `Yes, all vehicles listed on ${brandName} go through a rigorous verification process. Our team checks vehicle history, condition reports, and dealer credentials. We also provide market price analysis to ensure you're getting a fair deal.`,
        },
        {
            question: `Can I sell my car on ${brandName}?`,
            answer:
                `Currently, ${brandName} focuses on connecting buyers with verified dealerships. However, we're working on a peer-to-peer marketplace feature that will allow individual sellers to list their vehicles. Stay tuned for updates!`,
        },
        {
            question: "What payment methods are accepted?",
            answer:
                `${brandName} supports various payment methods including bank transfers, financing through our partner lenders, and dealership payment plans. All transactions are secured with advanced encryption and buyer protection.`,
        },
    ];

    return (
        <section className="py-16 sm:py-24 bg-gradient-to-b from-gray-50 to-white">
            <div className="container mx-auto max-w-4xl px-4 sm:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    className="text-center mb-12 sm:mb-16"
                >
                    <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                        <HelpCircle className="h-4 w-4" />
                        <span>FAQ</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Frequently Asked{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            Questions
                        </span>
                    </h2>
                    <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                        Everything you need to know about {brandName}. Can&apos;t find your answer?
                        {/* Locale-aware Link, not a raw <a>: a bare href drops the
                            locale prefix, so an Arabic reader clicking this was
                            redirected into the English tree. */}
                        <Link href="/contact" className="text-blue-600 hover:text-blue-700 font-semibold ms-1">
                            Contact us
                        </Link>
                    </p>
                </motion.div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.05 }}
                            viewport={{ once: true }}
                            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                                className="w-full px-6 py-5 sm:px-8 sm:py-6 flex items-center justify-between text-start"
                            >
                                <span className="text-base sm:text-lg font-semibold text-gray-900 pe-4">
                                    {faq.question}
                                </span>
                                <ChevronDown
                                    className={`h-5 w-5 text-gray-500 flex-shrink-0 transition-transform duration-300 ${openIndex === index ? "rotate-180" : ""
                                        }`}
                                />
                            </button>
                            <div
                                className={`overflow-hidden transition-all duration-300 ${openIndex === index ? "max-h-96" : "max-h-0"
                                    }`}
                            >
                                <div className="px-6 pb-6 sm:px-8 sm:pb-8">
                                    <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQ;
