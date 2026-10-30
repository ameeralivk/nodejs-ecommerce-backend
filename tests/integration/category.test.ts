import { describe, it, expect } from 'vitest';
import { createAgent, registerAdmin, registerCustomer } from '../helpers';

describe('category management', () => {
  it('forbids a customer from creating a category', async () => {
    const agent = createAgent();
    await registerCustomer(agent);

    const res = await agent.post('/api/categories').send({ name: 'Electronics' });
    expect(res.status).toBe(403);
  });

  it('lets an admin build a multi-level tree and fetch it via /categories/tree', async () => {
    const agent = createAgent();
    await registerAdmin(agent);

    const electronics = await agent.post('/api/categories').send({ name: 'Electronics' });
    expect(electronics.status).toBe(201);

    const mobiles = await agent
      .post('/api/categories')
      .send({ name: 'Mobiles', parent: electronics.body.data._id });

    await agent.post('/api/categories').send({ name: 'Android Phones', parent: mobiles.body.data._id });

    const tree = await agent.get('/api/categories/tree');
    expect(tree.status).toBe(200);

    const root = tree.body.data.find((c: any) => c.name === 'Electronics');
    expect(root.children[0].name).toBe('Mobiles');
    expect(root.children[0].children[0].name).toBe('Android Phones');
  });

  it('rejects a category being set as its own parent', async () => {
    const agent = createAgent();
    await registerAdmin(agent);

    const category = await agent.post('/api/categories').send({ name: 'Electronics' });
    const res = await agent.put(`/api/categories/${category.body.data._id}`).send({
      parent: category.body.data._id,
    });

    expect(res.status).toBe(400);
  });

  it('rejects reassigning a category under its own descendant (circular reference)', async () => {
    const agent = createAgent();
    await registerAdmin(agent);

    const electronics = await agent.post('/api/categories').send({ name: 'Electronics' });
    const mobiles = await agent
      .post('/api/categories')
      .send({ name: 'Mobiles', parent: electronics.body.data._id });

    const res = await agent
      .put(`/api/categories/${electronics.body.data._id}`)
      .send({ parent: mobiles.body.data._id });

    expect(res.status).toBe(400);
  });

  it('refuses to delete a category that still has subcategories', async () => {
    const agent = createAgent();
    await registerAdmin(agent);

    const electronics = await agent.post('/api/categories').send({ name: 'Electronics' });
    await agent.post('/api/categories').send({ name: 'Mobiles', parent: electronics.body.data._id });

    const res = await agent.delete(`/api/categories/${electronics.body.data._id}`);
    expect(res.status).toBe(400);
  });
});
