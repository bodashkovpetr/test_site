(function () {
  'use strict';

  // ---------- Конфиг ----------
  const cfg = Object.assign(
    { useApi: true, apiBase: '/api' },   // по умолчанию работаем через API
    window.hitechConfig || {}
  );

  // ---------- Редирект на канонический домен (страховка на фронте) ----------
  if (location.hostname === 'yourstyle.space') {
    location.replace('https://www.yourstyle.space' + location.pathname + location.search + location.hash);
    return;
  }

  // ---------- Состояние ----------
  const state = {
    products: null
  };

  // ---------- Утилиты ----------
  function rub(cents) {
    const n = Number(cents || 0) / 100;
    return n.toFixed(2) + ' ₽';
  }
  function safeJSON(s, fallback) {
    try { return JSON.parse(s); } catch { return fallback; }
  }
  function byCategory(cat) {
    if (!state.products) return [];
    return state.products.filter(p => p.category === cat);
  }
  function getProductById(id) {
    if (!state.products) return undefined;
    return state.products.find(p => String(p.id) === String(id));
  }
  function cleanBase(base) {
    if (!base) return '';
    return base.replace(/\/+$/, '');
  }
  const API_BASE = cleanBase(cfg.apiBase || '/api');

  // ---------- Cookie / Token helpers (мост между www и apex) ----------
  function setCookie(name, value, days) {
    const max = days ? `; Max-Age=${days * 24 * 3600}` : '';
    document.cookie = `${name}=${encodeURIComponent(value || '')}; Path=/; Domain=.yourstyle.space; Secure; SameSite=Lax${max}`;
  }
  function getCookie(name) {
    return document.cookie
      .split(';')
      .map(s => s.trim())
      .find(s => s.startsWith(name + '='))?.split('=').slice(1).join('') || '';
  }
  function normalizeBearer(t) {
    if (!t) return '';
    return t.startsWith('Bearer ') ? t : `Bearer ${t}`;
  }
  function rawFromBearer(t) {
    if (!t) return '';
    return t.startsWith('Bearer ') ? t.slice(7) : t;
  }

  function getTokenRaw() {
    try {
      // порядок важен: сперва LS, потом cookie
      const ls =
        localStorage.getItem('authToken') ||
        localStorage.getItem('token') ||
        localStorage.getItem('jwt') ||
        localStorage.getItem('Authorization') ||
        '';
      if (ls) return rawFromBearer(ls);

      const c = getCookie('auth_token');
      if (c) return rawFromBearer(decodeURIComponent(c));
      return '';
    } catch {
      const c = getCookie('auth_token');
      return rawFromBearer(decodeURIComponent(c || ''));
    }
  }
  function setTokenRaw(raw) {
    // Сохраняем и в LS, и в cookie (мост между доменами)
    try {
      if (raw) localStorage.setItem('authToken', raw);
      else localStorage.removeItem('authToken');
    } catch {}
    if (raw) setCookie('auth_token', raw, 7);
    else setCookie('auth_token', '', -1);
  }
  function getTokenBearer() {
    return normalizeBearer(getTokenRaw());
  }
  // Первичная синхронизация: если есть только где-то в одном месте — дублируем
  (function syncToken() {
    const ls = getTokenRaw();
    const c = rawFromBearer(decodeURIComponent(getCookie('auth_token') || ''));
    if (ls && !c) setCookie('auth_token', ls, 7);
    if (c && !ls) setTokenRaw(c);
  })();

  function authHeaders() {
    const t = getTokenBearer();
    return t ? { Authorization: t } : {};
  }

  // ---------- Текущий пользователь (для UI) ----------
  function getCurrentUser() {
    return safeJSON(localStorage.getItem('currentUser'), null);
  }
  function setCurrentUser(u) {
    if (u) localStorage.setItem('currentUser', JSON.stringify(u));
    else localStorage.removeItem('currentUser');
    updateAuthUI();
    updateCartCountUI();
  }

  // ---------- API fetch wrapper ----------
  async function apiFetch(path, options) {
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
    const headers = Object.assign(
      { 'Content-Type': 'application/json' },
      options?.headers || {},
      authHeaders()
    );
    const opts = Object.assign({}, options, { headers });

    const resp = await fetch(url, opts);
    let data = null;
    try { data = await resp.json(); } catch {}
    return { resp, data };
  }

  // ---------- Загрузка товаров ----------
  async function loadProducts() {
    if (state.products && Array.isArray(state.products)) return state.products;

    const url = (cfg.useApi === true)
      ? `${API_BASE}/products?ts=${Date.now()}`
      : 'assets/products.json';

    const res = await fetch(url, { cache: 'no-store' });
    const body = await res.json();

    const arr = Array.isArray(body) ? body
      : Array.isArray(body?.data) ? body.data
      : Array.isArray(body?.products) ? body.products
      : Array.isArray(body?.items) ? body.items
      : [];

    state.products = arr;
    return state.products;
  }

  // ---------- Рендер карточек ----------
  function renderProductCard(p) {
    const placeholder = 'data:image/svg+xml;utf8,' + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
         <rect width="100%" height="100%" fill="#111"/>
         <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
               fill="#9ca3af" font-size="20" font-family="Inter, Arial, sans-serif">
           Нет изображения
         </text>
       </svg>`
    );
    const src = (p.image_url && p.image_url.trim()) ? p.image_url : placeholder;

    return `
      <div class="card">
        <h3>${p.name}</h3>
        <img src="${src}" alt="${p.name}"
             onerror="this.onerror=null; this.src='${placeholder}'"/>
        <p>${p.description || ''}</p>
        <div class="row between center">
          <strong>${rub(p.price_cents)}</strong>
          <button data-add="${p.id}">В корзину</button>
        </div>
      </div>`;
  }
  function attachAddToCartHandlers(container) {
    container.querySelectorAll('[data-add]').forEach(btn => {
      btn.addEventListener('click', () => addToCart(btn.getAttribute('data-add')));
    });
  }
  function renderCategoryGrid(containerId, cat, limit) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const arr = byCategory(cat);
    const list = typeof limit === 'number' ? arr.slice(0, limit) : arr;
    el.innerHTML = list.map(renderProductCard).join('');
    if (window.imageFit) window.imageFit(el);
    attachAddToCartHandlers(el);
  }
  function renderFeaturedProduct(containerId) {
    const el = document.getElementById(containerId);
    if (!el || !state.products?.length) return;
    const p = state.products[Math.floor(Math.random() * state.products.length)];
    el.innerHTML = `
      <div class="featured-card">
        <div class="media">
          ${p.image_url ? `<img class="product-img" src="${p.image_url}" alt="${p.name}"/>` : ''}
        </div>
        <div class="details">
          <h3>${p.name}</h3>
          <p class="muted">${p.description || ''}</p>
          <div class="row between center">
            <strong>${rub(p.price_cents)}</strong>
            <button data-add="${p.id}">В корзину</button>
          </div>
        </div>
      </div>`;
    attachAddToCartHandlers(el);
  }
  function renderRandomProduct(containerId) {
    const el = document.getElementById(containerId);
    if (!el || !state.products?.length) return;
    const p = state.products[Math.floor(Math.random() * state.products.length)];
    el.innerHTML = renderProductCard(p);
    if (window.imageFit) window.imageFit(el);
    attachAddToCartHandlers(el);
  }
  function renderSearch(containerId, q) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const query = (q || '').trim().toLowerCase();
    if (!state.products?.length) {
      el.innerHTML = '<p>Нет данных о товарах.</p>';
      return;
    }
    let list = !query
      ? state.products.slice(0, 12)
      : state.products.filter(p =>
          (p.name || '').toLowerCase().includes(query) ||
          (p.description || '').toLowerCase().includes(query)
        );
    if (!list.length) {
      el.innerHTML = '<p>Ничего не найдено.</p>';
      return;
    }
    el.innerHTML = list.map(renderProductCard).join('');
    if (window.imageFit) window.imageFit(el);
    attachAddToCartHandlers(el);
  }

  // ---------- Локальная «корзина» (fallback без API) ----------
  function getUsers() { return safeJSON(localStorage.getItem('users'), []); }
  function saveUsers(u) { localStorage.setItem('users', JSON.stringify(u)); }

  function getCartKey() {
    const u = getCurrentUser();
    return u ? `cart:${(u.email || '').toLowerCase()}` : 'cart:guest';
  }
  function getCartLS() { return safeJSON(localStorage.getItem(getCartKey()), []); }
  function saveCartLS(c) { localStorage.setItem(getCartKey(), JSON.stringify(c)); updateCartCountUI(); }
  function clearCartForKey(key) { localStorage.setItem(key, JSON.stringify([])); }

  // ---------- КОРЗИНА (через API или локально) ----------
  async function fetchCart() {
    if (!cfg.useApi) {
      const items = getCartLS();
      const total = items.reduce((s, it) => {
        const p = getProductById(it.id);
        return s + (p ? p.price_cents * (it.qty || 0) : 0);
      }, 0);
      return { items, total_cents: total };
    }

    try {
      const { resp, data } = await apiFetch('/cart', { method: 'GET' });
      if (resp.status === 401) return { items: [], total_cents: 0 }; // не авторизован
      if (!resp.ok) throw new Error(data?.error || `HTTP ${resp.status}`);
      // Универсальная распаковка
      const payload = data?.data || data || {};
      const items = Array.isArray(payload.items) ? payload.items : (Array.isArray(payload) ? payload : []);
      const normalized = items.map(it => ({
        cartId: it.id,
        id: it.product_id ?? it.id,
        qty: it.quantity ?? it.qty ?? 1,
        price_cents: it.price_cents ?? 0,
        name: it.name
      }));
      const total = Number(payload.total_cents || 0);
      return { items: normalized, total_cents: total };
    } catch (e) {
      console.warn('fetchCart error:', e);
      return { items: [], total_cents: 0 };
    }
  }

  async function addToCart(id) {
    if (!cfg.useApi) {
      const c = getCartLS();
      const it = c.find(i => String(i.id) === String(id));
      if (it) it.qty += 1; else c.push({ id, qty: 1 });
      saveCartLS(c);
      return;
    }
    const user = getCurrentUser();
    if (!user) { alert('Нужно войти'); return; }
    try {
      const { resp, data } = await apiFetch('/cart', {
        method: 'POST',
        body: JSON.stringify({ product_id: id, quantity: 1 })
      });
      if (!resp.ok || data?.success === false) {
        alert(data?.error || 'Не удалось добавить');
        return;
      }
      updateCartCountUI();
    } catch {
      alert('Сеть недоступна');
    }
  }

  async function removeFromCart(id) {
    if (!cfg.useApi) {
      const c = getCartLS().filter(i => String(i.id) !== String(id));
      saveCartLS(c);
      return c;
    }
    try {
      const { resp, data } = await apiFetch(`/cart/by-product/${id}`, {
        method: 'DELETE'
      });
      if (!resp.ok || data?.success === false) {
        alert(data?.error || 'Не удалось удалить');
      }
      updateCartCountUI();
      return [];
    } catch {
      alert('Сеть недоступна');
      return [];
    }
  }

  async function updateCartCountUI(preloaded) {
    const link = document.getElementById('cart-link');
    if (!link) return;
    const cart = preloaded || await fetchCart();
    const count = (cart.items || []).reduce((s, i) => s + (i.qty || i.quantity || 0), 0);
    link.textContent = `Корзина (${count})`;
  }

  async function renderCart(listId, totalId) {
    const list = document.getElementById(listId);
    const totalEl = document.getElementById(totalId);
    if (!list || !totalEl) return;

    if (!state.products) {
      // грузим товары перед рендером корзины (на всякий)
      try { await loadProducts(); } catch {}
    }

    const cart = await fetchCart();
    const items = cart.items || [];

    if (!items.length) {
      list.innerHTML = '<p>Корзина пустая.</p>';
      totalEl.textContent = '';
      await updateCartCountUI(cart);
      return;
    }

    let total = 0;
    list.innerHTML = items.map(it => {
      const p = getProductById(it.id) || { price_cents: it.price_cents || 0, name: it.name || it.id };
      const qty = it.qty || it.quantity || 0;
      const line = p.price_cents * qty;
      total += line;
      return `
        <div class="cart-item row between start">
          <div>
            <strong>${p.name}</strong>
            <div>Цена: ${rub(p.price_cents)}</div>
            <div>Кол-во: ${qty}</div>
            <div>Сумма: ${rub(line)}</div>
          </div>
          <button data-remove="${p.id}">Удалить</button>
        </div>`;
    }).join('');

    totalEl.textContent = 'Итого: ' + rub(total);
    list.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await removeFromCart(btn.getAttribute('data-remove'));
        renderCart(listId, totalId);
      });
    });

    await updateCartCountUI({ items });
  }

  // ---------- Регистрация / Логин / Профиль ----------
  function register(name, email, password) {
    name = (name || '').trim();
    email = (email || '').trim().toLowerCase();
    password = (password || '').trim();
    if (!name || !email || !password) return { success: false, error: 'Заполните все поля' };
    const users = getUsers();
    if (users.find(u => (u.email || '').toLowerCase() === email)) {
      return { success: false, error: 'Пользователь с таким email уже существует' };
    }
    users.push({ name, email, password, phone: '', card: '' });
    saveUsers(users);
    return { success: true };
  }

  async function login(email, password) {
    email = (email || '').trim().toLowerCase();
    password = (password || '').trim();

    if (!cfg.useApi) {
      const u = getUsers().find(u => (u.email || '').toLowerCase() === email && u.password === password);
      if (!u) return false;
      setCurrentUser({ name: u.name, email: u.email, phone: u.phone || '', card: u.card || '' });
      clearCartForKey('cart:guest');
      updateCartCountUI();
      return true;
    }

    try {
      const { resp, data } = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (!resp.ok || data?.success === false) return false;
      const { user, token } = data?.data || {};
      if (token) setTokenRaw(rawFromBearer(token));
      if (user) setCurrentUser({ name: user.name, email: user.email, phone: user.phone || '', card: '' });
      clearCartForKey('cart:guest');
      updateCartCountUI();
      return true;
    } catch {
      return false;
    }
  }

  function logout() {
    setCurrentUser(null);
    setTokenRaw('');
    clearCartForKey('cart:guest');
    updateAuthUI();
    updateCartCountUI();
  }

  async function updateProfile(partial) {
    const user = getCurrentUser();
    if (!user) { alert('Нужно войти'); return false; }

    if (!cfg.useApi) {
      const users = getUsers();
      const idx = users.findIndex(u => (u.email || '').toLowerCase() === user.email.toLowerCase());
      const updated = Object.assign({}, user, partial || {});
      setCurrentUser(updated);
      if (idx >= 0) { users[idx] = Object.assign({}, users[idx], partial || {}); saveUsers(users); }
      updateAuthUI();
      return true;
    }

    try {
      const { resp, data } = await apiFetch('/users/me', {
        method: 'PUT',
        body: JSON.stringify(partial || {})
      });
      if (!resp.ok) {
        const msg = data?.message || data?.error || 'Не удалось обновить профиль';
        alert(msg);
        return false;
      }
      const merged = Object.assign({}, user, data || {});
      setCurrentUser(merged);
      updateAuthUI();
      return true;
    } catch {
      alert('Сеть недоступна'); return false;
    }
  }

  // ---------- Заказы ----------
  function getAllOrders() { return safeJSON(localStorage.getItem('orders'), []); }
  function saveAllOrders(a) { localStorage.setItem('orders', JSON.stringify(a)); }
  function getOrdersByEmail(email) {
    return getAllOrders().filter(o => (o.email || '').toLowerCase() === (email || '').toLowerCase());
  }

  async function checkout() {
    if (!cfg.useApi) {
      const cart = getCartLS();
      if (!cart.length) return { success: false, error: 'Корзина пустая' };
      const user = getCurrentUser();
      if (!user) return { success: false, needLogin: true };
      if (!user.name || !user.phone || !user.card) return { success: false, needProfile: true };
      let total = 0;
      const items = cart.map(it => ({ id: it.id, qty: it.qty }));
      items.forEach(it => { const p = getProductById(it.id); if (p) total += p.price_cents * it.qty; });
      const order = { id: 'ord_' + Date.now(), email: user.email, items, total_cents: total, created_at: new Date().toISOString() };
      const all = getAllOrders(); all.push(order); saveAllOrders(all); saveCartLS([]);
      return { success: true, order };
    }

    try {
      const user = getCurrentUser();
      if (!user) return { success: false, needLogin: true };
      const { resp, data } = await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({})
      });
      if (!resp.ok || data?.success === false) return { success: false, error: data?.error || 'Покупка не удалась' };
      updateCartCountUI();
      return { success: true, order: data?.data?.order };
    } catch {
      return { success: false, error: 'Сеть недоступна' };
    }
  }

  async function renderOrders(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const headers = { ...authHeaders?.() };
  let r = await fetch('/api/orders', { headers }).catch(()=>null);
  if (!r || r.status === 404) r = await fetch('/api/user/orders', { headers }).catch(()=>null);
  if (!r || r.status === 404) r = await fetch('/api/orders/my',   { headers }).catch(()=>null);

  if (!r) { el.innerHTML = '<p>Сеть недоступна</p>'; return; }

  let j = {};
  try { j = await r.json(); } catch {}
  if (!r.ok) { el.innerHTML = `<p>${j?.error || 'Не удалось загрузить заказы'}</p>`; return; }

  const payload = j?.data || j;
  const orders = payload?.orders || (Array.isArray(payload) ? payload : []);
  if (!orders?.length) { el.innerHTML = '<p>Пока нет покупок.</p>'; return; }

  if (!state.products) { try { await loadProducts(); } catch {} }
  const nameBy = id => (state.products || []).find(p => String(p.id)===String(id))?.name || ('ID '+id);
  const rub = c => ((+c||0)/100).toFixed(2) + ' ₽';

  el.innerHTML = orders.map(o => {
    const itemsHtml = (o.items || []).map(it=>{
      const qty = it.quantity ?? it.qty ?? 1;
      const pid = it.product_id ?? it.id;
      return `• ${it.name || nameBy(pid)} × ${qty}`;
    }).join('<br>');
    const total = rub(o.total_cents || o.totalCents || 0);
    const dt = new Date(o.created_at || o.createdAt || Date.now()).toLocaleString();
    return `<div class="order"><h4>Заказ #${o.id} — ${dt}</h4>${itemsHtml}<div><strong>Итого: ${total}</strong></div></div>`;
  }).join('');
}

  // ---------- UI (хедер) ----------
  function updateAuthUI() {
    const user = getCurrentUser();
    const loginLink = document.getElementById('login-link');
    const accountLink = document.getElementById('account-link');
    const logoutBtn = document.getElementById('logout-btn');
    if (!loginLink || !accountLink || !logoutBtn) return;
    if (user) {
      loginLink.style.display = 'none';
      accountLink.style.display = '';
      logoutBtn.style.display = '';
    } else {
      loginLink.style.display = '';
      accountLink.style.display = 'none';
      logoutBtn.style.display = 'none';
    }
  }

  async function initHeader() {
    await updateCartCountUI(); // безопасно, даже если не авторизован
    updateAuthUI();
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.onclick = () => { logout(); location.href = 'index.html'; };
  }

  // ---------- Экспорт ----------
  window.app = {
    // товары / рендер
    loadProducts, byCategory, getProductById,
    renderProductCard, renderCategoryGrid, renderFeaturedProduct, renderRandomProduct, renderSearch,
    // корзина
    addToCart, removeFromCart, renderCart, fetchCart, updateCartCountUI,
    // аутентификация
    register, login, logout, getCurrentUser, updateProfile,
    // заказы
    checkout, renderOrders,
    // ui
    initHeader
  };
})();