import type { MetadataRoute } from 'next';
import { listAgents, listCategories } from '../lib/catalog';
import { SITE_URL } from '../lib/site';

export const revalidate = 3600;

const STATIC_ROUTES: ReadonlyArray<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
}> = [
  { path: '/', changeFrequency: 'daily', priority: 1.0 },
  { path: '/agents', changeFrequency: 'hourly', priority: 0.9 },
  { path: '/categories', changeFrequency: 'daily', priority: 0.7 },
  { path: '/pricing', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [agents, categories] = await Promise.all([
    listAgents({ limit: 5000, sort: 'recent' }),
    listCategories(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const agentEntries: MetadataRoute.Sitemap = agents.map((a) => ({
    url: `${SITE_URL}/agents/${a.id}`,
    lastModified: a.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/categories/${c.category}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.5,
  }));

  const creatorLogins = Array.from(
    new Set(agents.map((a) => a.creatorLogin).filter((l): l is string => Boolean(l))),
  );
  const creatorEntries: MetadataRoute.Sitemap = creatorLogins.map((login) => ({
    url: `${SITE_URL}/creators/${login}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  return [...staticEntries, ...agentEntries, ...categoryEntries, ...creatorEntries];
}
