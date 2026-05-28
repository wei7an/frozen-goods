/* ========================================
   main.js — Frontend Product Display Logic
   Search, filtering, product grid rendering,
   detail modal, navigation, responsive menu
   ======================================== */

(function () {
  'use strict';

  /* ---------- DOM Refs ---------- */
  const $ = (s, p) => (p || document).querySelector(s);
  const $$ = (s, p) => [...(p || document).querySelectorAll(s)];

  const searchInput   = $('#searchInput');
  const searchClear   = $('#searchClear');
  const categoryTabs  = $('#categoryTabs');
  const productGrid   = $('#productGrid');
  const emptyState    = $('#emptyState');
  const emptyText     = $('#emptyText');
  const clearFilterBtn = $('#clearFilterBtn');
  const detailModal   = $('#detailModal');
  const detailBody    = $('#detailBody');
  const detailClose   = $('#detailClose');
  const nav           = $('#nav');
  const menuToggle    = $('#menuToggle');
  const header        = $('#header');
  const storageWarning = $('#storageWarning');

  let currentCategory = 'all';
  let searchDebounce  = null;

  /* ---------- Init ---------- */
  function init() {
    if (!FrozenData.isStorageAvailable()) {
      storageWarning.classList.add('visible');
    }
    FrozenData.initData();
    renderCategoryTabs();
    renderProducts();
    bindEvents();
    restoreFilterFromHash();
  }

  /* ---------- Category Tabs ---------- */
  function renderCategoryTabs() {
    const cats = FrozenData.getCategories();
    let html = '<button class="cat-tab active" data-category="all">全部</button>';
    cats.forEach(c => {
      html += `<button class="cat-tab" data-category="${c.id}">${c.icon} ${c.name}</button>`;
    });
    categoryTabs.innerHTML = html;
  }

  /* ---------- Render Products ---------- */
  function renderProducts() {
    const search = searchInput.value;
    const products = FrozenData.filterProducts({ category: currentCategory, search });

    if (products.length === 0) {
      productGrid.innerHTML = '';
      emptyState.style.display = 'block';
      if (search && currentCategory !== 'all') {
        emptyText.textContent = `未找到与「${search}」相关的产品`;
      } else if (search) {
        emptyText.textContent = `未找到与「${search}」相关的产品，请尝试其他关键词`;
      } else {
        emptyText.textContent = '该分类暂无产品，请浏览其他分类';
      }
      clearFilterBtn.style.display = 'inline-flex';
      return;
    }

    emptyState.style.display = 'none';
    productGrid.innerHTML = products.map((p, i) => {
      const cat = FrozenData.getCategoryById(p.category);
      const stockLabel = FrozenData.getStockLabel(p.stock);
      const imageHTML = p.imageUrl
        ? `<img src="${escapeHTML(p.imageUrl)}" alt="${escapeHTML(p.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="card-img-placeholder" style="display:none">${cat ? cat.icon : '📦'}</span>`
        : `<span class="card-img-placeholder">${cat ? cat.icon : '📦'}</span>`;

      return `
        <div class="product-card" data-id="${p.id}" style="animation-delay:${i * 0.05}s">
          <div class="card-image">
            ${imageHTML}
            <span class="card-badge-cat" style="background:${cat ? cat.color : '#999'}">${cat ? cat.name : ''}</span>
            <span class="card-badge-stock ${p.stock}">${stockLabel}</span>
          </div>
          <div class="card-body">
            <h3 class="card-name">${escapeHTML(p.name)}</h3>
            <div class="card-specs">规格: ${escapeHTML(p.specs)} | ${p.unit}</div>
            <button class="card-btn">查看详情</button>
          </div>
        </div>`;
    }).join('');
  }

  /* ---------- Detail Modal ---------- */
  function openDetailModal(productId) {
    const p = FrozenData.getProductById(productId);
    if (!p) return;
    const cat = FrozenData.getCategoryById(p.category);
    const stockLabel = FrozenData.getStockLabel(p.stock);

    const imageHTML = p.imageUrl
      ? `<img src="${escapeHTML(p.imageUrl)}" alt="${escapeHTML(p.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span class="detail-img-placeholder" style="display:none">${cat ? cat.icon : '📦'}</span>`
      : `<span class="detail-img-placeholder">${cat ? cat.icon : '📦'}</span>`;

    detailBody.innerHTML = `
      <div class="detail-grid">
        <div class="detail-image">${imageHTML}</div>
        <div class="detail-info">
          <span class="detail-cat" style="background:${cat ? cat.color : '#999'}">${cat ? cat.name : ''}</span>
          <h2>${escapeHTML(p.name)}</h2>
          <div class="detail-meta">
            <span class="detail-meta-item"><strong>规格:</strong> ${escapeHTML(p.specs)}</span>
            <span class="detail-meta-item"><strong>单位:</strong> ${p.unit}</span>
            <span class="detail-meta-item"><strong>分类:</strong> ${cat ? cat.name : ''}</span>
          </div>
          <span class="detail-stock ${p.stock}">${stockLabel}</span>
          <p class="detail-desc">${escapeHTML(p.description)}</p>
          <a href="#contact" class="btn btn-primary" style="width:100%">联系我们咨询订购</a>
        </div>
      </div>`;

    detailModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDetailModal() {
    detailModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  /* ---------- Navigation ---------- */
  function updateActiveNav() {
    const scrollY = window.scrollY;
    const sections = $$('section[id]');
    let current = '';
    sections.forEach(s => {
      if (scrollY >= s.offsetTop - 100) {
        current = s.id;
      }
    });
    $$('.nav-link').forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  }

  /* ---------- Hash State ---------- */
  function updateHash() {
    const params = [];
    if (currentCategory !== 'all') params.push(`category=${currentCategory}`);
    if (searchInput.value.trim()) params.push(`search=${encodeURIComponent(searchInput.value.trim())}`);
    if (params.length) {
      location.hash = '#' + params.join('&');
    } else {
      history.replaceState(null, '', location.pathname + location.search);
    }
  }

  function restoreFilterFromHash() {
    if (!location.hash) return;
    const hash = location.hash.substring(1);
    const parts = hash.split('&');
    let changed = false;
    parts.forEach(part => {
      const [key, val] = part.split('=');
      if (key === 'category' && val) {
        currentCategory = val;
        changed = true;
      }
      if (key === 'search' && val) {
        searchInput.value = decodeURIComponent(val);
        searchClear.style.display = 'flex';
        changed = true;
      }
    });
    if (changed) {
      updateCategoryTabsUI();
      renderProducts();
    }
  }

  function updateCategoryTabsUI() {
    $$('.cat-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.category === currentCategory);
    });
  }

  /* ---------- Events ---------- */
  function bindEvents() {
    // Category tabs
    categoryTabs.addEventListener('click', e => {
      const tab = e.target.closest('.cat-tab');
      if (!tab) return;
      currentCategory = tab.dataset.category;
      updateCategoryTabsUI();
      renderProducts();
      updateHash();
    });

    // Search input
    searchInput.addEventListener('input', () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        const val = searchInput.value.trim();
        searchClear.style.display = val ? 'flex' : 'none';
        renderProducts();
        updateHash();
      }, 300);
    });

    // Clear search
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchClear.style.display = 'none';
      renderProducts();
      updateHash();
      searchInput.focus();
    });

    // Clear filter (empty state)
    clearFilterBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchClear.style.display = 'none';
      currentCategory = 'all';
      updateCategoryTabsUI();
      renderProducts();
      updateHash();
    });

    // Product card click → detail modal
    productGrid.addEventListener('click', e => {
      const card = e.target.closest('.product-card');
      if (!card) return;
      if (e.target.closest('.card-btn')) {
        openDetailModal(card.dataset.id);
      } else {
        openDetailModal(card.dataset.id);
      }
    });

    // Detail modal close
    detailClose.addEventListener('click', closeDetailModal);
    detailModal.addEventListener('click', e => {
      if (e.target === detailModal) closeDetailModal();
    });

    // Detail modal "联系我们" link → close modal
    detailBody.addEventListener('click', e => {
      if (e.target.closest('a[href="#contact"]')) {
        setTimeout(closeDetailModal, 200);
      }
    });

    // Keyboard
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && detailModal.classList.contains('active')) {
        closeDetailModal();
      }
    });

    // Mobile menu
    menuToggle.addEventListener('click', () => {
      nav.classList.toggle('open');
    });

    // Nav links close mobile menu
    nav.addEventListener('click', e => {
      if (e.target.closest('.nav-link')) {
        nav.classList.remove('open');
      }
    });

    // Header scroll shadow
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 10);
      updateActiveNav();
    });

    // Click outside mobile nav closes it
    document.addEventListener('click', e => {
      if (!nav.contains(e.target) && e.target !== menuToggle && !menuToggle.contains(e.target)) {
        nav.classList.remove('open');
      }
    });

    // Hash change (back/forward navigation)
    window.addEventListener('hashchange', () => {
      restoreFilterFromHash();
    });

    // Storage event — another tab changed data
    window.addEventListener('storage', e => {
      if (e.key === 'frozen_goods_products') {
        FrozenData.initData();
        renderProducts();
      }
    });
  }

  /* ---------- Helpers ---------- */
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ---------- Start ---------- */
  init();
})();
