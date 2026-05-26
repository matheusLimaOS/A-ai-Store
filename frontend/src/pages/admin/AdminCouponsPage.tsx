import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { CouponDTO } from '@/types';

function toDatetimeLocalValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type CouponForm = {
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: string;
  validFrom: string;
  validTo: string;
  maxUses: string;
  active: boolean;
};

function emptyForm(): CouponForm {
  const now = new Date();
  const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    code: '',
    type: 'PERCENT',
    value: '10',
    validFrom: toDatetimeLocalValue(now.toISOString()),
    validTo: toDatetimeLocalValue(week.toISOString()),
    maxUses: '',
    active: true,
  };
}

export function AdminCouponsPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);

  const { data: coupons } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data } = await api.get<{ data: CouponDTO[] }>('/admin/coupons', { params: { page: 1, limit: 100 } });
      return data.data;
    },
  });

  useEffect(() => {
    if (!modalOpen || !editingId || !coupons) return;
    const c = coupons.find((x) => x.id === editingId);
    if (!c) return;
    setForm({
      code: c.code,
      type: c.type,
      value: String(c.value),
      validFrom: toDatetimeLocalValue(typeof c.validFrom === 'string' ? c.validFrom : new Date(c.validFrom).toISOString()),
      validTo: toDatetimeLocalValue(typeof c.validTo === 'string' ? c.validTo : new Date(c.validTo).toISOString()),
      maxUses: c.maxUses != null ? String(c.maxUses) : '',
      active: c.active,
    });
  }, [modalOpen, editingId, coupons]);

  const createMut = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post<{ data: CouponDTO }>('/admin/coupons', body);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Cupom criado');
      setModalOpen(false);
      setEditingId(null);
    },
    onError: () => toast.error('Não foi possível criar o cupom'),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      await api.patch(`/admin/coupons/${id}`, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Cupom atualizado');
      setModalOpen(false);
      setEditingId(null);
    },
    onError: () => toast.error('Não foi possível atualizar o cupom'),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/coupons/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Cupom removido');
    },
    onError: () => toast.error('Não foi possível remover o cupom'),
  });

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setForm(emptyForm());
    setModalOpen(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(form.value.replace(',', '.'));
    if (Number.isNaN(value) || value <= 0) {
      toast.error('Valor inválido');
      return;
    }
    const maxUsesTrim = form.maxUses.trim();
    const maxUses = maxUsesTrim === '' ? null : parseInt(maxUsesTrim, 10);
    if (maxUsesTrim !== '' && (Number.isNaN(maxUses!) || maxUses! < 1)) {
      toast.error('Limite de usos inválido');
      return;
    }
    const validFrom = new Date(form.validFrom).toISOString();
    const validTo = new Date(form.validTo).toISOString();
    if (new Date(validTo) <= new Date(validFrom)) {
      toast.error('Data final deve ser após a inicial');
      return;
    }
    const body = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value,
      validFrom,
      validTo,
      maxUses,
      active: form.active,
    };
    if (!body.code || body.code.length < 3) {
      toast.error('Código deve ter ao menos 3 caracteres');
      return;
    }
    if (editingId) {
      updateMut.mutate({ id: editingId, body });
    } else {
      createMut.mutate(body);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-black">Cupons</h1>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-fuchsia-600/25"
        >
          Novo cupom
        </button>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Vigência</th>
              <th className="px-4 py-3">Uso</th>
              <th className="px-4 py-3">Ativo</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {coupons?.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 dark:border-slate-900">
                <td className="px-4 py-3 font-mono font-semibold">{c.code}</td>
                <td className="px-4 py-3">{c.type === 'PERCENT' ? '%' : 'R$ fixo'}</td>
                <td className="px-4 py-3">{c.type === 'PERCENT' ? `${c.value}%` : `R$ ${Number(c.value).toFixed(2)}`}</td>
                <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                  {new Date(c.validFrom).toLocaleDateString('pt-BR')} — {new Date(c.validTo).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3">
                  {c.usedCount}/{c.maxUses ?? '∞'}
                </td>
                <td className="px-4 py-3">{c.active ? 'Sim' : 'Não'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="text-fuchsia-600 underline dark:text-fuchsia-400" onClick={() => openEdit(c.id)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="text-red-600 underline dark:text-red-400"
                      onClick={() => {
                        if (confirm('Remover este cupom?')) deleteMut.mutate(c.id);
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950"
          >
            <h2 className="font-display text-xl font-bold">{editingId ? 'Editar cupom' : 'Novo cupom'}</h2>
            <form className="mt-4 space-y-3" onSubmit={submit}>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Código</label>
                <input
                  className="field-input mt-1 w-full rounded-xl border px-3 py-2"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                  minLength={3}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Tipo</label>
                <select
                  className="field-select mt-1 w-full rounded-xl px-3 py-2"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as CouponForm['type'] })}
                >
                  <option value="PERCENT">Percentual (%)</option>
                  <option value="FIXED">Valor fixo (R$)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">{form.type === 'PERCENT' ? 'Percentual' : 'Valor (R$)'}</label>
                <input
                  className="field-input mt-1 w-full rounded-xl border px-3 py-2"
                  type="text"
                  inputMode="decimal"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500">Válido de</label>
                  <input
                    type="datetime-local"
                    className="field-input mt-1 w-full rounded-xl border px-3 py-2"
                    value={form.validFrom}
                    onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500">Válido até</label>
                  <input
                    type="datetime-local"
                    className="field-input mt-1 w-full rounded-xl border px-3 py-2"
                    value={form.validTo}
                    onChange={(e) => setForm({ ...form, validTo: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Máx. usos (vazio = ilimitado)</label>
                <input
                  className="field-input mt-1 w-full rounded-xl border px-3 py-2"
                  type="number"
                  min={1}
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                  placeholder="Ilimitado"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                Ativo
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium dark:border-slate-700"
                  onClick={() => {
                    setModalOpen(false);
                    setEditingId(null);
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMut.isPending || updateMut.isPending}
                  className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
