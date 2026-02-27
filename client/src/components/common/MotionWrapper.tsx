"use client";
import { cn } from "@/utils/tailwindcss-merger";
import { motion } from "framer-motion";

export default function MotionWrapper({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn("w-full", className)}
    >
      {children}
    </motion.div>
  );
}
