import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

export function AdminDashboardPage() {
  const { data } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await api.get<{
        data: {
          totalSales: number;
          ordersToday: number;
          topProducts: { name: string; quantity: number }[];
          salesLast7Days: { date: string; total: number }[];
        };
      }>('/admin/stats/dashboard');
      return data.data;
    },
  });

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-black">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm text-slate-500">Vendas totais</p>
          <p className="mt-2 text-3xl font-black">R$ {(data?.totalSales ?? 0).toFixed(2)}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm text-slate-500">Pedidos hoje</p>
          <p className="mt-2 text-3xl font-black">{data?.ordersToday ?? 0}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm text-slate-500">Top produto</p>
          <p className="mt-2 text-lg font-bold">{data?.topProducts?.[0]?.name ?? '—'}</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <p className="mb-2 text-sm font-semibold">Vendas (7 dias)</p>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.salesLast7Days ?? []}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#db2777" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="h-72 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <p className="mb-2 text-sm font-semibold">Mais vendidos</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.topProducts ?? []}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="quantity" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
