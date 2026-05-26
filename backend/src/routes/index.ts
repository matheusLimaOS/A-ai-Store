import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { userController } from '../controllers/user.controller';
import { adminUserController } from '../controllers/adminUser.controller';
import { productController } from '../controllers/product.controller';
import { categoryController } from '../controllers/category.controller';
import { orderController } from '../controllers/order.controller';
import { couponController } from '../controllers/coupon.controller';
import { statsController } from '../controllers/stats.controller';
import { uploadController } from '../controllers/upload.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/auth';
import { adminMiddleware } from '../middlewares/admin';
import { uploadMiddleware } from '../middlewares/upload';
import { orderService } from '../services/order.service';
import { routeParam } from '../utils/params';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'imperio-acai-api' });
});

const auth = Router();
auth.post('/register', authController.register);
auth.post('/login', authController.login);
auth.post('/refresh', authController.refresh);
auth.post('/logout', authController.logout);
auth.post('/forgot-password', authController.forgot);
auth.post('/reset-password', authController.reset);
apiRouter.use('/auth', auth);

apiRouter.get('/categories', categoryController.list);
apiRouter.get('/products', productController.list);
apiRouter.get('/products/slug/:slug', optionalAuthMiddleware, productController.getBySlug);

const user = Router();
user.use(authMiddleware);
user.get('/me', userController.me);
user.patch('/me/password', userController.changePassword);
user.patch('/me', userController.updateMe);
user.get('/addresses', userController.listAddresses);
user.post('/addresses', userController.createAddress);
user.patch('/addresses/:id', userController.updateAddress);
user.delete('/addresses/:id', userController.deleteAddress);
apiRouter.use('/users', user);

const orders = Router();
orders.use(authMiddleware);
orders.post('/', orderController.create);
orders.get('/', orderController.mine);
orders.get('/:id', orderController.getOne);
apiRouter.use('/orders', orders);

const admin = Router();
admin.use(authMiddleware, adminMiddleware);
admin.get('/stats/dashboard', statsController.dashboard);

admin.get('/users', adminUserController.list);
admin.patch('/users/:id', adminUserController.update);

admin.get('/categories', categoryController.list);
admin.post('/categories', categoryController.create);
admin.patch('/categories/:id', categoryController.update);
admin.delete('/categories/:id', categoryController.remove);

admin.get('/products', productController.list);
admin.get('/products/:id', productController.getById);
admin.post('/products', productController.create);
admin.patch('/products/:id', productController.update);
admin.delete('/products/:id', productController.remove);
admin.post(
  '/products/:id/image',
  uploadMiddleware.single('file'),
  uploadController.productImage
);

admin.get('/orders', orderController.adminList);
admin.get('/orders/:id/print', async (req, res, next) => {
  try {
    const data = await orderService.getById(routeParam(req, 'id'), undefined, true);
    const itemsHtml = data.items
      .map(
        (i) =>
          `<tr><td>${i.productName}</td><td>${i.size}</td><td>${i.quantity}</td><td>R$ ${i.lineTotal.toFixed(2)}</td></tr>`
      )
      .join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Pedido ${data.id}</title>
    <style>body{font-family:system-ui;padding:24px;} table{border-collapse:collapse;width:100%} td,th{border:1px solid #ccc;padding:8px}</style></head><body>
    <h1>Império do Açaí — Pedido</h1>
    <p><strong>ID:</strong> ${data.id}</p>
    <p><strong>Cliente:</strong> ${data.user?.name ?? ''} (${data.user?.email ?? ''})</p>
    <p><strong>Status:</strong> ${data.status}</p>
    <p><strong>Endereço:</strong> ${data.delivery.street}, ${data.delivery.number} — ${data.delivery.neighborhood}, ${data.delivery.city}/${data.delivery.state} — CEP ${data.delivery.zip}</p>
    <table><thead><tr><th>Item</th><th>Tamanho</th><th>Qtd</th><th>Total</th></tr></thead><tbody>${itemsHtml}</tbody></table>
    <p>Subtotal: R$ ${data.subtotal.toFixed(2)} | Entrega: R$ ${data.deliveryFee.toFixed(2)} | Desconto: R$ ${data.discount.toFixed(2)} | <strong>Total: R$ ${data.total.toFixed(2)}</strong></p>
    </body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (e) {
    next(e);
  }
});
admin.get('/orders/:id', orderController.adminGet);
admin.patch('/orders/:id/status', orderController.adminStatus);

admin.get('/coupons', couponController.list);
admin.post('/coupons', couponController.create);
admin.patch('/coupons/:id', couponController.update);
admin.delete('/coupons/:id', couponController.remove);

apiRouter.use('/admin', admin);
