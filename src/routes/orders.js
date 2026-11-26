const express = require('express');
const store = require('../store');

const router = express.Router();

// POST /api/orders
// body: { customer: { name, email, address }, items: [{ productId, quantity }] }
// Prices are always read from the server, never trusted from the client.
router.post('/', (req, res) => {
  const { customer, items } = req.body || {};

  if (!customer || !customer.name || !customer.email || !customer.address) {
    return res.status(400).json({ error: 'Name, email and address are required.' });
  }
  if (!/^\S+@\S+\.\S+$/.test(customer.email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Your cart is empty.' });
  }

  const lines = [];
  for (const item of items) {
    const quantity = Number(item.quantity);
    const product = store.getProduct(Number(item.productId));
    if (!product) return res.status(400).json({ error: `Unknown product ${item.productId}.` });
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ error: `Invalid quantity for ${product.name}.` });
    }
    if (quantity > product.stock) {
      return res.status(409).json({ error: `Only ${product.stock} of ${product.name} left.` });
    }
    lines.push({ productId: product.id, name: product.name, unitPrice: product.price, quantity });
  }

  // Reserve stock only after every line has passed validation.
  lines.forEach((l) => { store.getProduct(l.productId).stock -= l.quantity; });

  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const order = store.createOrder({ customer, lines, total });
  res.status(201).json(order);
});

// GET /api/orders/:id
router.get('/:id', (req, res) => {
  const order = store.getOrder(Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

module.exports = router;
