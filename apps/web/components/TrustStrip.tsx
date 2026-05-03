interface Stats {
  agents: number;
  publishers: number;
  installs30d: number;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function TrustStrip({ stats }: { stats: Stats }) {
  const items: ReadonlyArray<{ value: string; label: string }> = [
    { value: formatCount(stats.agents), label: 'agents indexed' },
    { value: formatCount(stats.publishers), label: 'publishers' },
    { value: formatCount(stats.installs30d), label: 'installs · 30d' },
  ];

  return (
    <section
      aria-label="Registry stats"
      className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border"
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="flex min-w-0 flex-col items-center gap-1 bg-card px-4 py-6 text-center sm:py-8"
        >
          <div className="font-mono text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {item.value}
          </div>
          <div className="whitespace-nowrap text-[10px] uppercase tracking-wide text-muted-foreground sm:text-sm">
            {item.label}
          </div>
        </div>
      ))}
    </section>
  );
}
