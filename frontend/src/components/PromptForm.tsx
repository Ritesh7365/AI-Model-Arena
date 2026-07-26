/**
 * Prompt input form for Arena comparisons.
 * Validates with Zod + React Hook Form; submits on button click or Ctrl+Enter.
 */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const promptSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(5, "Prompt must be at least 5 characters"),
});

type PromptFormValues = z.infer<typeof promptSchema>;

interface PromptFormProps {
  loading: boolean;
  onSubmit: (prompt: string) => Promise<void> | void;
}

export function PromptForm({ loading, onSubmit }: PromptFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PromptFormValues>({
    resolver: zodResolver(promptSchema),
    defaultValues: { prompt: "" },
  });

  const submit = handleSubmit(async (values) => {
    await onSubmit(values.prompt);
  });

  return (
    <form
      onSubmit={submit}
      className="mx-auto w-full max-w-3xl rounded-2xl border border-white/10 bg-gray-900 p-4 shadow-xl sm:p-6"
    >
      <Textarea
        {...register("prompt")}
        placeholder="Ask anything..."
        disabled={loading}
        rows={6}
        className="min-h-40 resize-y rounded-2xl border-white/10 bg-gray-950 text-base text-white placeholder:text-gray-500 focus-visible:border-white/20 focus-visible:ring-white/20"
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            void submit();
          }
        }}
      />

      {errors.prompt ? (
        <p className="mt-2 text-sm text-red-400">{errors.prompt.message}</p>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">Press Ctrl+Enter to submit</p>
        <Button
          type="submit"
          disabled={loading}
          size="lg"
          className="rounded-2xl bg-white px-6 text-gray-950 hover:bg-gray-200"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" />
              Comparing...
            </>
          ) : (
            "Compare Models"
          )}
        </Button>
      </div>
    </form>
  );
}
