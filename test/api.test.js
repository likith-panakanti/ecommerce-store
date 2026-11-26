const test = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');

let server, base;
test.before(() => new Promise((resolve) => {
  server = app.listen(0, () => { base = `http://localhost:${server.address().port}`; resolve(); });
}));
test.after(() => server.close());

const post = (url, body) => fetch(base + url, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
});

test('lists products and filters by category', async () => {
  const all = await (await fetch(`${base}/api/products`)).json();
  assert.ok(all.length >= 8);
  const pots = await (await fetch(`${base}/api/products?category=Pots`)).json();
  assert.ok(pots.every((p) => p.category === 'Pots'));
});

test('creates an order with server-side prices', async () => {
  const res = await post('/api/orders', {
    customer: { name: 'Ada', email: 'ada@example.com', address: '1 Main St' },
    items: [{ productId: 2, quantity: 2 }]
  });
  assert.strictEqual(res.status, 201);
  assert.strictEqual((await res.json()).total, 4800);
});

test('rejects an empty cart', async () => {
  const res = await post('/api/orders', {
    customer: { name: 'Ada', email: 'ada@example.com', address: '1 Main St' }, items: []
  });
  assert.strictEqual(res.status, 400);
});

test('rejects quantity above stock', async () => {
  const res = await post('/api/orders', {
    customer: { name: 'Ada', email: 'ada@example.com', address: '1 Main St' },
    items: [{ productId: 3, quantity: 999 }]
  });
  assert.strictEqual(res.status, 409);
});
