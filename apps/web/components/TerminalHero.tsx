'use client';

import { useState, useCallback, useId } from 'react';

const TOOLS = [
  {
    id: 'claude-code',
    label: 'Claude Code',
    flag: '',
    detect: '.claude/skills/',
  },
  { id: 'cursor', label: 'Cursor', flag: '--tool=cursor', detect: '.cursor/rules/' },
  { id: 'codex-cli', label: 'Codex CLI', flag: '--tool=codex', detect: '.codex/' },
  { id: 'aider', label: 'Aider', flag: '--tool=aider', detect: '.aider.conf.yml' },
  { id: 'gemini-cli', label: 'Gemini CLI', flag: '--tool=gemini', detect: '~/.config/gemini/' },
] as const;

type ToolId = (typeof TOOLS)[number]['id'];

const SAMPLE_AGENT = 'voltagent/code-reviewer';

export function TerminalHero() {
  const [active, setActive] = useState<ToolId>('claude-code');
  const [copied, setCopied] = useState(false);
  const liveId = useId();
  const tabsId = useId();

  const tool = TOOLS.find((t) => t.id === active) ?? TOOLS[0]!;
  const command = `npx datasetai install ${SAMPLE_AGENT}${tool.flag ? ` ${tool.flag}` : ''}`;

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may fail in headless / insecure contexts; surface nothing
      // rather than failing loudly — the command is selectable anyway.
    }
  }, [command]);

  return (
    <div className="border border-border bg-card">
      {/* Header — branch indicator + copy */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <span className="inline-flex size-1.5 rounded-full bg-brand-500" aria-hidden />
          ~/your-project
          <span className="text-border" aria-hidden>·</span>
          <span className="text-foreground">main</span>
        </div>
        <button
          type="button"
          onClick={onCopy}
          aria-label={copied ? 'Copied to clipboard' : `Copy command: ${command}`}
          className="inline-flex items-center gap-1.5 border border-border bg-background px-2.5 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-brand-500 hover:text-foreground"
        >
          {copied ? (
            <>
              <svg
                viewBox="0 0 16 16"
                className="size-3.5 text-brand"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M3 8l3.5 3.5L13 5" />
              </svg>
              copied
            </>
          ) : (
            <>
              <svg
                viewBox="0 0 16 16"
                className="size-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <rect x="5" y="5" width="9" height="9" rx="1.5" />
                <path d="M3 10V3.5A1.5 1.5 0 0 1 4.5 2H10" />
              </svg>
              copy
            </>
          )}
        </button>
        <span id={liveId} aria-live="polite" className="sr-only">
          {copied ? 'Command copied to clipboard' : ''}
        </span>
      </div>

      {/* Tool target tabs — typographic underline, not pill */}
      <div
        role="tablist"
        aria-label="Target AI tool"
        id={tabsId}
        className="flex gap-0 overflow-x-auto border-b border-border"
      >
        {TOOLS.map((t) => {
          const selected = active === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${tabsId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(t.id)}
              className={
                'relative whitespace-nowrap border-r border-border px-3 py-2 font-mono text-[11px] transition-colors ' +
                (selected
                  ? 'bg-background text-foreground'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground')
              }
            >
              {t.label}
              {selected && (
                <span
                  aria-hidden
                  className="absolute inset-x-0 -bottom-px h-0.5 bg-brand-500"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Terminal body */}
      <div
        role="tabpanel"
        id={`${tabsId}-panel`}
        aria-labelledby={tabsId}
        className="space-y-2 px-5 py-6 font-mono text-[13px] leading-[1.65] sm:text-sm"
      >
        <div className="overflow-x-auto">
          <div className="flex items-baseline gap-2.5">
            <span className="select-none text-brand" aria-hidden>
              ❯
            </span>
            <span className="whitespace-nowrap text-foreground">{command}</span>
          </div>
        </div>
        <div className="text-muted-foreground">
          <span className="select-none text-brand" aria-hidden>
            ✓
          </span>{' '}
          target → <span className="text-foreground">{tool.id}</span>{' '}
          <span className="text-muted-foreground/70">({tool.detect})</span>
        </div>
        <div className="text-muted-foreground">
          <span className="select-none text-brand" aria-hidden>
            ✓
          </span>{' '}
          resolved <span className="text-foreground">{SAMPLE_AGENT}@1.4.0</span>{' '}
          <span className="text-brand">·</span>{' '}
          <span className="text-foreground">signed</span>
        </div>
        <div className="text-muted-foreground">
          <span className="select-none text-brand" aria-hidden>
            ✓
          </span>{' '}
          wrote{' '}
          <span className="text-foreground">{tool.detect}code-reviewer/</span>
        </div>
        <div className="flex items-baseline gap-2.5 pt-1.5">
          <span className="text-foreground">installed in 2.3s</span>
          <span aria-hidden className="cursor-blink select-none text-brand">▋</span>
        </div>
      </div>
    </div>
  );
}
