import Link from 'next/link';
import { listCategories } from '../../lib/catalog';

export const revalidate = 60;

export const metadata = {
  title: 'Categories — datasetai.xyz',
};

export default async function CategoriesIndex() {
  const categories = await listCategories();
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Browse by category</h1>
      {categories.length === 0 ? (
        <p className="text-sm text-neutral-500">No categories available yet.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <li key={c.category}>
              <Link
                href={`/categories/${encodeURIComponent(c.category)}`}
                className="block rounded border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
              >
                <h2 className="font-medium capitalize">{c.category}</h2>
                <p className="mt-1 text-xs text-neutral-500">{c.count} agents</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
