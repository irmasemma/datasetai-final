// Tests for Story E6.1 — Install Metrics (Lifetime / 7d / 30d).
// Real pglite, real installs rows. We compute lifetime / 7d / 30d totals via raw SQL —
// the implementer's installMetrics() helper must produce identical results when it ships.

import { describe, expect, it, beforeAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { bootstrapPglite } from '../../../tests/helpers/pg-bootstrap.js';

interface InstallMetrics {
  readonly lifetime: number;
  readonly last30d: number;
  readonly last7d: number;
}

async function installMetrics(pg: PGlite, agentId: string): Promise<InstallMetrics> {
  const res = await pg.query<{ lifetime: number; last30d: number; last7d: number }>(
    `SELECT
       COUNT(*) FILTER (WHERE success = TRUE)::int AS lifetime,
       COUNT(*) FILTER (WHERE success = TRUE AND created_at > NOW() - INTERVAL '30 days')::int AS last30d,
       COUNT(*) FILTER (WHERE success = TRUE AND created_at > NOW() - INTERVAL '7 days')::int AS last7d
     FROM installs WHERE agent_id = $1`,
    [agentId],
  );
  const r = res.rows[0]!;
  return { lifetime: r.lifetime, last30d: r.last30d, last7d: r.last7d };
}

describe('install metrics (Story E6.1)', () => {
  let pg: PGlite;
  const agentId = 'creator/metric-agent';

  beforeAll(async () => {
    pg = await bootstrapPglite();
    const u = await pg.query<{ id: string }>(
      "INSERT INTO users (email, github_login) VALUES ('m@e.com', 'm') RETURNING id",
    );
    const creatorId = u.rows[0]!.id;
    await pg.query(
      `INSERT INTO agents (id, name, description, primary_format, formats, tool_compatibility, source_type, creator_id, current_version)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        agentId,
        'A',
        'b',
        'claude-skill',
        ['claude-skill'],
        ['claude-code'],
        'direct-publish',
        creatorId,
        '1.0.0',
      ],
    );
    // Seed installs across time ranges.
    // 50 lifetime, 20 in last 30d, 10 in last 7d, 1 failed install (must be excluded)
    for (let i = 0; i < 30; i++) {
      await pg.query(
        `INSERT INTO installs (agent_id, version, install_id, tool_detected, format, success, created_at)
         VALUES ($1, '1.0.0', $2, 'claude-code', 'claude-skill', TRUE, NOW() - INTERVAL '90 days')`,
        [agentId, `iid-old-${i}`],
      );
    }
    for (let i = 0; i < 10; i++) {
      await pg.query(
        `INSERT INTO installs (agent_id, version, install_id, tool_detected, format, success, created_at)
         VALUES ($1, '1.0.0', $2, 'cursor', 'claude-skill', TRUE, NOW() - INTERVAL '20 days')`,
        [agentId, `iid-mid-${i}`],
      );
    }
    for (let i = 0; i < 10; i++) {
      await pg.query(
        `INSERT INTO installs (agent_id, version, install_id, tool_detected, format, success, created_at)
         VALUES ($1, '1.0.0', $2, 'claude-code', 'claude-skill', TRUE, NOW() - INTERVAL '2 days')`,
        [agentId, `iid-new-${i}`],
      );
    }
    // Failed install — must NOT count.
    await pg.query(
      `INSERT INTO installs (agent_id, version, install_id, tool_detected, format, success, error_code, created_at)
       VALUES ($1, '1.0.0', 'failed-1', 'claude-code', 'claude-skill', FALSE, 'NETWORK', NOW())`,
      [agentId],
    );
  }, 30_000);

  it('lifetime = 50 successes, ignores 1 failed install', async () => {
    const m = await installMetrics(pg, agentId);
    expect(m.lifetime).toBe(50);
  });

  it('30-day window includes both 20-day-ago and 2-day-ago installs (20 total)', async () => {
    const m = await installMetrics(pg, agentId);
    expect(m.last30d).toBe(20);
  });

  it('7-day window includes only the 2-day-ago installs (10 total)', async () => {
    const m = await installMetrics(pg, agentId);
    expect(m.last7d).toBe(10);
  });

  it('returns zeros for an agent with no installs', async () => {
    const m = await installMetrics(pg, 'no/installs');
    expect(m.lifetime).toBe(0);
    expect(m.last30d).toBe(0);
    expect(m.last7d).toBe(0);
  });
});
