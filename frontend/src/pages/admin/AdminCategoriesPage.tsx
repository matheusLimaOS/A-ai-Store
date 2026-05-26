import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function AdminCategoriesPage() {
  const { data } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { id: string; name: string; slug: string }[] }>('/admin/categories');
      return data.data;
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-black">Categorias</h1>
      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Slug</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 dark:border-slate-900">
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{c.slug}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
