import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { OrderDTO, OrderStatus } from '@/types';
import { ORDER_STATUS_LABEL } from '@/lib/pricing';

const statuses: OrderStatus[] = ['PENDING', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

export function AdminOrdersPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data } = await api.get<{ data: OrderDTO[] }>('/admin/orders', { params: { page: 1, limit: 50 } });
      return data.data;
    },
    refetchInterval: 5000,
  });

  const mut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      await api.patch(`/admin/orders/${id}/status`, { status });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-orders'] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-black">Pedidos</h1>
      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Imprimir</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((o) => (
              <tr key={o.id} className="border-b border-slate-100 dark:border-slate-900">
                <td className="px-4 py-3 font-mono text-xs">{o.id.slice(0, 8)}</td>
                <td className="px-4 py-3">{o.user?.name ?? o.userId}</td>
                <td className="px-4 py-3">R$ {o.total.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <select
                    className="field-select text-xs"
                    value={o.status}
                    onChange={(e) => mut.mutate({ id: o.id, status: e.target.value as OrderStatus })}
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {ORDER_STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="text-fuchsia-600 underline"
                    onClick={async () => {
                      const res = await api.get<string>(`/admin/orders/${o.id}/print`, { responseType: 'text' });
                      const w = window.open('', '_blank');
                      w?.document.write(res.data);
                      w?.document.close();
                    }}
                  >
                    Imprimir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
