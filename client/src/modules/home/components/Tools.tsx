"use client";
import { motion } from "framer-motion";
import { tools } from "../../../utils/content";
import FeatureCard from "./FeatureCard";

export default function Tools() {
  return (
    <section id="tools" className="py-24 relative">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-[hsl(var(--primary))] uppercase font-semibold text-sm tracking-wider">
            Tools
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6 leading-tighter">
            Everything You Need in
            <br />
            <span className="gradient-text">One Place</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-[hsl(var(--muted-foreground))] mb-16">
            A comprehensive suite of tools designed to streamline your workflow
            and boost productivity.
          </p>
          <motion.div
            className="grid grid-cols-1 max-sm:mx-auto max-sm:max-w-xs sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
            initial="hidden"
            whileInView="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.6,
                },
              },
            }}
          >
            {tools.map((tool, index) => (
              <FeatureCard
                key={tool.title}
                icon={tool.icon}
                title={tool.title}
                description={tool.description}
                index={index}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
