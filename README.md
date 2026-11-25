# Fernwick: e-commerce store

A small full-stack e-commerce app: product catalog with search and filters, a persistent cart, and server-validated checkout.

**Stack:** Node.js, Express, vanilla JavaScript front end. Data is stored in memory, so it resets on restart.

## Run it

```bash
npm install
npm start        # http://localhost:3000
npm test         # API tests (Node's built-in test runner)
```

## Project structure

```
src/
  app.js              Express app (static files + API routes)
  server.js           Starts the server
  store.js            In-memory data layer (replace with a database)
  data/products.js    Product catalog
  routes/products.js  GET /api/products, GET /api/products/:id
  routes/orders.js    POST /api/orders, GET /api/orders/:id
public/
  index.html, style.css, app.js   Storefront UI
test/api.test.js      API tests
```

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/products?category=&q=` | List and filter products |
| GET | `/api/products/:id` | One product |
| POST | `/api/orders` | Place an order (prices and stock are checked on the server) |
| GET | `/api/orders/:id` | Fetch an order |

## Ideas for next steps

- Replace `store.js` with PostgreSQL or MongoDB
- Add user accounts and order history
- Add a payment provider such as Stripe
