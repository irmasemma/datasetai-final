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
    title: `${slug} agents`,
    description: `Browse AI agents in the ${slug} category.`,
    alternates: { canonical: `/categories/${slug}` },
  };
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const agents = await listAgents({ category: slug, sort: 'most-installed', limit: 100 });
  if (agents.length === 0) notFound();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold capitalize">{slug}</h1>
      <p className="text-sm text-muted-foreground">{agents.length} agents in this category.</p>
      <CatalogGrid agents={agents} />
    </div>
  );
}
