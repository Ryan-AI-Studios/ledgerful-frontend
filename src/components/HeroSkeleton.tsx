export function HeroSkeleton() {
  return (
    <section className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] rounded-lg p-6 animate-pulse">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-baseline gap-3">
          <div className="w-24 h-10 rounded bg-[var(--color-surface-raised)]" />
          <div className="w-12 h-6 rounded bg-[var(--color-surface-raised)]" />
          <div className="w-32 h-5 rounded bg-[var(--color-surface-raised)]" />
        </div>
        <div className="w-24 h-5 rounded bg-[var(--color-surface-raised)]" />
      </div>
      <div className="mt-2 w-28 h-4 rounded bg-[var(--color-surface-raised)]" />
      <div className="mt-6 flex flex-wrap items-center gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[var(--color-surface-raised)]" />
            <div className="flex flex-col gap-1">
              <div className="w-12 h-3 rounded bg-[var(--color-surface-raised)]" />
              <div className="w-8 h-4 rounded bg-[var(--color-surface-raised)]" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
