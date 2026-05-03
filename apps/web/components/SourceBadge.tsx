// E5.7 source attribution badge. Shown when a listing's source isn't first-party.

const LABELS: Record<string, string> = {
  'voltagent-mirror': 'VoltAgent',
  'github-mirror': 'GitHub',
  'smithery-mirror': 'Smithery',
  'prompts-chat-mirror': 'prompts.chat',
  'cursor-directory-mirror': 'Cursor Directory',
  'skillsmp-mirror': 'SkillsMP',
};

export function SourceBadge({ source }: { source: string }) {
  if (source === 'direct-publish') return null;
  const label = LABELS[source] ?? source;
  return (
    <span
      title={`Mirrored from ${label}`}
      className="inline-flex items-center rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
    >
      mirror · {label}
    </span>
  );
}
