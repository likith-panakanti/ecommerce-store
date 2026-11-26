const express = require('express');
const store = require('../store');

const router = express.Router();

// GET /api/products?category=Large&q=fig
router.get('/', (req, res) => {
  const { category, q } = req.query;
  let items = store.listProducts();
  if (category) items = items.filter((p) => p.category === category);
  if (q) {
    const term = String(q).toLowerCase();
    items = items.filter((p) => p.name.toLowerCase().includes(term));
  }
  res.json(items);
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const product = store.getProduct(Number(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

module.exports = router;
