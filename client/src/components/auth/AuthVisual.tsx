"use client";
import { motion } from "framer-motion";
import AuthInfoPoint from "./AuthInfoPoint";

export default function AuthVisual() {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-[hsl(var(--primary)/0.1)] via-[hsl(var(--purple)/0.1)] to-[hsl(var(--primary)/0.05)] items-center justify-center p-12 relative overflow-hidden">
      <div className="hero-glow top-1/4 left-1/4 opacity-40" />
      <div className="hero-glow bottom-1/4 right-1/4 opacity-30" />
      {/* Point in card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-card p-8 max-w-md relative z-10"
      >
        <h2 className="text-2xl font-bold mb-4">
          Powerful tools at your fingertips
        </h2>
        <ul className="space-y-4 text-[hsl(var(--muted-foreground))]">
          <AuthInfoPoint text="Shorten URLs and track analytics in real-time"/>
          <AuthInfoPoint text="Generate dynamic QR codes with custom branding"/>
          <AuthInfoPoint text="Check DNS records and domain availability"/>
          <AuthInfoPoint text="Create secure one-time links that auto-expire"/>
        </ul>
      </motion.div>
       {/* Floating Elements */}
        <motion.div
          animate={{ y: [0, -40, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-20 w-16 h-16 rounded-2xl bg-[hsl(var(--primary)/0.2)] backdrop-blur-sm border border-[hsl(var(--primary)/0.3)]"
        />
        <motion.div
          animate={{ y: [0, 30, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-32 left-20 w-12 h-12 rounded-full bg-[hsl(var(--purple)/0.2)] backdrop-blur-sm border border-[hsl(var(--purple)/0.3)]"
        />
    </div>
  );
}
