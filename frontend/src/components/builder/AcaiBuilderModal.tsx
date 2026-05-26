import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { ProductDetail, ProductSize } from '@/types';
import { SIZE_LABEL, unitPriceFor, type AddonSelection } from '@/lib/pricing';
import { useCartStore } from '@/stores/cartStore';
import { useUiStore } from '@/stores/uiStore';
import { toast } from 'sonner';

type Props = {
  product: ProductDetail;
};

export function AcaiBuilderModal({ product }: Props) {
  const slug = useUiStore((s) => s.builderProductSlug);
  const setSlug = useUiStore((s) => s.setBuilderSlug);
  const addLine = useCartStore((s) => s.addLine);
  const setCartOpen = useUiStore((s) => s.setCartOpen);

  const [size, setSize] = useState<ProductSize>(product.sizes[0]?.size ?? 'ML_300');
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');

  const selectionList: AddonSelection[] = useMemo(
    () =>
      Object.entries(selections)
        .filter(([, q]) => q > 0)
        .map(([addonId, qty]) => ({ addonId, qty })),
    [selections]
  );

  const unit = useMemo(() => {
    try {
      return unitPriceFor(product, size, selectionList);
    } catch {
      return product.sizes.find((s) => s.size === size)?.price ?? 0;
    }
  }, [product, size, selectionList]);

  if (slug !== product.slug) return null;

  function close() {
    setSlug(null);
  }

  function bump(addonId: string, delta: number) {
    setSelections((prev) => {
      const addon = product.addons.find((a) => a.id === addonId);
      const cur = prev[addonId] ?? 0;
      const next = Math.max(0, cur + delta);
      if (addon?.maxPerOrder != null && next > addon.maxPerOrder) {
        toast.error('Quantidade máxima para este adicional atingida');
        return prev;
      }
      return { ...prev, [addonId]: next };
    });
  }

  function handleAdd() {
    try {
      const addons = selectionList.map((s) => {
        const a = product.addons.find((x) => x.id === s.addonId)!;
        return { addonId: s.addonId, name: a.name, qty: s.qty, unitPrice: a.price };
      });
      addLine({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.mainImageUrl,
        size,
        quantity: 1,
        addons,
        notes: notes.trim() || undefined,
        unitPrice: unit,
        lineTotal: unit,
      });
      toast.success('Adicionado ao carrinho');
      close();
      setCartOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível adicionar');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button className="absolute inset-0 bg-black/50" aria-label="Fechar" onClick={close} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-950 sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-600">Monte o seu</p>
            <h3 className="font-display text-xl font-bold">{product.name}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Até {product.freeToppingsLimit} complementos elegíveis sem custo extra (regras aplicadas no preço).
            </p>
          </div>
          <button type="button" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-900" onClick={close}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold">Tamanho</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {product.sizes.map((s) => (
              <button
                key={s.size}
                type="button"
                onClick={() => setSize(s.size)}
                className={`rounded-xl border px-2 py-2 text-sm font-medium ${
                  size === s.size
                    ? 'border-fuchsia-600 bg-fuchsia-50 text-fuchsia-800 dark:bg-fuchsia-950/40 dark:text-fuchsia-200'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
                }`}
              >
                <div>{SIZE_LABEL[s.size]}</div>
                <div className="text-xs opacity-80">R$ {s.price.toFixed(2)}</div>
              </button>
            ))}
          </div>
        </div>

        {product.addons.length > 0 && (
          <div className="mt-5">
            <p className="text-sm font-semibold">Complementos</p>
            <div className="mt-2 space-y-2">
              {product.addons.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-800"
                >
                  <div>
                    <p className="font-medium">{a.name}</p>
                    <p className="text-xs text-slate-500">
                      {a.countsTowardFree ? 'Pode contar no limite grátis' : 'Pago'} · R$ {a.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="h-8 w-8 rounded-full bg-slate-100 text-lg leading-none dark:bg-slate-900"
                      onClick={() => bump(a.id, -1)}
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-semibold">{selections[a.id] ?? 0}</span>
                    <button
                      type="button"
                      className="h-8 w-8 rounded-full bg-slate-100 text-lg leading-none dark:bg-slate-900"
                      onClick={() => bump(a.id, 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <label className="text-sm font-semibold" htmlFor="notes">
            Observações
          </label>
          <textarea
            id="notes"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex.: poupa mel, sem granola..."
          />
        </div>

        <div className="sticky bottom-0 mt-5 flex items-center justify-between gap-3 border-t border-slate-200 bg-white pt-4 dark:border-slate-800 dark:bg-slate-950">
          <div>
            <p className="text-xs text-slate-500">Preço por copo</p>
            <p className="text-2xl font-black text-fuchsia-600 dark:text-fuchsia-400">R$ {unit.toFixed(2)}</p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-700 px-6 py-3 text-sm font-bold text-white shadow-lg"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
