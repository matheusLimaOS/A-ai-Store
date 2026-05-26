import { CouponType } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { couponRepo } from '../repositories/coupon.repository';

export const couponService = {
  async list(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [rows, total] = await couponRepo.list(skip, limit);
    return {
      data: rows.map(serialize),
      total,
    };
  },
  async create(input: {
    code: string;
    type: CouponType;
    value: number;
    validFrom: string;
    validTo: string;
    maxUses?: number | null;
    active?: boolean;
  }) {
    const code = input.code.toUpperCase();
    const exists = await couponRepo.findByCode(code);
    if (exists) throw new AppError(409, 'Código já cadastrado');
    const row = await couponRepo.create({
      code,
      type: input.type,
      value: input.value,
      validFrom: new Date(input.validFrom),
      validTo: new Date(input.validTo),
      maxUses: input.maxUses ?? null,
      active: input.active ?? true,
    });
    return serialize(row);
  },
  async update(
    id: string,
    input: Partial<{
      code: string;
      type: CouponType;
      value: number;
      validFrom: string;
      validTo: string;
      maxUses: number | null;
      active: boolean;
    }>
  ) {
    const existing = await couponRepo.findById(id);
    if (!existing) throw new AppError(404, 'Cupom não encontrado');
    const data: Record<string, unknown> = { ...input };
    if (input.code) data.code = input.code.toUpperCase();
    if (input.validFrom) data.validFrom = new Date(input.validFrom);
    if (input.validTo) data.validTo = new Date(input.validTo);
    const row = await couponRepo.update(id, data as never);
    return serialize(row);
  },
  async delete(id: string) {
    await couponRepo.delete(id);
  },
};

function serialize(c: {
  id: string;
  code: string;
  type: CouponType;
  value: import('@prisma/client').Prisma.Decimal;
  validFrom: Date;
  validTo: Date;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
}) {
  return {
    id: c.id,
    code: c.code,
    type: c.type,
    value: Number(c.value),
    validFrom: c.validFrom,
    validTo: c.validTo,
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    active: c.active,
  };
}
