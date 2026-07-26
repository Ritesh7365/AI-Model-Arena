/**
 * Compact badge that displays execution duration in Xm Ys format.
 */
import { Clock } from "lucide-react";

import { formatExecutionTime } from "@/lib/formatTime";
import { cn } from "@/lib/utils";

interface ExecutionBadgeProps {
  milliseconds: number;
  className?: string;
}

export function ExecutionBadge({ milliseconds, className }: ExecutionBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-300",
        className,
      )}
    >
      <Clock className="size-3.5 opacity-70" aria-hidden="true" />
      {formatExecutionTime(milliseconds)}
    </span>
  );
}
