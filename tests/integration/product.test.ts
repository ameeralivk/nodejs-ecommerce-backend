import { describe, it, expect } from 'vitest';
import { createAgent, registerAdmin, registerCustomer } from '../helpers';

const createCategory = async (agent: ReturnType<typeof createAgent>, name: string, parent?: string) => {
  const res = await agent.post('/api/categories').send(parent ? { name, parent } : { name });
  return res.body.data._id as string;
};

describe('product management', () => {
  it('forbids a customer from creating a product', async () => {
    const agent = createAgent();
    await registerCustomer(agent);

    const res = await agent.post('/api/products').send({
      name: 'Phone',
      sku: 'PHONE-1',
      price: 100,
      stock: 5,
      category: '507f1f77bcf86cd799439011',
    });
    expect(res.status).toBe(403);
  });

  it('rejects creating a product under a non-existent category', async () => {
    const agent = createAgent();
    await registerAdmin(agent);

    const res = await agent.post('/api/products').send({
      name: 'Phone',
      sku: 'PHONE-1',
      price: 100,
      stock: 5,
      category: '507f1f77bcf86cd799439011',
    });
    expect(res.status).toBe(400);
  });

  it('filtering by a parent category also returns products in its subcategories', async () => {
    const agent = createAgent();
    await registerAdmin(agent);

    const electronics = await createCategory(agent, 'Electronics');
    const mobiles = await createCategory(agent, 'Mobiles', electronics);

    await agent.post('/api/products').send({
      name: 'Laptop',
      sku: 'LAP-1',
      price: 1000,
      stock: 5,
      category: electronics,
    });
    await agent.post('/api/products').send({
      name: 'Phone',
      sku: 'PHONE-1',
      price: 500,
      stock: 5,
      category: mobiles,
    });

    const res = await agent.get(`/api/products?category=${electronics}`);
    expect(res.status).toBe(200);
    expect(res.body.data.map((p: any) => p.name).sort()).toEqual(['Laptop', 'Phone']);
  });

  it('filters by price range and search text', async () => {
    const agent = createAgent();
    await registerAdmin(agent);

    const category = await createCategory(agent, 'Electronics');
    await agent.post('/api/products').send({ name: 'Cheap Laptop', sku: 'L-1', price: 300, stock: 5, category });
    await agent.post('/api/products').send({ name: 'Expensive Laptop', sku: 'L-2', price: 2000, stock: 5, category });
    await agent.post('/api/products').send({ name: 'Phone', sku: 'P-1', price: 500, stock: 5, category });

    const byPrice = await agent.get(`/api/products?minPrice=400&maxPrice=1000`);
    expect(byPrice.body.data.map((p: any) => p.name)).toEqual(['Phone']);

    const bySearch = await agent.get(`/api/products?search=Laptop`);
    expect(bySearch.body.data.map((p: any) => p.name).sort()).toEqual(['Cheap Laptop', 'Expensive Laptop']);
  });

  it('paginates product listings', async () => {
    const agent = createAgent();
    await registerAdmin(agent);
    const category = await createCategory(agent, 'Electronics');

    for (let i = 0; i < 5; i++) {
      await agent.post('/api/products').send({ name: `Item ${i}`, sku: `SKU-${i}`, price: 10, stock: 5, category });
    }

    const res = await agent.get('/api/products?page=1&limit=2');
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 2, total: 5, pages: 3 });
  });
});
