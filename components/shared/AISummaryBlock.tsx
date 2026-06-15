"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, Lightbulb, TrendingUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIInsights } from "@/types/ai";

interface AISummaryBlockProps {
  summary?: string | null;
  insights?: AIInsights | null;
  /** Render expanded by default (used in "Detailed" mode). */
  defaultOpen?: boolean;
  className?: string;
}

/**
 * Displays an AI-generated summary with optional structured insights
 * (what happened / why it matters / implications), collapsible.
 */
export function AISummaryBlock({
  summary,
  insights,
  defaultOpen = false,
  className,
}: AISummaryBlockProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (!summary && !insights) return null;

  return (
    <div className={cn("rounded-xl border border-primary/15 bg-primary/[0.04]", className)}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left"
      >
        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-xs font-medium text-primary flex-1">
          AI Insight
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5 space-y-2.5 text-sm">
              {summary && (
                <p className="text-foreground/90 leading-relaxed">{summary}</p>
              )}
              {insights?.whatHappened && (
                <InsightRow icon={Info} label="What happened" text={insights.whatHappened} />
              )}
              {insights?.whyItMatters && (
                <InsightRow icon={Lightbulb} label="Why it matters" text={insights.whyItMatters} />
              )}
              {insights?.implications && (
                <InsightRow icon={TrendingUp} label="Future implications" text={insights.implications} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InsightRow({
  icon: Icon,
  label,
  text,
}: {
  icon: typeof Info;
  label: string;
  text: string;
}) {
  return (
    <div className="flex gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <span className="text-xs font-medium text-muted-foreground">{label}: </span>
        <span className="text-sm text-foreground/80">{text}</span>
      </div>
    </div>
  );
}
