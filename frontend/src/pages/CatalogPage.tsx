import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ProductListItem } from '@/types';
import { ProductCard, ProductGridSkeleton } from '@/components/product/ProductCard';

export function CatalogPage() {
  const [params] = useSearchParams();
  const category = params.get('categoria') ?? undefined;
  const search = params.get('q') ?? undefined;

  const { data, isLoading } = useQuery({
    queryKey: ['products', category, search],
    queryFn: async () => {
      const { data } = await api.get<{ data: ProductListItem[]; meta: { total: number } }>('/products', {
        params: { page: 1, limit: 24, category, search },
      });
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { id: string; name: string; slug: string }[] }>('/categories');
      return data.data;
    },
  });

  return (
    <>
      <Helmet>
        <title>Cardápio — Império do Açaí</title>
      </Helmet>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <div>
          <h1 className="font-display text-3xl font-black">Cardápio</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Escolha uma categoria ou busque pelo seu favorito.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/cardapio"
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              !category ? 'bg-fuchsia-600 text-white' : 'bg-slate-100 dark:bg-slate-900'
            }`}
          >
            Todos
          </Link>
          {categories?.map((c) => (
            <Link
              key={c.id}
              to={`/cardapio?categoria=${encodeURIComponent(c.slug)}`}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                category === c.slug ? 'bg-fuchsia-600 text-white' : 'bg-slate-100 dark:bg-slate-900'
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
        {isLoading && <ProductGridSkeleton />}
        {!isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data?.data.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
