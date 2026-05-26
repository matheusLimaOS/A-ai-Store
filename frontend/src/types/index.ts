export type ProductSize = 'ML_300' | 'ML_500' | 'ML_700' | 'ML_1000';

export type OrderStatus =
  | 'PENDING'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethod = 'PIX' | 'CARD' | 'CASH';

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  available: boolean;
  mainImageUrl: string | null;
  freeToppingsLimit: number;
  category: { id: string; name: string; slug: string };
  sizes: { size: ProductSize; price: number }[];
  addons: { id: string; name: string; price: number; countsTowardFree: boolean }[];
  minPrice: number;
}

export interface ProductDetail extends ProductListItem {
  images: { id: string; url: string; sortOrder: number }[];
  addons: {
    id: string;
    name: string;
    price: number;
    countsTowardFree: boolean;
    maxPerOrder: number | null;
  }[];
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: 'USER' | 'ADMIN';
  blocked: boolean;
  addresses: Address[];
}

export interface Address {
  id: string;
  label: string | null;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
}

export interface OrderDTO {
  id: string;
  userId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  couponCode: string | null;
  delivery: {
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zip: string;
  };
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: {
    id: string;
    productName: string;
    size: ProductSize;
    quantity: number;
    unitPrice: number;
    addons: unknown;
    notes: string | null;
    lineTotal: number;
  }[];
  user?: { id: string; name: string; email: string; phone: string | null };
}

export interface CouponDTO {
  id: string;
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  validFrom: string;
  validTo: string;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
}
