import { NextResponse } from 'next/server';
import { searchAgents } from '../../../../lib/catalog';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') ?? '';
  const format = url.searchParams.get('format') ?? undefined;
  const tool = url.searchParams.get('tool') ?? undefined;
  const limitRaw = url.searchParams.get('limit');
  const limit = limitRaw ? Math.min(Math.max(Number.parseInt(limitRaw, 10) || 10, 1), 50) : 10;

  if (!query.trim()) {
    return NextResponse.json({ hits: [] });
  }

  const results = await searchAgents(query, { format, tool, limit });
  const hits = results.slice(0, limit).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    primaryFormat: r.primaryFormat,
    installCount30d: r.installCount30d,
  }));
  return NextResponse.json({ hits });
}
