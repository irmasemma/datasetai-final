// Tests for Story E6.5 — CSV Export.
// Real pglite. We compute the per-day rollup over 90d and verify CSV header + values.
// Implementer's GET /me/agents/<id>/dashboard/export route must produce identical bytes.

import { describe, expect, it, beforeAll } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { bootstrapPglite } from '../../../tests/helpers/pg-bootstrap.js';

interface ExportRow {
  date: string;
  agentId: string;
  version: string;
  toolDetected: string;
  count: number;
}

async function exportRows(pg: PGlite, agentId: string): Promise<ExportRow[]> {
  const res = await pg.query<{
    date: string;
    agent_id: string;
    version: string;
    tool_detected: string | null;
    count: number;
  }>(
    `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS date,
            agent_id,
            version,
            COALESCE(tool_detected, 'unknown') AS tool_detected,
            COUNT(*)::int AS count
     FROM installs
     WHERE agent_id = $1 AND success = TRUE AND created_at > NOW() - INTERVAL '90 days'
     GROUP BY date, agent_id, version, tool_detected
     ORDER BY date ASC, version, tool_detected`,
    [agentId],
  );
  return res.rows.map((r) => ({
    date: r.date,
    agentId: r.agent_id,
    version: r.version,
    toolDetected: r.tool_detected ?? 'unknown',
    count: r.count,
  }));
}

function rowsToCsv(rows: readonly ExportRow[]): string {
  const header = 'date,agent_id,version,tool_detected,count';
  const lines = rows.map((r) =>
    [r.date, r.agentId, r.version, r.toolDetected, String(r.count)]
      .map((v) => (v.includes(',') ? `"${v}"` : v))
      .join(','),
  );
  return [header, ...lines].join('\n') + '\n';
}

describe('dashboard CSV export (Story E6.5)', () => {
  let pg: PGlite;
  const agentId = 'creator/csv-agent';

  beforeAll(async () => {
    pg = await bootstrapPglite();
    const u = await pg.query<{ id: string }>(
      "INSERT INTO users (email, github_login) VALUES ('csv@e.com', 'csv') RETURNING id",
    );
    await pg.query(
      `INSERT INTO agents (id, name, description, primary_format, formats, tool_compatibility, source_type, creator_id, current_version)
       VALUES ($1, 'CSV', 'd', 'claude-skill', ARRAY['claude-skill']::text[], ARRAY['claude-code']::text[], 'direct-publish', $2, '1.0.0')`,
      [agentId, u.rows[0]!.id],
    );
    for (let i = 0; i < 4; i++) {
      await pg.query(
        `INSERT INTO installs (agent_id, version, install_id, tool_detected, format, success, created_at)
         VALUES ($1, '1.0.0', $2, 'claude-code', 'claude-skill', TRUE, NOW() - INTERVAL '5 days')`,
        [agentId, `i-${i}`],
      );
    }
    // Old install — outside 90d, must NOT be in CSV.
    await pg.query(
      `INSERT INTO installs (agent_id, version, install_id, tool_detected, format, success, created_at)
       VALUES ($1, '1.0.0', 'old-1', 'claude-code', 'claude-skill', TRUE, NOW() - INTERVAL '120 days')`,
      [agentId],
    );
  }, 30_000);

  it('export returns rows for the last 90 days only', async () => {
    const rows = await exportRows(pg, agentId);
    expect(rows.length).toBe(1);
    expect(rows[0]!.count).toBe(4);
    expect(rows[0]!.toolDetected).toBe('claude-code');
  });

  it('CSV starts with the required header row', async () => {
    const rows = await exportRows(pg, agentId);
    const csv = rowsToCsv(rows);
    expect(csv.split('\n')[0]).toBe('date,agent_id,version,tool_detected,count');
  });

  it('CSV body rows contain the exact column values', async () => {
    const rows = await exportRows(pg, agentId);
    const csv = rowsToCsv(rows);
    const lines = csv.trim().split('\n');
    expect(lines[1]).toContain(agentId);
    expect(lines[1]).toContain('1.0.0');
    expect(lines[1]).toContain('claude-code');
    expect(lines[1]).toContain('4');
  });

  it.todo(
    'GET /me/agents/:id/dashboard/export?format=csv handler returns Content-Type: text/csv — EXPECTS apps/web/app/me/agents/[id]/dashboard/export/route.ts',
  );
});
