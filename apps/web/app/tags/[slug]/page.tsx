import { notFound } from 'next/navigation';
import { listAgents } from '../../../lib/catalog';
import { CatalogGrid } from '../../../components/CatalogGrid';

export const revalidate = 60;

interface Params {
  slug: string;
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  return {
    title: `#${slug}`,
    description: `Agents tagged ${slug}.`,
    alternates: { canonical: `/tags/${slug}` },
  };
}

export default async function TagPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const agents = await listAgents({ tag: slug, sort: 'most-installed', limit: 100 });
  if (agents.length === 0) notFound();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">#{slug}</h1>
      <p className="text-sm text-muted-foreground">{agents.length} agents with this tag.</p>
      <CatalogGrid agents={agents} />
    </div>
  );
}
