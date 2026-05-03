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
    <div className="rounded-xl border border-border bg-card shadow-sm">
      {/* Window chrome */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-[#ff5f57]/80" aria-hidden />
          <span className="size-3 rounded-full bg-[#febc2e]/80" aria-hidden />
          <span className="size-3 rounded-full bg-[#28c840]/80" aria-hidden />
          <span className="ml-3 font-mono text-xs text-muted-foreground">
            ~/your-project
          </span>
        </div>
        <button
          type="button"
          onClick={onCopy}
          aria-label={copied ? 'Copied to clipboard' : `Copy command: ${command}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-brand-500/60 hover:text-foreground active:scale-[0.98]"
        >
          {copied ? (
            <>
              <svg
                viewBox="0 0 16 16"
                className="size-3.5 text-brand-500"
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

      {/* Tool target tabs */}
      <div
        role="tablist"
        aria-label="Target AI tool"
        id={tabsId}
        className="flex flex-wrap gap-1 border-b border-border px-3 py-2"
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
                'rounded-md px-2.5 py-1 font-mono text-xs transition-colors ' +
                (selected
                  ? 'bg-brand-500/15 text-brand-500'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground')
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Terminal body */}
      <div
        role="tabpanel"
        id={`${tabsId}-panel`}
        aria-labelledby={tabsId}
        className="space-y-1.5 px-5 py-5 font-mono text-[13px] leading-relaxed sm:text-sm"
      >
        <div className="flex items-baseline gap-2">
          <span className="select-none text-brand-500" aria-hidden>
            $
          </span>
          <span className="text-foreground">{command}</span>
        </div>
        <div className="text-muted-foreground">
          <span className="text-brand-500" aria-hidden>
            ✓
          </span>{' '}
          Detected target: <span className="text-foreground">{tool.id}</span> ({tool.detect})
        </div>
        <div className="text-muted-foreground">
          <span className="text-brand-500" aria-hidden>
            ✓
          </span>{' '}
          Resolved <span className="text-foreground">{SAMPLE_AGENT}</span>@1.4.0 — signed
          manifest verified
        </div>
        <div className="text-muted-foreground">
          <span className="text-brand-500" aria-hidden>
            ✓
          </span>{' '}
          Wrote 1 file to{' '}
          <span className="text-foreground">{tool.detect}code-reviewer/</span>
        </div>
        <div className="pt-2 text-muted-foreground">
          Installed <span className="text-foreground">code-reviewer@1.4.0</span> in 2.3s
        </div>
      </div>
    </div>
  );
}
