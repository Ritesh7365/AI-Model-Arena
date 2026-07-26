/**
 * Individual model result card with markdown output, timing, and copy action.
 */
"use client";

import { motion } from "framer-motion";
import {
  Bot,
  Brain,
  CircuitBoard,
  Cpu,
  Hexagon,
  type LucideIcon,
} from "lucide-react";

import { CopyButton } from "@/components/CopyButton";
import { ExecutionBadge } from "@/components/ExecutionBadge";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import type { ModelResponse } from "@/types/arena";
import { cn } from "@/lib/utils";

const MODEL_ICONS: Record<string, LucideIcon> = {
  Llama: Bot,
  Gemma: Hexagon,
  Qwen: Brain,
  DeepSeek: CircuitBoard,
  Mistral: Cpu,
};

interface ModelCardProps {
  model: ModelResponse;
  index: number;
  isWinner?: boolean;
}

export function ModelCard({ model, index, isWinner = false }: ModelCardProps) {
  const Icon = MODEL_ICONS[model.model] ?? Bot;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08 * index, ease: "easeOut" }}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-gray-900/70 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.9)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-gray-900/90 hover:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.95)]",
        isWinner && "border-amber-400/40 ring-1 ring-amber-400/20",
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sky-200">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-white">
              {model.model}
            </h3>
            {isWinner ? (
              <p className="text-xs font-medium text-amber-300">Arena winner</p>
            ) : (
              <p className="text-xs text-gray-500">Model response</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ExecutionBadge milliseconds={model.executionTime} />
          <CopyButton text={model.output} />
        </div>
      </header>

      <div className="max-h-[28rem] flex-1 overflow-y-auto px-5 py-4">
        <MarkdownRenderer content={model.output} />
      </div>
    </motion.article>
  );
}
