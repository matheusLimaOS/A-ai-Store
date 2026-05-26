import { Helmet } from 'react-helmet-async';
import { Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useCartStore, computeCartTotals } from '@/stores/cartStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { AxiosError, isAxiosError } from 'axios';

export function CheckoutPage() {
  const lines = useCartStore((s) => s.lines);
  const clear = useCartStore((s) => s.clear);
  const { subtotal, delivery, total } = computeCartTotals(lines);
  const nav = useNavigate();
  const [coupon, setCoupon] = useState('');
  const [payment, setPayment] = useState<'PIX' | 'CARD' | 'CASH'>('PIX');
  const [addr, setAddr] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: 'SP',
    zip: '',
  });

  if (!lines.length) return <Navigate to="/cardapio" replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const items = lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        size: l.size,
        addons: l.addons.map((a) => ({ addonId: a.addonId, qty: a.qty })),
        notes: l.notes,
      }));
      const { data } = await api.post('/orders', {
        paymentMethod: payment,
        couponCode: coupon.trim() || undefined,
        delivery: addr,
        items,
      });
      clear();
      toast.success('Pedido criado!');
      nav(`/pedidos/${data.data.id}`);
    } catch (error) {
      if(isAxiosError(error)) {
        toast.error(error.response?.data.message);
      } else {
        toast.error('Revise os dados ou cupom');
      }
    }
  }

  const fields: { key: keyof typeof addr; label: string; required?: boolean }[] = [
    { key: 'street', label: 'Rua', required: true },
    { key: 'number', label: 'Número', required: true },
    { key: 'complement', label: 'Complemento' },
    { key: 'neighborhood', label: 'Bairro', required: true },
    { key: 'city', label: 'Cidade', required: true },
    { key: 'state', label: 'UF', required: true },
    { key: 'zip', label: 'CEP', required: true },
  ];

  return (
    <>
      <Helmet>
        <title>Checkout — Império do Açaí</title>
      </Helmet>
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-2">
        <form
          onSubmit={submit}
          className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950"
        >
          <h1 className="font-display text-2xl font-bold">Entrega</h1>
          {fields.map((f) => (
            <div key={f.key}>
              <label className="text-xs font-semibold uppercase text-slate-500">{f.label}</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800 dark:bg-slate-950"
                value={addr[f.key]}
                onChange={(e) => setAddr({ ...addr, [f.key]: e.target.value })}
                required={f.required}
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Pagamento</label>
            <select
              className="field-select mt-1 w-full rounded-xl px-3 py-2"
              value={payment}
              onChange={(e) => setPayment(e.target.value as typeof payment)}
            >
              <option value="PIX">PIX</option>
              <option value="CARD">Cartão</option>
              <option value="CASH">Dinheiro</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Cupom</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 uppercase dark:border-slate-800 dark:bg-slate-950"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="IMPERIO10"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-700 py-3 text-sm font-bold text-white"
          >
            Confirmar pedido
          </button>
        </form>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="font-display text-xl font-bold">Resumo</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {lines.map((l) => (
              <li key={l.key} className="flex justify-between gap-2">
                <span>
                  {l.name} ×{l.quantity}
                </span>
                <span>R$ {l.lineTotal.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 border-t border-slate-200 pt-4 text-sm dark:border-slate-800">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Entrega</span>
              <span>{delivery === 0 ? 'Grátis' : `R$ ${delivery.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>Total estimado</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
            <p className="text-xs text-slate-500">O cupom é validado no servidor ao confirmar.</p>
          </div>
        </div>
      </div>
    </>
  );
}
