"use client";
import { useTranslations } from "next-intl";

import React from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import AutoPlay from "embla-carousel-autoplay";

/** Proper nouns — never translated, and index-aligned with `reviews.r1..r4`. */
const REVIEWER_NAMES = [
    "Sarah Johnson",
    "Michael Chen",
    "Emily Rodriguez",
    "David Thompson",
] as const;

const REVIEWER_IMAGES = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
] as const;

const Testimonials = () => {
  const t = useTranslations("home.testimonials");
    // STILL PLACEHOLDER CONTENT. These are invented reviews, now translated on
    // the user's instruction so the Arabic page has no English islands in it.
    // Reviewer names stay Latin — they are proper nouns, and per the i18n rule
    // we do not transliterate names. They need replacing with real reviews.
    const testimonials = ([1, 2, 3, 4] as const).map((n) => ({
        name: REVIEWER_NAMES[n - 1],
        role: t(`reviews.r${n}.role`),
        image: REVIEWER_IMAGES[n - 1],
        rating: 5,
        content: t(`reviews.r${n}.content`),
    }));

    return (
        <section className="py-16 sm:py-24 bg-gradient-to-b from-muted to-background">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    className="text-center mb-12 sm:mb-16"
                >
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                        <Star className="h-4 w-4 fill-current" />
                        <span>{t("badge")}</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
                        {t("title")}{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-brand-accent">
                            {t("titleAccent")}
                        </span>
                    </h2>
                    <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                        {t("subtitle", { brand: "AutoMe" })}
                    </p>
                </motion.div>

                <Carousel
                    opts={{
                        loop: true,
                        dragFree: false,
                        align: "start",
                    }}
                    plugins={[AutoPlay({ delay: 6000 })]}
                    className="w-full"
                >
                    <CarouselContent className="-ms-2 md:-ms-4">
                        {testimonials.map((testimonial, index) => (
                            <CarouselItem
                                key={index}
                                className="ps-2 md:ps-4 basis-full md:basis-1/2 lg:basis-1/3"
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="bg-card rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-border h-full flex flex-col"
                                >
                                    <div className="flex items-center gap-1 mb-4">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 fill-current"
                                            />
                                        ))}
                                    </div>

                                    <Quote className="h-8 w-8 text-primary/30 mb-4 flex-shrink-0" />

                                    <p className="text-muted-foreground mb-6 flex-grow leading-relaxed text-sm sm:text-base">
                                        &quot;{testimonial.content}&quot;
                                    </p>

                                    <div className="flex items-center gap-3 pt-4 border-t border-border">
                                        <img
                                            src={testimonial.image}
                                            alt={testimonial.name}
                                            className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
                                        />
                                        <div>
                                            <div className="font-semibold text-foreground text-sm sm:text-base">
                                                {testimonial.name}
                                            </div>
                                            <div className="text-xs sm:text-sm text-muted-foreground">
                                                {testimonial.role}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>
        </section>
    );
};

export default Testimonials;
