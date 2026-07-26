/**
 * Home page — prompt entry, loading state, and comparison dashboard.
 */
"use client";

import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { LoadingState } from "@/components/LoadingState";
import { PromptForm } from "@/components/PromptForm";
import { ResultsGrid } from "@/components/ResultsGrid";
import { WinnerCard } from "@/components/WinnerCard";
import { useArena } from "@/hooks/useArena";

export default function HomePage() {
  const { loading, error, result, compare } = useArena();

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pb-20 sm:px-6">
        <Hero />

        <PromptForm loading={loading} onSubmit={compare} />

        {loading ? <LoadingState /> : null}

        {error && !loading ? (
          <div className="mx-auto w-full max-w-3xl rounded-2xl border border-red-500/30 bg-red-950/40 px-5 py-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {result && !loading ? (
          <div className="flex flex-col gap-8">
            <WinnerCard
              winner={result.winner}
              summary={result.summary}
              totalExecutionTime={result.totalExecutionTime}
            />
            <ResultsGrid models={result.models} winner={result.winner} />
          </div>
        ) : null}
      </main>
    </div>
  );
}
