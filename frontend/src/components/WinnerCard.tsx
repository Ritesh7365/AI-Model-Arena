/**
 * Highlighted winner summary card with gradient border and fade-in motion.
 */
"use client";

import { motion } from "framer-motion";
import { Sparkles, Trophy } from "lucide-react";

import { ExecutionBadge } from "@/components/ExecutionBadge";

interface WinnerCardProps {
  winner: string;
  summary: string;
  totalExecutionTime: number;
}

export function WinnerCard({
  winner,
  summary,
  totalExecutionTime,
}: WinnerCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-2xl p-[1px]"
      style={{
        background:
          "linear-gradient(135deg, rgba(251,191,36,0.85), rgba(245,158,11,0.25), rgba(56,189,248,0.55))",
      }}
    >
      <div className="rounded-2xl bg-gray-950/90 px-6 py-7 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-sm font-medium text-amber-200">
            <Trophy className="size-4" aria-hidden="true" />
            🏆 Winner
          </span>
          <ExecutionBadge milliseconds={totalExecutionTime} />
        </div>

        <h2 className="mt-5 flex items-center gap-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          <Sparkles className="size-7 text-amber-300" aria-hidden="true" />
          {winner}
        </h2>

        <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-300 sm:text-lg">
          {summary}
        </p>
      </div>
    </motion.section>
  );
}
