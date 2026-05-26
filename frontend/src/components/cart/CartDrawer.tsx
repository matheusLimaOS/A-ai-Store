import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore, computeCartTotals } from '@/stores/cartStore';
import { useUiStore } from '@/stores/uiStore';

export function CartDrawer() {
  const open = useUiStore((s) => s.cartOpen);
  const setOpen = useUiStore((s) => s.setCartOpen);
  const lines = useCartStore((s) => s.lines);
  const setQty = useCartStore((s) => s.setQty);
  const removeLine = useCartStore((s) => s.removeLine);
  const { subtotal, delivery, total } = computeCartTotals(lines);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button className="absolute inset-0 bg-black/40" aria-label="Fechar" onClick={() => setOpen(false)} />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
          <h2 className="font-display text-lg font-bold">Seu carrinho</h2>
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-900"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {lines.length === 0 && <p className="text-sm text-slate-500">Nada por aqui ainda. Que tal um açaí?</p>}
          {lines.map((l) => (
            <div
              key={l.key}
              className="rounded-2xl border border-slate-200 p-3 text-sm dark:border-slate-800"
            >
              <div className="flex justify-between gap-2">
                <div>
                  <p className="font-semibold">{l.name}</p>
                  <p className="text-xs text-slate-500">
                    {l.size} · R$ {l.unitPrice.toFixed(2)} / un
                  </p>
                  {l.addons.length > 0 && (
                    <p className="mt-1 text-xs text-slate-500">
                      + {l.addons.map((a) => `${a.name} (${a.qty})`).join(', ')}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="text-rose-500"
                  onClick={() => removeLine(l.key)}
                  aria-label="Remover"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 p-1 dark:bg-slate-900">
                  <button
                    type="button"
                    className="rounded-full p-1 hover:bg-white dark:hover:bg-slate-800"
                    onClick={() => setQty(l.key, l.quantity - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{l.quantity}</span>
                  <button
                    type="button"
                    className="rounded-full p-1 hover:bg-white dark:hover:bg-slate-800"
                    onClick={() => setQty(l.key, l.quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <p className="font-bold">R$ {l.lineTotal.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2 border-t border-slate-200 p-4 text-sm dark:border-slate-800">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>R$ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Entrega</span>
            <span>{delivery === 0 ? 'Grátis' : `R$ ${delivery.toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
          <Link
            to="/checkout"
            onClick={() => setOpen(false)}
            className="mt-2 block w-full rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-700 py-3 text-center text-sm font-semibold text-white shadow-lg"
          >
            Finalizar pedido
          </Link>
        </div>
      </aside>
    </div>
  );
}
