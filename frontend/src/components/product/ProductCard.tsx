import { Link } from 'react-router-dom';
import type { ProductListItem } from '@/types';
import { SIZE_LABEL } from '@/lib/pricing';

export function ProductCard({ product }: { product: ProductListItem }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-950">
      <Link to={`/produto/${product.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-900">
          {product.mainImageUrl ? (
            <img
              src={product.mainImageUrl}
              alt={product.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">Sem imagem</div>
          )}
          {!product.available && (
            <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white">
              Indisponível
            </span>
          )}
        </div>
        <div className="space-y-2 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-600">{product.category.name}</p>
          <h3 className="font-display text-lg font-bold leading-snug">{product.name}</h3>
          <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{product.description}</p>
          <p className="text-sm text-slate-500">A partir de</p>
          <p className="text-xl font-black text-slate-900 dark:text-white">R$ {product.minPrice.toFixed(2)}</p>
          <p className="text-xs text-slate-500">
            Tamanhos: {product.sizes.map((s) => SIZE_LABEL[s.size]).join(' · ')}
          </p>
        </div>
      </Link>
    </article>
  );
}

export function ProductGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="aspect-[4/3] rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="mt-4 h-3 w-24 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mt-3 h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mt-2 h-4 w-full rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  );
}
