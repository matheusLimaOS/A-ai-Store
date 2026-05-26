import { Helmet } from 'react-helmet-async';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { UserProfile } from '@/types';
import { toast } from 'sonner';

export function ProfilePage() {
  const qc = useQueryClient();
  const { data, refetch } = useQuery({
    queryKey: ['me-profile'],
    queryFn: async () => {
      const { data } = await api.get<{ data: UserProfile }>('/users/me');
      return data.data;
    },
  });
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cur, setCur] = useState('');
  const [nw, setNw] = useState('');

  useEffect(() => {
    if (data) {
      setName(data.name);
      setPhone(data.phone ?? '');
    }
  }, [data]);

  const update = useMutation({
    mutationFn: async () => {
      await api.patch('/users/me', { name, phone: phone || null });
    },
    onSuccess: async () => {
      toast.success('Perfil atualizado');
      await refetch();
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const pwd = useMutation({
    mutationFn: async (body: { currentPassword: string; newPassword: string }) => {
      await api.patch('/users/me/password', body);
    },
    onSuccess: () => toast.success('Senha alterada'),
  });

  if (!data) return <div className="p-10 text-center">Carregando...</div>;

  return (
    <>
      <Helmet>
        <title>Perfil</title>
      </Helmet>
      <div className="mx-auto max-w-xl space-y-8 px-4 py-10">
        <h1 className="font-display text-3xl font-black">Perfil</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            update.mutate();
          }}
          className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950"
        >
          <div>
            <label className="text-sm font-medium">Nome</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 dark:bg-slate-950"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Telefone</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 dark:bg-slate-950"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full rounded-xl bg-fuchsia-600 py-3 text-sm font-bold text-white">
            Salvar
          </button>
        </form>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            pwd.mutate({ currentPassword: cur, newPassword: nw });
          }}
          className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950"
        >
          <h2 className="font-semibold">Alterar senha</h2>
          <input
            type="password"
            placeholder="Senha atual"
            className="w-full rounded-xl border px-3 py-2 dark:bg-slate-950"
            value={cur}
            onChange={(e) => setCur(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Nova senha"
            className="w-full rounded-xl border px-3 py-2 dark:bg-slate-950"
            value={nw}
            onChange={(e) => setNw(e.target.value)}
            required
          />
          <button type="submit" className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-900">
            Atualizar senha
          </button>
        </form>
      </div>
    </>
  );
}
