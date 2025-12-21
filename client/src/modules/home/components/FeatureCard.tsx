import { motion } from "framer-motion";
import { FeatureCardProps } from "@/interfaces/components";

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  index,
}:FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <motion.div
        whileHover={{ y: -8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="p-6 group cursor-pointer glass-card-hover flex flex-col items-center sm:items-start sm:text-left will-change-transform h-full"
      >
        <div className="w-12 h-12 rounded-xl bg-[hsl(var(--primary)/0.1)] flex items-center justify-center mb-4 group-hover:bg-[hsl(var(--primary)/0.2)] transition-colors">
          <Icon className="w-6 h-6 text-[hsl(var(--primary))]" />
        </div>

        <h3 className="text-lg font-semibold mb-2 text-[hsl(var(--foreground))]">
          {title}
        </h3>

        <p className="text-[hsl(var(--muted-foreground))] text-sm leading-relaxed">
          {description}
        </p>
      </motion.div>
    </motion.div>
  );
}
