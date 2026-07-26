/**
 * Responsive grid of model comparison cards (2 columns desktop, 1 mobile).
 */
"use client";

import { ModelCard } from "@/components/ModelCard";
import type { ModelResponse } from "@/types/arena";

interface ResultsGridProps {
  models: ModelResponse[];
  winner: string;
}

export function ResultsGrid({ models, winner }: ResultsGridProps) {
  return (
    <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
      {models.map((model, index) => (
        <ModelCard
          key={`${model.model}-${index}`}
          model={model}
          index={index}
          isWinner={model.model.toLowerCase() === winner.toLowerCase()}
        />
      ))}
    </section>
  );
}
