interface Stats {
  agents: number;
  publishers: number;
  installs30d: number;
}

export function TrustStrip({ stats }: { stats: Stats }) {
  const items: ReadonlyArray<{ value: string; label: string }> = [
    { value: stats.agents.toLocaleString(), label: 'agents' },
    { value: stats.publishers.toLocaleString(), label: 'publishers' },
    { value: stats.installs30d.toLocaleString(), label: 'installs · 30d' },
  ];

  return (
    <section
      aria-label="Registry stats"
      className="border-y border-border"
    >
      <div className="grid grid-cols-3 divide-x divide-border">
        {items.map((item) => (
          <dl
            key={item.label}
            className="flex flex-col-reverse gap-1 px-5 py-6 sm:px-6 sm:py-7"
          >
            <dt className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px]">
              {item.label}
            </dt>
            <dd className="font-mono text-3xl font-semibold tabular-nums tracking-tight text-foreground sm:text-4xl">
              {item.value}
            </dd>
          </dl>
        ))}
      </div>
      <div className="border-t border-border px-5 py-2 text-right font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:px-6">
        live · last 30 days
      </div>
    </section>
  );
}
