"use client";

import { cn } from "@/utils/tailwindcss-merger";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { KeyboardEvent, MouseEvent, ReactNode, useState } from "react";

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
}: ToolExpandableRowsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    initialOpenId ?? items[0]?.id ?? null,
  );

  const toggleRow = (itemId: string) => {
    setExpandedId((currentId) => (currentId === itemId ? null : itemId));
  };

  const isActionTarget = (target: EventTarget | null) =>
    target instanceof Element &&
    Boolean(
      target.closest(
        'a, button, input, textarea, select, [data-row-action="true"]',
      ),
    );

  const handleRowClick = (
    event: MouseEvent<HTMLDivElement>,
    itemId: string,
  ) => {
    if (isActionTarget(event.target)) {
      return;
    }

    toggleRow(itemId);
  };

  const handleRowKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    itemId: string,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    toggleRow(itemId);
  };

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
                <motion.div
                  layout="position"
                  className={cn(
                    "w-full",
                    triggerClassName,
                    isOpen ? openTriggerClassName : closedTriggerClassName,
                  )}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(event) => handleRowClick(event, item.id)}
                    onKeyDown={(event) => handleRowKeyDown(event, item.id)}
                    className="w-full min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-0"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-start gap-4">
                      <div className="min-w-0 flex-1 cursor-pointer">
                        {item.trigger}
                      </div>
                    </div>
                  </div>
                </motion.div>

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
