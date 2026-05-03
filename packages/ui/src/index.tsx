// @datasetai/ui — shared React components.
// Real components (catalog cards, listing detail, install panel, etc.) ship per-story in Epic 2+.

import type { ReactElement } from 'react';

export function Brand(): ReactElement {
  return <span className="font-semibold tracking-tight">datasetai.xyz</span>;
}
