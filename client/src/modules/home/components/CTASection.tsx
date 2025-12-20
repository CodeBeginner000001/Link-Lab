"use client"
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "../../../components/ui/Button";

export default function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-r from-[hsl(var(--primary)/0.05)] via-[hsl(var(--accent)/0.05)] to-[hsl(var(--primary)/0.05)]" />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass-card p-12 md:p-16 text-center max-w-4xl mx-auto"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to <span className="gradient-text">Get Started?</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Join thousands of users who trust LinkLab for their digital toolkit needs.
            Start for free, upgrade when you&apos;re ready.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="hero"
              size="xl"
              className="group max-[640px]:h-12 max-[640px]:px-8 max-[640px]:rounded-lg max-[640px]:text-base max-[310px]:h-10 max-[310px]:px-4 max-[310px]:rounded-md max-[310px]:text-sm "
            >
              Create Free Account
              <ArrowRight className="w-5 h-5 hidden min-[310px]:flex group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="heroOutline"
              size="lg"
            >
              Sign In
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
