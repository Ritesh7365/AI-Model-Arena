/**
 * Landing hero section introducing the Arena value proposition.
 */
export function Hero() {
  return (
    <section className="mx-auto max-w-3xl px-4 pb-10 pt-16 text-center sm:px-6 sm:pt-20">
      <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
        Compare Multiple AI Models Instantly
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-gray-400 sm:text-lg">
        Run the same prompt across Llama, Gemma, Qwen, DeepSeek and Mistral
        simultaneously.
      </p>
    </section>
  );
}
