/**
 * Minimal full-screen fallback shown by React Suspense while a lazy page chunk loads.
 * Intentionally lightweight — no state, no timers, instant render.
 */
export default function PageLoaderFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Dual-ring spinner using the site's primary (violet) color */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
        </div>
        <span className="text-xs font-mono tracking-widest text-muted-foreground/50 uppercase">
          Loading…
        </span>
      </div>
    </div>
  );
}
