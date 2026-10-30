import { describe, it, expect } from 'vitest';
import Product from '../../src/models/Product';
import Category from '../../src/models/Category';
import { createAgent, registerAdmin, registerCustomer } from '../helpers';

const createProduct = async (overrides: Partial<{ price: number; salePrice: number | null; stock: number }> = {}) => {
  const category = await Category.create({ name: 'Electronics', parent: null });
  return Product.create({
    name: 'Phone',
    sku: `SKU-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    price: overrides.price ?? 500,
    salePrice: overrides.salePrice ?? null,
    stock: overrides.stock ?? 5,
    category: category._id,
    status: 'active',
  });
};

describe('order creation and stock handling', () => {
  it('decrements stock and computes totalAmount from the server-side price, not client input', async () => {
    const product = await createProduct({ price: 500, salePrice: 450, stock: 5 });
    const agent = createAgent();
    await registerCustomer(agent);

    const res = await agent.post('/api/orders').send({
      items: [{ product: String(product._id), quantity: 2, price: 1 }], // client-supplied price must be ignored
    });

    expect(res.status).toBe(201);
    expect(res.body.data.totalAmount).toBe(900); // 2 * salePrice(450), not 2 * 1
    expect(res.body.data.items[0].price).toBe(450);

    const updated = await Product.findById(product._id);
    expect(updated!.stock).toBe(3);
  });

  it('rejects an order that exceeds available stock and leaves stock untouched', async () => {
    const product = await createProduct({ stock: 2 });
    const agent = createAgent();
    await registerCustomer(agent);

    const res = await agent.post('/api/orders').send({
      items: [{ product: String(product._id), quantity: 3 }],
    });

    expect(res.status).toBe(400);
    const unchanged = await Product.findById(product._id);
    expect(unchanged!.stock).toBe(2);
  });

  it('refunds already-reserved stock when a later item in the order fails', async () => {
    const inStock = await createProduct({ stock: 5 });
    const outOfStock = await createProduct({ stock: 1 });
    const agent = createAgent();
    await registerCustomer(agent);

    const res = await agent.post('/api/orders').send({
      items: [
        { product: String(inStock._id), quantity: 2 },
        { product: String(outOfStock._id), quantity: 5 },
      ],
    });

    expect(res.status).toBe(400);
    expect((await Product.findById(inStock._id))!.stock).toBe(5); // refunded back
    expect((await Product.findById(outOfStock._id))!.stock).toBe(1); // never touched
  });

  it('only lets one of two concurrent orders succeed when stock covers exactly one', async () => {
    const product = await createProduct({ stock: 1 });
    const agentA = createAgent();
    const agentB = createAgent();
    await registerCustomer(agentA);
    await registerCustomer(agentB);

    const place = (agent: ReturnType<typeof createAgent>) =>
      agent.post('/api/orders').send({ items: [{ product: String(product._id), quantity: 1 }] });

    const [resA, resB] = await Promise.all([place(agentA), place(agentB)]);
    const statuses = [resA.status, resB.status].sort();

    expect(statuses).toEqual([201, 400]);
    expect((await Product.findById(product._id))!.stock).toBe(0);
  });

  it('restricts customers to their own orders but lets admins see any order', async () => {
    const product = await createProduct({ stock: 5 });
    const owner = createAgent();
    const stranger = createAgent();
    const admin = createAgent();
    await registerCustomer(owner);
    await registerCustomer(stranger);
    await registerAdmin(admin);

    const order = await owner
      .post('/api/orders')
      .send({ items: [{ product: String(product._id), quantity: 1 }] });

    const byOwner = await owner.get(`/api/orders/${order.body.data._id}`);
    expect(byOwner.status).toBe(200);

    const byStranger = await stranger.get(`/api/orders/${order.body.data._id}`);
    expect(byStranger.status).toBe(403);

    const byAdmin = await admin.get(`/api/orders/${order.body.data._id}`);
    expect(byAdmin.status).toBe(200);
  });

  it('blocks status updates on a Delivered/Cancelled order and restores stock on cancellation', async () => {
    const product = await createProduct({ stock: 5 });
    const customer = createAgent();
    const admin = createAgent();
    await registerCustomer(customer);
    await registerAdmin(admin);

    const order = await customer
      .post('/api/orders')
      .send({ items: [{ product: String(product._id), quantity: 2 }] });
    expect((await Product.findById(product._id))!.stock).toBe(3);

    const cancelled = await admin
      .patch(`/api/orders/${order.body.data._id}/status`)
      .send({ status: 'Cancelled' });
    expect(cancelled.status).toBe(200);
    expect((await Product.findById(product._id))!.stock).toBe(5); // restored

    const again = await admin
      .patch(`/api/orders/${order.body.data._id}/status`)
      .send({ status: 'Confirmed' });
    expect(again.status).toBe(400); // already Cancelled, can't move further
  });
});
