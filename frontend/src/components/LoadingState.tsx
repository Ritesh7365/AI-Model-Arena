/**
 * Loading indicator shown while Arena model comparison is in progress.
 */
import { Loader2 } from "lucide-react";

export function LoadingState() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-gray-900 px-6 py-16">
      <Loader2 className="size-10 animate-spin text-white" aria-hidden="true" />
      <p className="text-base font-medium text-gray-200">
        Comparing AI Models...
      </p>
    </div>
  );
}
