import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { OrderDTO } from '@/types';
import { ORDER_STATUS_LABEL } from '@/lib/pricing';

export function OrderDetailPage() {
  const { id } = useParams();
  const { data } = useQuery({
    queryKey: ['order', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<{ data: OrderDTO }>(`/orders/${id}`);
      return data.data;
    },
    refetchInterval: 5000,
  });

  if (!data) return <div className="p-10 text-center">Carregando...</div>;

  return (
    <>
      <Helmet>
        <title>Pedido {data.id}</title>
      </Helmet>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        <div>
          <p className="text-sm text-slate-500">Atualização automática a cada poucos segundos</p>
          <h1 className="font-display text-3xl font-black">Pedido</h1>
          <p className="mt-2 text-lg font-semibold text-fuchsia-700 dark:text-fuchsia-300">
            {ORDER_STATUS_LABEL[data.status]}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm font-semibold">Itens</p>
          <ul className="mt-2 space-y-2 text-sm">
            {data.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-2">
                <span>
                  {i.productName} ({i.size}) ×{i.quantity}
                </span>
                <span>R$ {i.lineTotal.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 border-t border-slate-200 pt-3 text-sm dark:border-slate-800">
            <div className="flex justify-between">
              <span>Total</span>
              <span className="font-bold">R$ {data.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
