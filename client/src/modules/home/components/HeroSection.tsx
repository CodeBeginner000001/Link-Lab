"use client";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { heroContent } from "@/utils/content";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 bg-linear-to-b from-[hsl(var(--background))] via-[hsl(var(--background))] to-[hsl(var(--muted)/0.3)]" />
      {/* The Circluar glow in the corners */}
      <div className="hero-glow -top-60 -left-40 -right-40 opacity-50" />
      <div className="hero-glow -bottom-60 -right-40 opacity-30" />
      {/* Hero Section text area */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--primary)/0.1)] border border-[hsl(var(--primary)/0.2)] text-[hsl(var(--primary))] text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span>Your Complete Digital Toolkit</span>
          </motion.div>
          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight md:tracking-[-4.5px] md:leading-18"
          >
            Supercharge Your
            <br />
            <span className="gradient-text">Learning Journey</span>
          </motion.h1>
          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base md:text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto mb-10 leading-tighter"
          >
            Powerful tools for URL shortening, QR codes, barcode generation, DNS
            checking, and more — all in one beautiful platform.
          </motion.p>
          {/* Hero Section Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href={"/signup"}>
              <Button variant="hero" size="xl" className="group">
                Get Started Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button variant="heroOutline" size="xl">
              <Link href="/login">Log In</Link>
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-8 md:gap-16 mt-16"
          >
            {heroContent.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-text">
                  {stat.value}
                </div>
                <div className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
      <motion.div
        animate={{ y: [0, -50, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 left-[15%] w-16 h-16 bg-[hsl(var(--primary)/0.2)] rounded-2xl backdrop-blur-sm border border-[hsl(var(--primary)/0.3)] hidden lg:block"
      />

      <motion.div
        animate={{ y: [0, 50, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/3 right-[10%] w-20 h-20 bg-[hsl(var(--purple)/0.2)] rounded-full backdrop-blur-sm border border-[hsl(var(--purple)/0.3)] hidden lg:block"
      />
    </section>
  );
}
