import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ProductDetail } from '@/types';
import { AcaiBuilderModal } from '@/components/builder/AcaiBuilderModal';
import { useUiStore } from '@/stores/uiStore';

export function ProductPage() {
  const { slug } = useParams();
  const setBuilder = useUiStore((s) => s.setBuilderSlug);

  const { data, isLoading } = useQuery({
    queryKey: ['product', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data } = await api.get<{ data: ProductDetail }>(`/products/slug/${slug}`);
      return data.data;
    },
  });

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse space-y-4 px-4 py-10">
        <div className="h-8 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="aspect-video rounded-3xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{data.name} — Império do Açaí</title>
      </Helmet>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            {data.mainImageUrl ? (
              <img src={data.mainImageUrl} alt={data.name} className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square items-center justify-center text-slate-500">Sem imagem</div>
            )}
          </div>
          <div className="space-y-4">
            <p className="text-sm font-semibold text-fuchsia-600">{data.category.name}</p>
            <h1 className="font-display text-3xl font-black">{data.name}</h1>
            <p className="text-slate-600 dark:text-slate-400">{data.description}</p>
            <p className="text-sm text-slate-500">A partir de R$ {data.minPrice?.toFixed(2)}</p>
            <button
              type="button"
              disabled={!data.available}
              onClick={() => setBuilder(data.slug)}
              className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-700 py-3 text-sm font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {data.available ? 'Montar pedido' : 'Indisponível'}
            </button>
          </div>
        </div>
      </div>
      <AcaiBuilderModal product={data} />
    </>
  );
}
