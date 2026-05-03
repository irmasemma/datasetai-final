// E7.2 verified-publisher badge.

export function VerifiedBadge({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const cls =
    size === 'md'
      ? 'inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-900 dark:bg-blue-900/40 dark:text-blue-200'
      : 'inline-flex items-center gap-0.5 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-900 dark:bg-blue-900/40 dark:text-blue-200';
  return (
    <span title="Verified publisher" className={cls}>
      <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true">
        <path
          fill="currentColor"
          d="M8 0l2 2.5 3.2-.5L13 5l2.5 1.5L13.7 9 14 12l-3-.5L9.5 14 8 11.7 6.5 14 5 11.5 2 12l.3-3L.5 6.5 3 5l-.2-3 3.2.5L8 0z"
        />
      </svg>
      verified
    </span>
  );
}
