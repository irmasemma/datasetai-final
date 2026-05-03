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
    { value: formatCount(stats.agents), label: 'agents' },
    { value: formatCount(stats.publishers), label: 'publishers' },
    { value: formatCount(stats.installs30d), label: 'installs · 30d' },
  ];

  return (
    <section
      aria-label="Registry stats"
      className="border-y border-border py-4"
    >
      <ul className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-2 font-mono text-[13px] sm:gap-x-6 sm:text-sm">
        {items.map((item, idx) => (
          <li
            key={item.label}
            className="flex items-baseline gap-2"
          >
            <span className="font-semibold text-foreground">{item.value}</span>
            <span className="text-muted-foreground">{item.label}</span>
            {idx < items.length - 1 && (
              <span aria-hidden className="ml-3 text-border sm:ml-6">/</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
