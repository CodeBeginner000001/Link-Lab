"use client";

import { cn } from "@/utils/tailwindcss-merger";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ReactNode, useState } from "react";

const expandTransition = {
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1] as const,
};

export type ToolExpandableRowsItem = {
  id: string;
  trigger: ReactNode;
  content: ReactNode;
};

type ToolExpandableRowsProps = {
  items: ToolExpandableRowsItem[];
  initialOpenId?: string | null;
  className?: string;
  listClassName?: string;
  rowClassName?: string;
  triggerClassName?: string;
  openTriggerClassName?: string;
  closedTriggerClassName?: string;
  contentClassName?: string;
  chevronClassName?: string;
  hideChevron?: boolean;
};

export default function ToolExpandableRows({
  items,
  initialOpenId,
  className,
  listClassName,
  rowClassName,
  triggerClassName,
  openTriggerClassName,
  closedTriggerClassName,
  contentClassName,
  chevronClassName,
  hideChevron = false,
}: ToolExpandableRowsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    initialOpenId ?? items[0]?.id ?? null,
  );

  return (
    <section className={className}>
      <LayoutGroup>
        <motion.div
          layout
          className={cn(
            "divide-y divide-[hsl(var(--border))]",
            listClassName,
          )}
          transition={expandTransition}
        >
          {items.map((item) => {
            const isOpen = expandedId === item.id;

            return (
              <motion.div
                key={item.id}
                layout
                transition={expandTransition}
                className={rowClassName}
              >
                <motion.button
                  layout="position"
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : item.id)}
                  className={cn(
                    "w-full text-left",
                    triggerClassName,
                    isOpen ? openTriggerClassName : closedTriggerClassName,
                  )}
                  aria-expanded={isOpen}
                >
                  <div className="flex items-start gap-4">
                    <div className="min-w-0 flex-1 cursor-pointer">{item.trigger}</div>
                  </div>
                </motion.button>

                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      key={`${item.id}-expanded`}
                      layout
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={expandTransition}
                      className={cn("overflow-hidden", contentClassName)}
                    >
                      {item.content}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </LayoutGroup>
    </section>
  );
}
