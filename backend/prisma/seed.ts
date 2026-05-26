import 'dotenv/config';
import { PrismaClient, Role, ProductSize, CouponType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const categories = [
  { name: 'Açaís', slug: 'acais', description: 'Monte seu açaí do jeitinho que você ama.', sortOrder: 1 },
  { name: 'Combos', slug: 'combos', description: 'Combinações especiais com preço imperdível.', sortOrder: 2 },
  { name: 'Milkshakes', slug: 'milkshakes', description: 'Cremosos e refrescantes.', sortOrder: 3 },
  { name: 'Bebidas', slug: 'bebidas', description: 'Sucos, vitaminas e mais.', sortOrder: 4 },
  { name: 'Adicionais', slug: 'adicionais', description: 'Granolas, frutas e coberturas extras.', sortOrder: 5 },
];

const sizes = [ProductSize.ML_300, ProductSize.ML_500, ProductSize.ML_700, ProductSize.ML_1000];

function sizePrices(base: number) {
  return [
    { size: ProductSize.ML_300, price: base },
    { size: ProductSize.ML_500, price: base + 4 },
    { size: ProductSize.ML_700, price: base + 8 },
    { size: ProductSize.ML_1000, price: base + 14 },
  ];
}

async function main() {
  const adminEmail = 'admin@imperioacai.com.br';
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminPasswordHash,
      name: 'Administrador',
      role: Role.ADMIN,
      phone: '(11) 99999-0000',
      blocked: false,
    },
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      name: 'Administrador',
      role: Role.ADMIN,
      phone: '(11) 99999-0000',
    },
  });

  const clientEmail = 'cliente@imperioacai.com.br';
  const clientPasswordHash = await bcrypt.hash('Cliente@123', 10);
  await prisma.user.upsert({
    where: { email: clientEmail },
    update: {
      passwordHash: clientPasswordHash,
      name: 'Cliente Demo',
      role: Role.USER,
      phone: '(11) 98888-1111',
      blocked: false,
    },
    create: {
      email: clientEmail,
      passwordHash: clientPasswordHash,
      name: 'Cliente Demo',
      role: Role.USER,
      phone: '(11) 98888-1111',
    },
  });

  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, sortOrder: c.sortOrder },
      create: c,
    });
  }

  const catAcais = await prisma.category.findUniqueOrThrow({ where: { slug: 'acais' } });
  const catCombos = await prisma.category.findUniqueOrThrow({ where: { slug: 'combos' } });
  const catMilk = await prisma.category.findUniqueOrThrow({ where: { slug: 'milkshakes' } });
  const catBebidas = await prisma.category.findUniqueOrThrow({ where: { slug: 'bebidas' } });

  const products = [
    {
      slug: 'acai-classico-imperio',
      name: 'Açaí Clássico Império',
      description:
        'Açaí cremoso da Amazônia, textura perfeita para montar com seus complementos favoritos.',
      categoryId: catAcais.id,
      freeToppingsLimit: 3,
      mainImageUrl: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800',
      sizes: sizePrices(14.9),
      addons: [
        { name: 'Granola', price: 0, countsTowardFree: true },
        { name: 'Banana', price: 0, countsTowardFree: true },
        { name: 'Morango', price: 0, countsTowardFree: true },
        { name: 'Leite em pó', price: 2.5, countsTowardFree: false },
        { name: 'Paçoca', price: 3, countsTowardFree: false },
        { name: 'Nutella', price: 5, countsTowardFree: false },
      ],
    },
    {
      slug: 'acai-tropical',
      name: 'Açaí Tropical',
      description: 'Toque refrescante com frutas cítricas e notas tropicais.',
      categoryId: catAcais.id,
      freeToppingsLimit: 4,
      mainImageUrl: 'https://images.unsplash.com/photo-1505252585461-04cf1f1f845e?w=800',
      sizes: sizePrices(16.9),
      addons: [
        { name: 'Kiwi', price: 0, countsTowardFree: true },
        { name: 'Manga', price: 0, countsTowardFree: true },
        { name: 'Coco ralado', price: 0, countsTowardFree: true },
        { name: 'Mel', price: 2, countsTowardFree: false },
      ],
    },
    {
      slug: 'combo-imperador',
      name: 'Combo Imperador',
      description: 'Açaí 700ml + brownie + suco natural 300ml.',
      categoryId: catCombos.id,
      freeToppingsLimit: 2,
      mainImageUrl: 'https://images.unsplash.com/photo-1560008581-09826d1b6935?w=800',
      sizes: sizePrices(32.9),
      addons: [
        { name: 'Leite condensado', price: 0, countsTowardFree: true },
        { name: 'Amendoim', price: 0, countsTowardFree: true },
      ],
    },
    {
      slug: 'milkshake-acai',
      name: 'Milkshake de Açaí',
      description: 'Batido cremoso com leite gelado e calda a gosto.',
      categoryId: catMilk.id,
      freeToppingsLimit: 1,
      mainImageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800',
      sizes: sizePrices(18.9),
      addons: [
        { name: 'Chantilly', price: 0, countsTowardFree: true },
        { name: 'Calda de chocolate', price: 2, countsTowardFree: false },
      ],
    },
    {
      slug: 'suco-laranja',
      name: 'Suco Natural de Laranja',
      description: 'Espremido na hora, 500ml.',
      categoryId: catBebidas.id,
      freeToppingsLimit: 0,
      mainImageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800',
      sizes: [
        { size: ProductSize.ML_300, price: 8 },
        { size: ProductSize.ML_500, price: 10 },
        { size: ProductSize.ML_700, price: 12 },
        { size: ProductSize.ML_1000, price: 14 },
      ],
      addons: [],
    },
  ];

  for (const p of products) {
    const { sizes: sz, addons, ...rest } = p;
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: rest.name,
        description: rest.description,
        categoryId: rest.categoryId,
        freeToppingsLimit: rest.freeToppingsLimit,
        mainImageUrl: rest.mainImageUrl,
        available: true,
      },
      create: {
        name: rest.name,
        slug: rest.slug,
        description: rest.description,
        categoryId: rest.categoryId,
        freeToppingsLimit: rest.freeToppingsLimit,
        mainImageUrl: rest.mainImageUrl,
        available: true,
      },
    });

    await prisma.productSizePrice.deleteMany({ where: { productId: product.id } });
    await prisma.productAddon.deleteMany({ where: { productId: product.id } });
    await prisma.productSizePrice.createMany({
      data: sz.map((s) => ({ ...s, productId: product.id })),
    });
    if (addons.length) {
      await prisma.productAddon.createMany({
        data: addons.map((a) => ({ ...a, productId: product.id })),
      });
    }
  }

  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  await prisma.coupon.upsert({
    where: { code: 'IMPERIO10' },
    update: {},
    create: {
      code: 'IMPERIO10',
      type: CouponType.PERCENT,
      value: 10,
      validFrom: now,
      validTo: nextMonth,
      maxUses: 1000,
      active: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'FRETE5' },
    update: {},
    create: {
      code: 'FRETE5',
      type: CouponType.FIXED,
      value: 5,
      validFrom: now,
      validTo: nextMonth,
      maxUses: 500,
      active: true,
    },
  });

  console.log('Seed concluído: categorias, produtos, cupons e usuários demo.');

  const adminVerify = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (adminVerify) {
    const adminLoginOk = await bcrypt.compare('Admin@123', adminVerify.passwordHash);
    console.log(
      `[seed] Verificação admin (${adminEmail}): senha Admin@123 -> ${adminLoginOk ? 'OK' : 'FALHA — rode o seed de novo ou veja logs'}`
    );
  } else {
    console.error('[seed] ERRO: usuário admin ausente após upsert.');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
