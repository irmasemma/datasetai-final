import type { AgentCard as AgentCardData } from '@datasetai/db';
import { AgentCard } from './AgentCard';

export function CatalogGrid({ agents }: { agents: readonly AgentCardData[] }) {
  if (agents.length === 0) {
    return (
      <p className="rounded border border-dashed border-neutral-300 px-4 py-12 text-center text-sm text-neutral-500 dark:border-neutral-700">
        No agents match these filters yet.
      </p>
    );
  }
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Agent catalog">
      {agents.map((a) => (
        <li key={a.id}>
          <AgentCard agent={a} />
        </li>
      ))}
    </ul>
  );
}
