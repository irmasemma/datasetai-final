import Link from 'next/link';
import type { AgentCard as AgentCardData } from '@datasetai/db';
import { SourceBadge } from './SourceBadge';

const FORMAT_LABEL: Record<string, string> = {
  'claude-skill': 'Claude Skill',
  'mcp-server': 'MCP Server',
  'agents-md': 'AGENTS.md',
  cursorrules: '.cursorrules',
  'system-prompt': 'System Prompt',
};

export function AgentCard({ agent }: { agent: AgentCardData }) {
  const tools = agent.toolCompatibility.slice(0, 3);
  const moreTools = agent.toolCompatibility.length - tools.length;

  return (
    <Link
      href={`/agents/${agent.id}`}
      className="group block rounded-lg border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-600"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-neutral-900 group-hover:underline dark:text-neutral-50">
          {agent.name}
        </h3>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            {FORMAT_LABEL[agent.primaryFormat] ?? agent.primaryFormat}
          </span>
          <SourceBadge source={agent.sourceType} />
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
        {agent.description}
      </p>
      <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
        <span>
          {agent.creatorLogin
            ? `by ${agent.creatorLogin}`
            : agent.sourceType !== 'direct-publish'
              ? `mirrored from ${agent.sourceType}`
              : 'unattributed'}
        </span>
        <span>{agent.installCount30d.toLocaleString()} installs/30d</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {tools.map((t) => (
          <span
            key={t}
            className="rounded border border-neutral-200 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-neutral-600 dark:border-neutral-800 dark:text-neutral-400"
          >
            {t}
          </span>
        ))}
        {moreTools > 0 && (
          <span className="text-[10px] text-neutral-400">+{moreTools} more</span>
        )}
        {agent.license && (
          <span className="ml-auto text-[10px] text-neutral-400">{agent.license}</span>
        )}
      </div>
    </Link>
  );
}
