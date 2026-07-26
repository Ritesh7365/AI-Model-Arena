/**
 * Top navigation bar for the AI Model Arena application.
 */
export function Header() {
  return (
    <header className="w-full border-b border-white/10 bg-gray-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
          <span aria-hidden="true">🤖</span>
          <span>AI Model Arena</span>
        </div>
        <p className="text-sm text-gray-400">Powered by Ollama</p>
      </div>
    </header>
  );
}
