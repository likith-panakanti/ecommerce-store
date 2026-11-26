const money = (cents) => `$${(cents / 100).toFixed(2)}`;
const $ = (id) => document.getElementById(id);

let products = [];
let category = '';
let query = '';
let cart = loadCart();

function loadCart() {
  try { return JSON.parse(localStorage.getItem('cart')) || {}; } catch { return {}; }
}
function saveCart() {
  try { localStorage.setItem('cart', JSON.stringify(cart)); } catch { /* storage unavailable */ }
}

async function loadProducts() {
  const res = await fetch('/api/products');
  products = await res.json();
  renderFilters();
  renderGrid();
  renderCart();
}

function renderFilters() {
  const cats = ['All', ...new Set(products.map((p) => p.category))];
  $('filters').innerHTML = cats.map((c) =>
    `<button class="chip" data-cat="${c === 'All' ? '' : c}" aria-pressed="${(c === 'All' ? '' : c) === category}">${c}</button>`
  ).join('');
}

function renderGrid() {
  const items = products.filter((p) =>
    (!category || p.category === category) && p.name.toLowerCase().includes(query));
  $('grid').innerHTML = items.length ? items.map((p) => `
    <article class="card">
      <div class="art" style="background:${p.tint}" aria-hidden="true">${p.icon}</div>
      <div class="body">
        <h3>${p.name}</h3>
        <p>${p.description}</p>
        ${p.stock <= 8 ? `<span class="low">Only ${p.stock} left</span>` : ''}
        <div class="meta">
          <span class="price">${money(p.price)}</span>
          <button class="primary" data-add="${p.id}" ${p.stock === 0 ? 'disabled' : ''}>Add to cart</button>
        </div>
      </div>
    </article>`).join('') : '<p class="empty">No plants match. Try a different search or category.</p>';
}

function cartLines() {
  return Object.entries(cart)
    .map(([id, quantity]) => ({ product: products.find((p) => p.id === Number(id)), quantity }))
    .filter((l) => l.product);
}

function renderCart() {
  const lines = cartLines();
  const total = lines.reduce((s, l) => s + l.product.price * l.quantity, 0);
  $('cart-count').textContent = lines.reduce((s, l) => s + l.quantity, 0);
  $('cart-total').textContent = money(total);
  $('checkout').disabled = lines.length === 0;
  $('cart-items').innerHTML = lines.length ? lines.map(({ product, quantity }) => `
    <div class="line">
      <strong>${product.name}</strong><span>${money(product.price * quantity)}</span>
      <div class="qty">
        <button data-dec="${product.id}" aria-label="Remove one ${product.name}">-</button>
        <span>${quantity}</span>
        <button data-inc="${product.id}" aria-label="Add one ${product.name}">+</button>
      </div>
      <button class="plain" data-del="${product.id}">Remove</button>
    </div>`).join('') : '<p class="empty">Your cart is empty. Add a plant to get started.</p>';
}

function change(id, delta) {
  const product = products.find((p) => p.id === id);
  const next = Math.min((cart[id] || 0) + delta, product.stock);
  if (next <= 0) delete cart[id]; else cart[id] = next;
  saveCart(); renderCart();
}

function toggleCart(open) {
  $('cart').classList.toggle('open', open);
  $('cart').setAttribute('aria-hidden', String(!open));
  $('scrim').hidden = !open;
}

document.addEventListener('click', (e) => {
  const t = e.target;
  if (t.dataset.add) { change(Number(t.dataset.add), 1); toggleCart(true); }
  if (t.dataset.inc) change(Number(t.dataset.inc), 1);
  if (t.dataset.dec) change(Number(t.dataset.dec), -1);
  if (t.dataset.del) { delete cart[t.dataset.del]; saveCart(); renderCart(); }
  if (t.classList.contains('chip')) { category = t.dataset.cat; renderFilters(); renderGrid(); }
});

$('search').addEventListener('input', (e) => { query = e.target.value.trim().toLowerCase(); renderGrid(); });
$('open-cart').addEventListener('click', () => toggleCart(true));
$('close-cart').addEventListener('click', () => toggleCart(false));
$('scrim').addEventListener('click', () => toggleCart(false));
$('checkout').addEventListener('click', () => { toggleCart(false); $('checkout-dialog').showModal(); });
$('cancel-checkout').addEventListener('click', () => { $('checkout-dialog').close(); toggleCart(true); });
$('done-close').addEventListener('click', () => $('done-dialog').close());

$('checkout-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('form-error').textContent = '';
  const form = new FormData(e.target);
  const body = {
    customer: { name: form.get('name'), email: form.get('email'), address: form.get('address') },
    items: Object.entries(cart).map(([productId, quantity]) => ({ productId: Number(productId), quantity }))
  };
  const res = await fetch('/api/orders', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) { $('form-error').textContent = data.error; return; }
  cart = {}; saveCart();
  $('checkout-dialog').close();
  e.target.reset();
  $('done-text').textContent = `Thanks, ${data.customer.name}. Order #${data.id} for ${money(data.total)} is confirmed.`;
  $('done-dialog').showModal();
  await loadProducts();
});

loadProducts();
