"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import AutoPlay from "embla-carousel-autoplay";

const Testimonials = () => {
    const testimonials = [
        {
            name: "Sarah Johnson",
            role: "First-time Buyer",
            image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
            rating: 5,
            content: "AutoMe made finding my first car incredibly easy. The AI recommendations were spot-on, and I found the perfect SUV within my budget. The test drive scheduling was seamless!",
        },
        {
            name: "Michael Chen",
            role: "Business Owner",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
            rating: 5,
            content: "As a busy professional, I needed a quick and reliable way to find a company car. AutoMe's platform saved me hours of research. The virtual tours were incredibly helpful.",
        },
        {
            name: "Emily Rodriguez",
            role: "Car Enthusiast",
            image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
            rating: 5,
            content: "I've bought many cars over the years, but AutoMe offers the best experience I've ever had. The detailed specs, market analysis, and dealer reviews gave me complete confidence in my purchase.",
        },
        {
            name: "David Thompson",
            role: "Family Man",
            image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
            rating: 5,
            content: "Found the perfect family minivan through AutoMe. The safety features comparison and child seat compatibility info were exactly what I needed. Highly recommend!",
        },
    ];

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
                        <span>Customer Reviews</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
                        Loved by Thousands of{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-brand-accent">
                            Happy Customers
                        </span>
                    </h2>
                    <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                        See what our customers have to say about their experience with AutoMe
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
                    <CarouselContent className="-ml-2 md:-ml-4">
                        {testimonials.map((testimonial, index) => (
                            <CarouselItem
                                key={index}
                                className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3"
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
                                        "{testimonial.content}"
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
