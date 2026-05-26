import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { OrderDTO } from '@/types';
import { ORDER_STATUS_LABEL } from '@/lib/pricing';

export function OrdersPage() {
  const { data } = useQuery({
    queryKey: ['orders', 'mine'],
    queryFn: async () => {
      const { data } = await api.get<{ data: OrderDTO[] }>('/orders', { params: { page: 1, limit: 50 } });
      return data.data;
    },
    refetchInterval: 8000,
  });

  return (
    <>
      <Helmet>
        <title>Meus pedidos</title>
      </Helmet>
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-10">
        <h1 className="font-display text-3xl font-black">Meus pedidos</h1>
        <div className="space-y-3">
          {data?.map((o) => (
            <Link
              key={o.id}
              to={`/pedidos/${o.id}`}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 hover:border-fuchsia-300 dark:border-slate-800 dark:bg-slate-950"
            >
              <div>
                <p className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleString('pt-BR')}</p>
                <p className="font-semibold">Pedido #{o.id.slice(0, 8)}</p>
                <p className="text-sm text-fuchsia-700 dark:text-fuchsia-300">{ORDER_STATUS_LABEL[o.status]}</p>
              </div>
              <p className="font-bold">R$ {o.total.toFixed(2)}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
