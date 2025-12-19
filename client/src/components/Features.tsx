"use client";
import { motion } from "framer-motion";
import { featureCards } from "../utils/content";
export default function Features() {
  return (
    <section id="features" className="py-24 relative">
      <div className="absolute inset-0 bg-linear-to-b from-[hsl(var(--muted)/0.3)] via-[hsl(var(--background))] to-[hsl(var(--background))]" />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-[hsl(var(--primary))] uppercase font-semibold text-sm tracking-wider">
            Features
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6 leading-tighter">
            Why Choose <span className="gradient-text">Link Lab</span>
          </h2>
          <p className="mx-auto text-lg text-[hsl(var(--muted-foreground))] mb-16">
            Built for developers, marketers, and everyone who needs reliable
            link management
          </p>
          <motion.div
            className="grid max-sm:max-w-lg max-sm:mx-auto sm:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once :true}}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.4,
                },
              },
            }}
          >
            {featureCards.map((feature) => (
              <motion.div
                key={feature.title}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <div className="glass-card scale-hover p-6 hover:border-[hsl(var(--primary)/0.6)] cursor-default hover:shadow-(--shadow-soft)">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-[hsl(var(--primary))] mx-auto">
                    <feature.Icon className="h-6 w-6 text-[hsl(var(--primary-foreground))]" />
                  </div>

                  <h3 className="text-xl font-semibold mb-2">
                    {feature.title}
                  </h3>

                  <p className="text-[hsl(var(--muted-foreground))]">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
