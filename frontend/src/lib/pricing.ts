import type { ProductDetail, ProductSize } from '@/types';

export type AddonSelection = { addonId: string; qty: number };

export function calcAddonCost(
  product: Pick<ProductDetail, 'addons' | 'freeToppingsLimit'>,
  selections: AddonSelection[]
): number {
  let cost = 0;
  let freeLeft = product.freeToppingsLimit;
  const map = new Map(product.addons.map((a) => [a.id, a]));
  for (const sel of selections) {
    const a = map.get(sel.addonId);
    if (!a) continue;
    if (a.maxPerOrder != null && sel.qty > a.maxPerOrder) {
      throw new Error('Quantidade acima do permitido para um adicional');
    }
    if (a.countsTowardFree) {
      const takeFree = Math.min(sel.qty, freeLeft);
      const payQty = sel.qty - takeFree;
      cost += payQty * a.price;
      freeLeft -= takeFree;
    } else {
      cost += sel.qty * a.price;
    }
  }
  return cost;
}

export function unitPriceFor(
  product: ProductDetail,
  size: ProductSize,
  selections: AddonSelection[]
): number {
  const base = product.sizes.find((s) => s.size === size)?.price;
  if (base == null) throw new Error('Tamanho inválido');
  return base + calcAddonCost(product, selections);
}

export const SIZE_LABEL: Record<ProductSize, string> = {
  ML_300: '300ml',
  ML_500: '500ml',
  ML_700: '700ml',
  ML_1000: '1 Litro',
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  PREPARING: 'Em preparo',
  OUT_FOR_DELIVERY: 'Saiu para entrega',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};
