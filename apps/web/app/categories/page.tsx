import Link from 'next/link';
import { listCategories } from '../../lib/catalog';

export const revalidate = 60;

export const metadata = {
  title: 'Categories',
  alternates: { canonical: '/categories' },
};

export default async function CategoriesIndex() {
  const categories = await listCategories();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Browse by category</h1>
      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">No categories available yet.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <li key={c.category}>
              <Link
                href={`/categories/${encodeURIComponent(c.category)}`}
                className="block rounded border border-border bg-card p-4 transition-colors hover:border-brand-500/50"
              >
                <h2 className="font-medium capitalize">{c.category}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{c.count} agents</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
