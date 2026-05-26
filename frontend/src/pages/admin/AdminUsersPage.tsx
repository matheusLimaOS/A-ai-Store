import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function AdminUsersPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { id: string; email: string; name: string; role: string; blocked: boolean }[] }>(
        '/admin/users',
        { params: { page: 1, limit: 100 } }
      );
      return data.data;
    },
  });

  const mut = useMutation({
    mutationFn: async (payload: { id: string; blocked?: boolean; role?: 'USER' | 'ADMIN' }) => {
      const { id, ...body } = payload;
      await api.patch(`/admin/users/${id}`, body);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-black">Usuários</h1>
      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Papel</th>
              <th className="px-4 py-3">Bloqueado</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 dark:border-slate-900">
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    className="field-select text-xs"
                    value={u.role}
                    onChange={(e) => mut.mutate({ id: u.id, role: e.target.value as 'USER' | 'ADMIN' })}
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={u.blocked}
                    onChange={(e) => mut.mutate({ id: u.id, blocked: e.target.checked })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
