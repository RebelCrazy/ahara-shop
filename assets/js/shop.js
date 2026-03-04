/**
 * AHARA SHOP — JavaScript Principal
 * Cart, UI, interacciones
 */

// ============================================================
// CART ENGINE
// ============================================================
const Cart = {
  key: 'ahara_cart',

  get() {
    try { return JSON.parse(localStorage.getItem(this.key)) || []; }
    catch { return []; }
  },

  save(items) {
    localStorage.setItem(this.key, JSON.stringify(items));
    this.update();
  },

  add(product, qty = 1) {
    const items = this.get();
    const cartKey = `${product.id}|${product.variant || ''}`;
    const existing = items.find(i => i.cartKey === cartKey);
    if (existing) {
      existing.qty = Math.min(existing.qty + qty, 99);
    } else {
      items.push({ ...product, cartKey, qty });
    }
    this.save(items);
    toast(`${product.name} añadido al carrito`);
    CartUI.open();
  },

  remove(cartKey) {
    this.save(this.get().filter(i => i.cartKey !== cartKey));
  },

  updateQty(cartKey, delta) {
    const items = this.get().map(i => {
      if (i.cartKey === cartKey) {
        i.qty = Math.max(1, Math.min(99, i.qty + delta));
      }
      return i;
    });
    this.save(items);
  },

  setQty(cartKey, qty) {
    const q = parseInt(qty);
    if (isNaN(q) || q < 1) return;
    const items = this.get().map(i => {
      if (i.cartKey === cartKey) i.qty = Math.min(q, 99);
      return i;
    });
    this.save(items);
  },

  clear() { this.save([]); },

  total() {
    return this.get().reduce((sum, i) => sum + i.price * i.qty, 0);
  },

  count() {
    return this.get().reduce((sum, i) => sum + i.qty, 0);
  },

  update() {
    // Update all count badges
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = this.count();
    });
    CartUI.render();
  }
};

// ============================================================
// CART UI (sidebar)
// ============================================================
const CartUI = {
  sidebar: null,
  overlay: null,

  init() {
    this.sidebar = document.getElementById('cart-sidebar');
    this.overlay = document.getElementById('cart-overlay');
    if (!this.sidebar) return;

    this.overlay?.addEventListener('click', () => this.close());
    document.getElementById('cart-close')?.addEventListener('click', () => this.close());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });
    this.render();
  },

  open() {
    this.sidebar?.classList.add('open');
    this.overlay?.classList.add('visible');
    document.body.style.overflow = 'hidden';
  },

  close() {
    this.sidebar?.classList.remove('open');
    this.overlay?.classList.remove('visible');
    document.body.style.overflow = '';
  },

  render() {
    const body = document.getElementById('cart-body');
    const footer = document.getElementById('cart-footer');
    if (!body) return;

    const items = Cart.get();

    if (items.length === 0) {
      body.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon"><i data-lucide="shopping-bag" style="width:48px;height:48px"></i></div>
          <p>Tu carrito está vacío</p>
          <a href="/pages/shop.html" class="btn btn-outline" style="margin-top:1rem">Ver tienda</a>
        </div>`;
      if (footer) footer.innerHTML = '';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    body.innerHTML = items.map(item => `
      <div class="cart-item" data-key="${item.cartKey}">
        <div class="cart-item-img">
          <img src="${item.image}" alt="${item.name}" loading="lazy">
        </div>
        <div class="cart-item-body">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-meta">${item.variant || ''}</div>
          <div class="cart-item-qty">
            <button onclick="Cart.updateQty('${item.cartKey}', -1); CartUI.render()">−</button>
            <span>${item.qty}</span>
            <button onclick="Cart.updateQty('${item.cartKey}', 1); CartUI.render()">+</button>
          </div>
        </div>
        <div class="cart-item-right">
          <div class="cart-item-price">${fmt(item.price * item.qty)}</div>
          <button class="cart-item-remove" onclick="Cart.remove('${item.cartKey}')" title="Eliminar"><i data-lucide="x"></i></button>
        </div>
      </div>
    `).join('');

    if (footer) {
      footer.innerHTML = `
        <div class="cart-subtotal">
          <span class="cart-subtotal-label">Subtotal</span>
          <span class="cart-subtotal-value">${fmt(Cart.total())}</span>
        </div>
        <a href="/pages/cart.html" class="btn btn-outline btn-full" style="margin-bottom:.7rem">Ver carrito</a>
        <a href="/pages/checkout.html" class="btn btn-white btn-full">Finalizar compra</a>
      `;
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
};

// ============================================================
// PRODUCT CATALOG
// ============================================================
const Products = {
  _data: null,

  async load() {
    if (this._data) return this._data;
    // Determine base path
    const base = window.location.hostname.includes('github') || window.location.protocol === 'https:' 
      ? '' : '';
    const res = await fetch('/data/products.json');
    this._data = await res.json();
    return this._data;
  },

  async getAll() {
    const d = await this.load();
    return d.products;
  },

  async getBySlug(slug) {
    const p = await this.getAll();
    return p.find(prod => prod.slug === slug);
  },

  async getByCategory(cat) {
    const p = await this.getAll();
    return cat ? p.filter(prod => prod.category === cat) : p;
  },

  async getCategories() {
    const d = await this.load();
    return d.categories;
  }
};

// ============================================================
// RENDER HELPERS
// ============================================================
function fmt(n) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
}

function renderProductCard(product) {
  const img = product.images[0] || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500';
  const badge = product.badge ? `<span class="product-badge">${product.badge}</span>` : '';
  const comparePrice = product.comparePrice
    ? `<span class="price-old">${fmt(product.comparePrice)}</span>` : '';

  return `
    <article class="product-card" data-id="${product.id}">
      <a href="/pages/product.html?slug=${product.slug}" class="product-image">
        <img src="${img}" alt="${product.name}" loading="lazy">
        ${badge}
        <div class="product-actions">
          <button onclick="quickAdd(event, '${product.id}')">Añadir</button>
          <button onclick="window.location.href='/pages/product.html?slug=${product.slug}'">Ver</button>
        </div>
      </a>
      <div class="product-info">
        <div class="product-category">${product.category}</div>
        <h3 class="product-name">
          <a href="/pages/product.html?slug=${product.slug}">${product.name}</a>
        </h3>
        <div class="product-price">
          ${comparePrice}
          <span class="${product.comparePrice ? 'price-sale' : ''}">${fmt(product.price)}</span>
        </div>
      </div>
    </article>
  `;
}

async function quickAdd(e, productId) {
  e.preventDefault();
  e.stopPropagation();
  const prods = await Products.getAll();
  const product = prods.find(p => p.id === productId);
  if (!product) return;
  Cart.add({
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.images[0],
    variant: ''
  });
}

// ============================================================
// TOAST
// ============================================================
function toast(msg, duration = 3000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), duration);
}

// ============================================================
// HEADER STICKY SCROLL
// ============================================================
function initStickyHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
}

// ============================================================
// BACK TO TOP
// ============================================================
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ============================================================
// MOBILE MENU
// ============================================================
function initMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const nav = document.querySelector('.main-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.innerHTML = isOpen ? '<i data-lucide="x"></i>' : '<i data-lucide="menu"></i>';
    if (typeof lucide !== 'undefined') lucide.createIcons();
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
}

// ============================================================
// CART OPEN BUTTON
// ============================================================
function initCartButton() {
  document.querySelectorAll('[data-open-cart]').forEach(btn => {
    btn.addEventListener('click', () => CartUI.open());
  });
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  Cart.update();
  CartUI.init();
  initStickyHeader();
  initBackToTop();
  initMobileMenu();
  initCartButton();
});
