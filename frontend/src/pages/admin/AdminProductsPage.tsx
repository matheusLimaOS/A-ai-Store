import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, apiUrl } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { ProductDetail, ProductListItem, ProductSize } from '@/types';
import { SIZE_LABEL } from '@/lib/pricing';

const ALL_SIZES: ProductSize[] = ['ML_300', 'ML_500', 'ML_700', 'ML_1000'];

type CategoryRow = { id: string; name: string; slug: string };

type AddonRow = { name: string; price: string; countsTowardFree: boolean; maxPerOrder: string };

function defaultSizePrices(): Record<ProductSize, string> {
  return {
    ML_300: '12',
    ML_500: '16',
    ML_700: '20',
    ML_1000: '26',
  };
}

function emptyAddon(): AddonRow {
  return { name: '', price: '0', countsTowardFree: true, maxPerOrder: '' };
}

type ProductForm = {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  available: boolean;
  freeToppingsLimit: string;
  mainImageUrl: string;
  sizePrices: Record<ProductSize, string>;
  addons: AddonRow[];
};

function emptyProductForm(categoryId: string): ProductForm {
  return {
    name: '',
    slug: '',
    description: '',
    categoryId,
    available: true,
    freeToppingsLimit: '3',
    mainImageUrl: '',
    sizePrices: defaultSizePrices(),
    addons: [],
  };
}

function detailToForm(d: ProductDetail, categoryId: string): ProductForm {
  const sizePrices = defaultSizePrices();
  for (const s of d.sizes) {
    sizePrices[s.size] = String(s.price);
  }
  return {
    name: d.name,
    slug: d.slug,
    description: d.description,
    categoryId: d.category.id ?? categoryId,
    available: d.available,
    freeToppingsLimit: String(d.freeToppingsLimit),
    mainImageUrl: d.mainImageUrl ?? '',
    sizePrices,
    addons: d.addons.map((a) => ({
      name: a.name,
      price: String(a.price),
      countsTowardFree: a.countsTowardFree,
      maxPerOrder: a.maxPerOrder != null ? String(a.maxPerOrder) : '',
    })),
  };
}

async function uploadProductImage(productId: string, file: File) {
  const fd = new FormData();
  fd.append('file', file);
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(apiUrl(`/admin/products/${productId}/image`), {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Falha no upload');
  }
}

export function AdminProductsPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState<ProductForm | null>(null);

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data } = await api.get<{ data: CategoryRow[] }>('/admin/categories');
      return data.data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data } = await api.get<{ data: ProductListItem[] }>('/admin/products', { params: { page: 1, limit: 100 } });
      return data.data;
    },
  });

  const { data: detail } = useQuery({
    queryKey: ['admin-product', editingId],
    enabled: modalOpen && !!editingId,
    queryFn: async () => {
      const { data } = await api.get<{ data: ProductDetail }>(`/admin/products/${editingId}`);
      return data.data;
    },
  });

  useEffect(() => {
    if (!modalOpen || !categories?.length) return;
    if (editingId) {
      if (detail) {
        setForm(detailToForm(detail, categories[0].id));
      }
    } else {
      setForm(emptyProductForm(categories[0].id));
    }
  }, [modalOpen, editingId, detail, categories]);

  const createMut = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post<{ data: ProductDetail }>('/admin/products', body);
      return data.data;
    },
    onSuccess: async (created) => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      if (imageFile) {
        try {
          await uploadProductImage(created.id, imageFile);
          qc.invalidateQueries({ queryKey: ['admin-product', created.id] });
        } catch {
          toast.error('Produto criado, mas o upload da imagem falhou');
        }
      }
      toast.success('Produto criado');
      closeModal();
    },
    onError: () => toast.error('Não foi possível criar o produto'),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      const { data } = await api.patch<{ data: ProductDetail }>(`/admin/products/${id}`, body);
      return data.data;
    },
    onSuccess: async (updated) => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['admin-product', updated.id] });
      if (imageFile) {
        try {
          await uploadProductImage(updated.id, imageFile);
        } catch {
          toast.error('Produto salvo, mas o upload da imagem falhou');
        }
      }
      toast.success('Produto atualizado');
      closeModal();
    },
    onError: () => toast.error('Não foi possível salvar o produto'),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/products/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Produto removido');
    },
    onError: () => toast.error('Não foi possível remover o produto'),
  });

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(null);
    setImageFile(null);
  }

  function openCreate() {
    if (!categories?.length) {
      toast.error('Cadastre uma categoria antes');
      return;
    }
    setEditingId(null);
    setForm(null);
    setImageFile(null);
    setModalOpen(true);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setForm(null);
    setImageFile(null);
    setModalOpen(true);
  }

  function buildPayload(): Record<string, unknown> | null {
    if (!form) return null;
    const sizes = ALL_SIZES.map((size) => ({
      size,
      price: parseFloat(String(form.sizePrices[size]).replace(',', '.')),
    })).filter((r) => !Number.isNaN(r.price) && r.price > 0);
    if (!sizes.length) {
      toast.error('Informe ao menos um tamanho com preço maior que zero');
      return null;
    }
    const addons: { name: string; price: number; countsTowardFree: boolean; maxPerOrder: number | null }[] = [];
    for (const a of form.addons.filter((x) => x.name.trim())) {
      let maxPerOrder: number | null = null;
      if (a.maxPerOrder.trim()) {
        const n = parseInt(a.maxPerOrder, 10);
        if (Number.isNaN(n) || n < 1) {
          toast.error(`Máx. por pedido inválido no adicional "${a.name.trim()}"`);
          return null;
        }
        maxPerOrder = n;
      }
      addons.push({
        name: a.name.trim(),
        price: parseFloat(String(a.price).replace(',', '.')) || 0,
        countsTowardFree: a.countsTowardFree,
        maxPerOrder,
      });
    }
    const freeToppingsLimit = parseInt(form.freeToppingsLimit, 10);
    if (Number.isNaN(freeToppingsLimit) || freeToppingsLimit < 0 || freeToppingsLimit > 20) {
      toast.error('Limite de complementos grátis deve ser entre 0 e 20');
      return null;
    }
    const mainTrim = form.mainImageUrl.trim();
    let mainImageUrl: string | null | undefined;
    if (mainTrim) {
      try {
        const u = new URL(mainTrim);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error();
        mainImageUrl = mainTrim;
      } catch {
        toast.error('URL da imagem inválida');
        return null;
      }
    } else {
      mainImageUrl = editingId ? null : undefined;
    }
    const slugTrim = form.slug.trim();
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description.trim(),
      categoryId: form.categoryId,
      available: form.available,
      freeToppingsLimit,
      sizes,
      addons,
    };
    if (slugTrim) payload.slug = slugTrim;
    if (mainImageUrl !== undefined) payload.mainImageUrl = mainImageUrl;
    if (!form.name.trim() || !form.description.trim()) {
      toast.error('Nome e descrição são obrigatórios');
      return null;
    }
    return payload;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = buildPayload();
    if (!payload) return;
    if (editingId) {
      updateMut.mutate({ id: editingId, body: payload });
    } else {
      createMut.mutate(payload);
    }
  }

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-black">Produtos</h1>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-fuchsia-600/25"
        >
          Novo produto
        </button>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Ativo</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {products?.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 dark:border-slate-900">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">{p.slug}</td>
                <td className="px-4 py-3">{p.category.name}</td>
                <td className="px-4 py-3">{p.available ? 'Sim' : 'Não'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="text-fuchsia-600 underline dark:text-fuchsia-400" onClick={() => openEdit(p.id)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="text-red-600 underline dark:text-red-400"
                      onClick={() => {
                        if (confirm('Remover este produto?')) deleteMut.mutate(p.id);
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

      {modalOpen && (editingId && !form ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 text-sm font-medium dark:border-slate-800 dark:bg-slate-950">
            Carregando produto…
          </div>
        </div>
      ) : form ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950"
          >
            <h2 className="font-display text-xl font-bold">{editingId ? 'Editar produto' : 'Novo produto'}</h2>
            <form className="mt-4 space-y-4" onSubmit={submit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold uppercase text-slate-500">Nome</label>
                  <input
                    className="field-input mt-1 w-full rounded-xl px-3 py-2"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500">Slug (opcional)</label>
                  <input
                    className="field-input mt-1 w-full rounded-xl px-3 py-2"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="gerado a partir do nome se vazio"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500">Categoria</label>
                  <select
                    className="field-select mt-1 w-full rounded-xl px-3 py-2"
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    required
                  >
                    {categories?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold uppercase text-slate-500">Descrição</label>
                  <textarea
                    className="field-input mt-1 min-h-[100px] w-full rounded-xl px-3 py-2"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500">URL da imagem principal</label>
                  <input
                    className="field-input mt-1 w-full rounded-xl px-3 py-2"
                    value={form.mainImageUrl}
                    onChange={(e) => setForm({ ...form, mainImageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500">Ou enviar arquivo (JPEG/PNG)</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="field-input mt-1 w-full rounded-xl px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-fuchsia-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500">Complementos grátis (limite)</label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    className="field-input mt-1 w-full rounded-xl px-3 py-2"
                    value={form.freeToppingsLimit}
                    onChange={(e) => setForm({ ...form, freeToppingsLimit: e.target.value })}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} />
                  Disponível no cardápio
                </label>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Preços por tamanho (R$)</h3>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {ALL_SIZES.map((size) => (
                    <div key={size}>
                      <label className="text-xs text-slate-500">{SIZE_LABEL[size]}</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        className="field-input mt-1 w-full rounded-xl px-3 py-2"
                        value={form.sizePrices[size]}
                        onChange={(e) => setForm({ ...form, sizePrices: { ...form.sizePrices, [size]: e.target.value } })}
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-xs text-slate-500">Deixe preço vazio ou zero para omitir um tamanho (é obrigatório ao menos um preço &gt; 0).</p>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Adicionais</h3>
                  <button
                    type="button"
                    className="text-sm font-semibold text-fuchsia-600 dark:text-fuchsia-400"
                    onClick={() => setForm({ ...form, addons: [...form.addons, emptyAddon()] })}
                  >
                    + Adicionar linha
                  </button>
                </div>
                <div className="mt-2 space-y-2">
                  {form.addons.map((row, idx) => (
                    <div key={idx} className="grid gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800 sm:grid-cols-12">
                      <input
                        placeholder="Nome"
                        className="field-input rounded-lg px-2 py-1.5 sm:col-span-4"
                        value={row.name}
                        onChange={(e) => {
                          const addons = [...form.addons];
                          addons[idx] = { ...row, name: e.target.value };
                          setForm({ ...form, addons });
                        }}
                      />
                      <input
                        placeholder="Preço"
                        className="field-input rounded-lg px-2 py-1.5 sm:col-span-2"
                        value={row.price}
                        onChange={(e) => {
                          const addons = [...form.addons];
                          addons[idx] = { ...row, price: e.target.value };
                          setForm({ ...form, addons });
                        }}
                      />
                      <label className="flex items-center gap-1 text-xs sm:col-span-3">
                        <input
                          type="checkbox"
                          checked={row.countsTowardFree}
                          onChange={(e) => {
                            const addons = [...form.addons];
                            addons[idx] = { ...row, countsTowardFree: e.target.checked };
                            setForm({ ...form, addons });
                          }}
                        />
                        Conta no grátis
                      </label>
                      <input
                        placeholder="Máx/pedido"
                        className="field-input rounded-lg px-2 py-1.5 sm:col-span-2"
                        value={row.maxPerOrder}
                        onChange={(e) => {
                          const addons = [...form.addons];
                          addons[idx] = { ...row, maxPerOrder: e.target.value };
                          setForm({ ...form, addons });
                        }}
                      />
                      <button
                        type="button"
                        className="text-xs text-red-600 underline sm:col-span-1"
                        onClick={() => {
                          const addons = form.addons.filter((_, i) => i !== idx);
                          setForm({ ...form, addons });
                        }}
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium dark:border-slate-700" onClick={closeModal}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null)}
    </div>
  );
}
