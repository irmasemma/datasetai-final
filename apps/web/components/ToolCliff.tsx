// Wordmark-only "where this works" proof. No logo files (avoids trademark
// soup, matches the editorial voice). Hairline dividers + hover light-up.

const TOOLS: ReadonlyArray<string> = [
  'Claude Code',
  'Cursor',
  'Codex CLI',
  'Aider',
  'Gemini CLI',
];

export function ToolCliff() {
  return (
    <section
      aria-label="Supported AI tools"
      className="border-y border-border"
    >
      <ul className="grid grid-cols-2 divide-x divide-border sm:grid-cols-5">
        {TOOLS.map((name, idx) => (
          <li
            key={name}
            className={
              'flex items-center justify-center px-3 py-5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground sm:py-6 sm:text-xs ' +
              // top border on the wrapping rows for the 2-col mobile layout
              (idx >= 2 ? 'border-t border-border sm:border-t-0' : '')
            }
          >
            {name}
          </li>
        ))}
      </ul>
    </section>
  );
}
