import { CouponType, OrderStatus, PaymentMethod, Prisma, ProductSize } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { productRepo } from '../repositories/product.repository';
import { orderRepo } from '../repositories/order.repository';
import { couponRepo } from '../repositories/coupon.repository';
import { prisma } from '../lib/prisma';

const DELIVERY_FLAT = 7.99;
const FREE_DELIVERY_MIN = 80;

type AddonSel = { addonId: string; qty: number };

export type CartLineInput = {
  productId: string;
  quantity: number;
  size: ProductSize;
  addons: AddonSel[];
  notes?: string;
};

function calcAddonCost(
  freeLimit: number,
  selections: AddonSel[],
  addonMap: Map<string, { price: number; countsTowardFree: boolean; maxPerOrder: number | null }>
) {
  let cost = 0;
  let freeLeft = freeLimit;
  for (const sel of selections) {
    const a = addonMap.get(sel.addonId);
    if (!a) throw new AppError(400, 'Adicional inválido');
    if (a.maxPerOrder != null && sel.qty > a.maxPerOrder) {
      throw new AppError(400, 'Quantidade de adicional acima do permitido');
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

export const orderService = {
  async create(
    userId: string,
    input: {
      items: CartLineInput[];
      paymentMethod: PaymentMethod;
      couponCode?: string;
      delivery: {
        street: string;
        number: string;
        complement?: string;
        neighborhood: string;
        city: string;
        state: string;
        zip: string;
      };
      notes?: string;
    }
  ) {
    if (!input.items.length) throw new AppError(400, 'Pedido sem itens');

    let subtotal = 0;
    const lines: Prisma.OrderItemCreateWithoutOrderInput[] = [];

    for (const line of input.items) {
      const product = await productRepo.findById(line.productId);
      if (!product || !product.available) throw new AppError(400, 'Produto indisponível');
      const sizeRow = product.sizes.find((s) => s.size === line.size);
      if (!sizeRow) throw new AppError(400, 'Tamanho inválido para o produto');
      const unitBase = Number(sizeRow.price);
      const addonMap = new Map(
        product.addons.map((a) => [
          a.id,
          {
            price: Number(a.price),
            countsTowardFree: a.countsTowardFree,
            maxPerOrder: a.maxPerOrder,
          },
        ])
      );
      const addonCost = calcAddonCost(product.freeToppingsLimit, line.addons, addonMap);
      const perUnit = unitBase + addonCost;
      const lineTotal = perUnit * line.quantity;
      subtotal += lineTotal;

      const addonsJson = line.addons.map((s) => {
        const ad = product.addons.find((x) => x.id === s.addonId)!;
        return { id: ad.id, name: ad.name, qty: s.qty, unitPrice: Number(ad.price) };
      });

      lines.push({
        product: { connect: { id: product.id } },
        productName: product.name,
        size: line.size,
        quantity: line.quantity,
        unitPrice: perUnit,
        addonsJson,
        notes: line.notes ?? null,
        lineTotal,
      });
    }

    let discount = 0;
    let couponId: string | undefined;
    let couponCode: string | undefined;

    if (input.couponCode) {
      const coupon = await couponRepo.findByCode(input.couponCode);
      const now = new Date();
      if (
        !coupon ||
        !coupon.active ||
        coupon.validFrom > now ||
        coupon.validTo < now ||
        (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses)
      ) {
        throw new AppError(400, 'Cupom inválido ou expirado');
      }
      if (coupon.type === CouponType.PERCENT) {
        discount = (subtotal * Number(coupon.value)) / 100;
      } else {
        discount = Number(coupon.value);
      }
      discount = Math.min(discount, subtotal);
      couponId = coupon.id;
      couponCode = coupon.code;
    }

    const deliveryFee = subtotal >= FREE_DELIVERY_MIN ? 0 : DELIVERY_FLAT;
    const total = Math.max(0, subtotal - discount + deliveryFee);

    const order = await prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          user: { connect: { id: userId } },
          status: OrderStatus.PENDING,
          paymentMethod: input.paymentMethod,
          subtotal,
          deliveryFee,
          discount,
          total,
          coupon: couponId ? { connect: { id: couponId } } : undefined,
          couponCode: couponCode ?? null,
          deliveryStreet: input.delivery.street,
          deliveryNumber: input.delivery.number,
          deliveryComplement: input.delivery.complement ?? null,
          deliveryNeighborhood: input.delivery.neighborhood,
          deliveryCity: input.delivery.city,
          deliveryState: input.delivery.state,
          deliveryZip: input.delivery.zip,
          notes: input.notes ?? null,
          items: { create: lines },
        },
        include: { items: true },
      });
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }
      return o;
    });

    return serializeOrder(order);
  },

  async listMine(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [rows, total] = await orderRepo.listForUser(userId, skip, limit);
    return { data: rows.map(serializeOrder), total };
  },

  async getById(id: string, userId?: string, isAdmin?: boolean) {
    const order = await orderRepo.findById(id);
    if (!order) throw new AppError(404, 'Pedido não encontrado');
    if (!isAdmin && order.userId !== userId) throw new AppError(403, 'Sem permissão');
    return serializeOrder(order);
  },

  async adminList(params: {
    page: number;
    limit: number;
    status?: OrderStatus;
    search?: string;
  }) {
    const skip = (params.page - 1) * params.limit;
    const [rows, total] = await orderRepo.listAdmin({
      skip,
      take: params.limit,
      status: params.status,
      search: params.search,
    });
    return { data: rows.map(serializeOrder), total };
  },

  async updateStatus(id: string, status: OrderStatus) {
    const order = await orderRepo.updateStatus(id, status);
    return serializeOrder(order);
  },
};

function serializeOrder(order: {
  id: string;
  userId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  subtotal: Prisma.Decimal;
  deliveryFee: Prisma.Decimal;
  discount: Prisma.Decimal;
  total: Prisma.Decimal;
  couponCode: string | null;
  deliveryStreet: string;
  deliveryNumber: string;
  deliveryComplement: string | null;
  deliveryNeighborhood: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryZip: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: {
    id: string;
    productName: string;
    size: ProductSize;
    quantity: number;
    unitPrice: Prisma.Decimal;
    addonsJson: Prisma.JsonValue;
    notes: string | null;
    lineTotal: Prisma.Decimal;
  }[];
  user?: { id: string; name: string; email: string; phone: string | null };
}) {
  return {
    id: order.id,
    userId: order.userId,
    status: order.status,
    paymentMethod: order.paymentMethod,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    discount: Number(order.discount),
    total: Number(order.total),
    couponCode: order.couponCode,
    delivery: {
      street: order.deliveryStreet,
      number: order.deliveryNumber,
      complement: order.deliveryComplement,
      neighborhood: order.deliveryNeighborhood,
      city: order.deliveryCity,
      state: order.deliveryState,
      zip: order.deliveryZip,
    },
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.items.map((i) => ({
      id: i.id,
      productName: i.productName,
      size: i.size,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      addons: i.addonsJson,
      notes: i.notes,
      lineTotal: Number(i.lineTotal),
    })),
    user: order.user,
  };
}
