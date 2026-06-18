"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion";

interface OptionGridProps {
  options: readonly string[];
  selected: string[];
  onToggle: (option: string) => void;
}

/** Multi-select pill grid used for interests, companies, and creators. */
export function OptionGrid({ options, selected, onToggle }: OptionGridProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-wrap gap-2"
    >
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <motion.button
            key={option}
            type="button"
            variants={staggerItem}
            onClick={() => onToggle(option)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              isSelected
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-foreground/10 bg-foreground/[0.03] text-muted-foreground hover:border-foreground/20 hover:text-foreground"
            )}
          >
            {isSelected && <Check className="h-3.5 w-3.5" />}
            {option}
          </motion.button>
        );
      })}
    </motion.div>
  );
}
