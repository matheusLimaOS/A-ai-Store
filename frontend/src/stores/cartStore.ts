import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductSize } from '@/types';

export type CartAddon = { addonId: string; name: string; qty: number; unitPrice: number };

export type CartLine = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  size: ProductSize;
  quantity: number;
  addons: CartAddon[];
  notes?: string;
  unitPrice: number;
  lineTotal: number;
};

type CartState = {
  lines: CartLine[];
  addLine: (line: Omit<CartLine, 'key'>) => void;
  removeLine: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
};

const DELIVERY_FLAT = 7.99;
const FREE_DELIVERY_MIN = 80;

export function computeCartTotals(lines: CartLine[]) {
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const delivery = subtotal >= FREE_DELIVERY_MIN ? 0 : DELIVERY_FLAT;
  return { subtotal, delivery, total: subtotal + delivery };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      addLine: (line) => {
        const key = crypto.randomUUID();
        set({ lines: [...get().lines, { ...line, key }] });
      },
      removeLine: (key) => set({ lines: get().lines.filter((l) => l.key !== key) }),
      setQty: (key, qty) => {
        if (qty < 1) {
          set({ lines: get().lines.filter((l) => l.key !== key) });
          return;
        }
        set({
          lines: get().lines.map((l) =>
            l.key === key
              ? {
                  ...l,
                  quantity: qty,
                  lineTotal: l.unitPrice * qty,
                }
              : l
          ),
        });
      },
      clear: () => set({ lines: [] }),
    }),
    { name: 'imperio-cart' }
  )
);
