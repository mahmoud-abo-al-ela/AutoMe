"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const FAQ = ({ brandName = "AutoMe" }) => {
    const t = useTranslations("home.faq");
    const [openIndex, setOpenIndex] = useState(0);

    const faqs = ([1, 2, 3, 4, 5, 6] as const).map((n) => ({
        question: t(`q${n}`, { brand: brandName }),
        answer: t(`a${n}`, { brand: brandName }),
    }));

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
                        <span>{t("badge")}</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        {t("title")}{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            {t("titleAccent")}
                        </span>
                    </h2>
                    <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                        {t("subtitle", { brand: brandName })}
                        {/* Locale-aware Link, not a raw <a>: a bare href drops the
                            locale prefix, so an Arabic reader clicking this was
                            redirected into the English tree. */}
                        <Link href="/contact" className="text-blue-600 hover:text-blue-700 font-semibold ms-1">{t("contactUs")}</Link>
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
