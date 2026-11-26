// In-memory store. Swap this module for a real database (Postgres, MongoDB, ...)
// without touching the routes.
const products = require('./data/products');

const orders = [];
let nextOrderId = 1001;

module.exports = {
  listProducts: () => products,
  getProduct: (id) => products.find((p) => p.id === id),
  createOrder: (order) => {
    const saved = { id: nextOrderId++, createdAt: new Date().toISOString(), ...order };
    orders.push(saved);
    return saved;
  },
  getOrder: (id) => orders.find((o) => o.id === id)
};
