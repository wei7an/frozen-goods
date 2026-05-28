/* ========================================
   admin.js — CMS Admin Panel
   Auth, product table, add/edit form,
   delete confirmation, toast, password mgmt
   ======================================== */

(function () {
  'use strict';

  const $ = (s, p) => (p || document).querySelector(s);
  const $$ = (s, p) => [...(p || document).querySelectorAll(s)];

  const DEFAULT_PWD = 'admin123';
  const AUTH_KEY = 'admin_authenticated';

  /* ---------- DOM Refs ---------- */
  // Login
  const loginOverlay  = $('#loginOverlay');
  const loginForm     = $('#loginForm');
  const loginPassword = $('#loginPassword');
  const loginError    = $('#loginError');
  const loginHint     = $('#loginHint');
  const resetPwdBtn   = $('#resetPwdBtn');

  // Admin
  const adminWrapper     = $('#adminWrapper');
  const adminSearch      = $('#adminSearch');
  const adminCatFilter   = $('#adminCategoryFilter');
  const addProductBtn    = $('#addProductBtn');
  const addFirstBtn      = $('#addFirstBtn');
  const statsBar         = $('#statsBar');
  const tableBody        = $('#tableBody');
  const tableEmpty       = $('#tableEmpty');
  const storageWarning   = $('#storageWarning');

  // Form modal
  const formModal        = $('#formModal');
  const formModalTitle   = $('#formModalTitle');
  const formModalClose   = $('#formModalClose');
  const productForm      = $('#productForm');
  const formProductId    = $('#formProductId');
  const formName         = $('#formName');
  const formCategory     = $('#formCategory');
  const formUnit         = $('#formUnit');
  const formStock        = $('#formStock');
  const formSpecs        = $('#formSpecs');
  const formDescription  = $('#formDescription');
  const formImageUrl     = $('#formImageUrl');
  const formImageFile    = $('#formImageFile');
  const formImageUploadBtn = $('#formImageUploadBtn');
  const formFeatured     = $('#formFeatured');
  const formCancelBtn    = $('#formCancelBtn');
  const imagePreview     = $('#imagePreview');
  const imagePreviewImg  = $('#imagePreviewImg');

  // Password modal
  const pwdModal        = $('#pwdModal');
  const pwdModalClose   = $('#pwdModalClose');
  const pwdForm         = $('#pwdForm');
  const pwdCurrent      = $('#pwdCurrent');
  const pwdNew          = $('#pwdNew');
  const pwdConfirm      = $('#pwdConfirm');
  const changePwdBtn    = $('#changePwdBtn');
  const logoutBtn       = $('#logoutBtn');

  // Toast
  const toastContainer  = $('#toastContainer');

  // Migration
  const migratePanel    = $('#migratePanel');
  const migrateList     = $('#migrateList');
  const migrateAllBtn   = $('#migrateAllBtn');
  const migrateCloseBtn = $('#migrateCloseBtn');
  const exportDataBtn   = $('#exportDataBtn');

  let deletedProduct = null;
  let deleteTimer = null;
  let imageDebounce = null;

  /* ---------- Init ---------- */
  function init() {
    FrozenData.initData();

    if (!FrozenData.isStorageAvailable()) {
      storageWarning.classList.add('visible');
    }

    // Populate form dropdowns
    populateSelect(formCategory, FrozenData.getCategories().map(c => ({ value: c.id, label: c.icon + ' ' + c.name })));
    populateSelect(formUnit, FrozenData.getUnits().map(u => ({ value: u, label: u })));
    populateSelect(formStock, FrozenData.getStockOptions().map(s => ({ value: s.value, label: s.label })));
    populateSelect(adminCatFilter, [
      { value: 'all', label: '全部分类' },
      ...FrozenData.getCategories().map(c => ({ value: c.id, label: c.icon + ' ' + c.name }))
    ]);

    // Check auth
    checkAuth();
    bindEvents();
  }

  /* ---------- Auth ---------- */
  function checkAuth() {
    if (sessionStorage.getItem(AUTH_KEY) === 'true') {
      loginOverlay.style.display = 'none';
      adminWrapper.style.display = 'block';
      renderTable();
      renderStats();

      // First-time login hint
      if (!FrozenData.getAdminPassword()) {
        showToast('首次登录，建议修改默认密码', 'warning', 5000);
      }
    } else {
      loginOverlay.style.display = 'flex';
      adminWrapper.style.display = 'none';

      // Show hint for first use
      if (!FrozenData.getAdminPassword()) {
        loginHint.textContent = '首次登录，默认密码：admin123';
      } else {
        loginHint.textContent = '';
      }
    }
  }

  function doLogin(password) {
    const storedPwd = FrozenData.getAdminPassword() || DEFAULT_PWD;
    if (password === storedPwd) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      loginOverlay.style.display = 'none';
      adminWrapper.style.display = 'block';
      loginError.classList.remove('visible');
      loginPassword.value = '';
      renderTable();
      renderStats();
    } else {
      loginError.textContent = '密码错误，请重试';
      loginError.classList.add('visible');
      loginPassword.focus();
    }
  }

  function doLogout() {
    sessionStorage.removeItem(AUTH_KEY);
    loginOverlay.style.display = 'flex';
    adminWrapper.style.display = 'none';
  }

  /* ---------- Render Table ---------- */
  function renderTable() {
    const search = adminSearch.value.trim();
    const cat = adminCatFilter.value;

    const products = FrozenData.filterProducts({ category: cat === 'all' ? null : cat, search });

    if (products.length === 0) {
      tableBody.innerHTML = '';
      tableEmpty.style.display = 'block';
      $('.product-table', adminWrapper).style.display = 'none';
    } else {
      tableEmpty.style.display = 'none';
      $('.product-table', adminWrapper).style.display = '';
      tableBody.innerHTML = products.map(p => {
        const cat = FrozenData.getCategoryById(p.category);
        const stockLabel = FrozenData.getStockLabel(p.stock);
        const thumbHTML = p.imageUrl
          ? `<img src="${esc(p.imageUrl)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span style="display:none">${cat ? cat.icon : '📦'}</span>`
          : `<span>${cat ? cat.icon : '📦'}</span>`;

        return `
          <tr data-id="${p.id}">
            <td class="td-image" data-label="图片">
              <div class="table-thumb">${thumbHTML}</div>
            </td>
            <td class="td-name" data-label="名称">${esc(p.name)}${p.featured ? ' <span style="color:var(--color-warning);font-size:11px">★推荐</span>' : ''}</td>
            <td data-label="分类"><span class="td-cat-badge" style="background:${cat ? cat.color : '#999'}">${cat ? cat.name : ''}</span></td>
            <td data-label="规格">${esc(p.specs)}</td>
            <td data-label="库存"><span class="td-stock-badge ${p.stock}">${stockLabel}</span></td>
            <td class="td-actions" data-label="操作">
              <div class="action-btns">
                <button class="btn btn-ghost btn-sm edit-btn" data-id="${p.id}">
                  <svg width="14" height="14"><use href="#icon-edit"/></svg> 编辑
                </button>
                <button class="btn btn-ghost btn-sm delete-btn" data-id="${p.id}" style="color:var(--color-danger)">
                  <svg width="14" height="14"><use href="#icon-trash"/></svg> 删除
                </button>
              </div>
              <div class="delete-confirm" style="display:none">
                <span>确认删除？</span>
                <button class="btn btn-danger btn-sm confirm-delete-btn" data-id="${p.id}">删除</button>
                <button class="btn btn-ghost btn-sm cancel-delete-btn">取消</button>
              </div>
            </td>
          </tr>`;
      }).join('');
    }
  }

  function renderStats() {
    const stats = FrozenData.getStats();
    const cats = FrozenData.getCategories();
    const usage = FrozenData.getStorageUsage();
    const usageMB = usage > 0 ? (usage / 1024 / 1024).toFixed(2) : '?';
    const usagePercent = usage > 0 ? Math.round(usage / (5 * 1024 * 1024) * 100) : 0;
    let html = `<span class="stat-item">共 <strong>${stats.total}</strong> 件商品</span>`;
    cats.forEach(c => {
      html += `<span class="stat-item" style="border-left:3px solid ${c.color}">${c.icon} ${c.name}：<strong>${stats.byCategory[c.id] || 0}</strong></span>`;
    });
    html += `<span class="stat-item" style="border-left:3px solid ${usagePercent > 80 ? '#C62828' : usagePercent > 50 ? '#F57F17' : '#43A047'}">存储：<strong>${usageMB} MB</strong> / 5 MB (${usagePercent}%)</span>`;
    statsBar.innerHTML = html;
  }

  /* ---------- Table Events (delegated) ---------- */
  tableBody.addEventListener('click', e => {
    const row = e.target.closest('tr');
    if (!row) return;

    // Edit
    const editBtn = e.target.closest('.edit-btn');
    if (editBtn) {
      openFormModal(editBtn.dataset.id);
      return;
    }

    // Delete — show confirm
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
      const actionBtns = deleteBtn.closest('.action-btns');
      const confirmRow = row.querySelector('.delete-confirm');
      actionBtns.style.display = 'none';
      confirmRow.style.display = 'flex';
      return;
    }

    // Confirm delete
    const confirmBtn = e.target.closest('.confirm-delete-btn');
    if (confirmBtn) {
      const id = confirmBtn.dataset.id;
      const product = FrozenData.deleteProduct(id);
      if (product) {
        deletedProduct = product;
        showToast(`「${product.name}」已删除`, 'success', 5000, '撤销', () => {
          // Undo
          FrozenData.addProduct({
            name: product.name, category: product.category,
            unit: product.unit, specs: product.specs, description: product.description,
            imageUrl: product.imageUrl, stock: product.stock, featured: product.featured
          });
          deletedProduct = null;
          renderTable();
          renderStats();
          showToast('已撤销删除', 'success', 2000);
        });
        // Clear undo after timeout
        clearTimeout(deleteTimer);
        deleteTimer = setTimeout(() => { deletedProduct = null; }, 5000);
        renderTable();
        renderStats();
      } else {
        showToast('删除失败', 'error', 3000);
      }
      return;
    }

    // Cancel delete
    const cancelBtn = e.target.closest('.cancel-delete-btn');
    if (cancelBtn) {
      const actionBtns = row.querySelector('.action-btns');
      const confirmRow = row.querySelector('.delete-confirm');
      actionBtns.style.display = '';
      confirmRow.style.display = 'none';
    }
  });

  /* ---------- Form Modal ---------- */
  function openFormModal(id) {
    const isEdit = !!id;
    formProductId.value = id || '';
    formModalTitle.textContent = isEdit ? '编辑产品' : '添加产品';

    // Reset form
    productForm.reset();
    clearFormErrors();
    imagePreview.style.display = 'none';

    if (isEdit) {
      const p = FrozenData.getProductById(id);
      if (!p) return;
      formName.value = p.name;
      formCategory.value = p.category;
      formUnit.value = p.unit;
      formStock.value = p.stock;
      formSpecs.value = p.specs;
      formDescription.value = p.description;
      formImageUrl.value = p.imageUrl;
      formFeatured.checked = p.featured;
      if (p.imageUrl) showImagePreview(p.imageUrl);
    }

    formModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    formName.focus();
  }

  function closeFormModal() {
    formModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function saveProduct() {
    if (!validateForm()) return;

    const data = {
      name: formName.value.trim(),
      category: formCategory.value,
      unit: formUnit.value,
      stock: formStock.value,
      specs: formSpecs.value.trim(),
      description: formDescription.value.trim(),
      imageUrl: formImageUrl.value.trim(),
      featured: formFeatured.checked,
    };

    const id = formProductId.value;

    if (id) {
      const updated = FrozenData.updateProduct(id, data);
      if (updated) {
        showToast('产品更新成功', 'success', 3000);
        closeFormModal();
        renderTable();
        renderStats();
      } else {
        const usage = FrozenData.getStorageUsage();
        const usageMB = usage > 0 ? (usage / 1024 / 1024).toFixed(1) : '?';
        showToast('保存失败！存储空间不足（已用 ' + usageMB + ' MB）。请删除一些产品或使用更小的图片。', 'error', 6000);
      }
    } else {
      const created = FrozenData.addProduct(data);
      if (created) {
        showToast('产品添加成功', 'success', 3000);
        closeFormModal();
        renderTable();
        renderStats();
      } else {
        const usage = FrozenData.getStorageUsage();
        const usageMB = usage > 0 ? (usage / 1024 / 1024).toFixed(1) : '?';
        showToast('保存失败！存储空间不足（已用 ' + usageMB + ' MB）。请删除一些产品或使用更小的图片。', 'error', 6000);
      }
    }
  }

  /* ---------- Form Validation ---------- */
  function validateForm() {
    let valid = true;
    clearFormErrors();

    if (!formName.value.trim()) {
      showFieldError(formName, '请输入产品名称');
      valid = false;
    }
    if (!formSpecs.value.trim()) {
      showFieldError(formSpecs, '请输入产品规格');
      valid = false;
    }
    const url = formImageUrl.value.trim();
    if (url && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:') && !url.startsWith('images/')) {
      // Warn but still allow — could be other relative paths
      showFieldError(formImageUrl, '请使用网络URL、本地上传图片、或 images/ 路径');
      valid = false;
    }

    return valid;
  }

  function showFieldError(field, msg) {
    field.classList.add('error');
    const err = field.closest('.form-group').querySelector('.form-error');
    if (err) {
      err.textContent = msg;
      err.classList.add('visible');
    }
  }

  function clearFormErrors() {
    $$('.form-input.error').forEach(el => el.classList.remove('error'));
    $$('.form-error.visible').forEach(el => el.classList.remove('visible'));
  }

  /* ---------- Image Preview ---------- */
  formImageUrl.addEventListener('input', () => {
    clearTimeout(imageDebounce);
    const url = formImageUrl.value.trim();
    if (!url) {
      imagePreview.style.display = 'none';
      return;
    }
    imageDebounce = setTimeout(() => showImagePreview(url), 500);
  });

  // File upload button — trigger hidden file input
  formImageUploadBtn.addEventListener('click', () => {
    formImageFile.click();
  });

  // File selected — convert to base64 data URL
  formImageFile.addEventListener('change', () => {
    const file = formImageFile.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('请选择图片文件', 'error', 3000);
      formImageFile.value = '';
      return;
    }
    convertImageToBase64(file, (dataUrl, err) => {
      if (err) {
        showToast('图片处理失败：' + err, 'error', 3000);
        return;
      }
      formImageUrl.value = dataUrl;
      showImagePreview(dataUrl);
      clearFormErrors();
    });
  });

  function convertImageToBase64(file, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        // Resize to max 400px wide to minimize storage usage
        const MAX_W = 400;
        let w = img.width;
        let h = img.height;
        if (w > MAX_W) {
          h = Math.round(h * (MAX_W / w));
          w = MAX_W;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        callback(dataUrl, null);
      };
      img.onerror = function() {
        callback(null, '无法解析图片文件');
      };
      img.src = e.target.result;
    };
    reader.onerror = function() {
      callback(null, '无法读取文件');
    };
    reader.readAsDataURL(file);
  }

  function showImagePreview(url) {
    imagePreview.style.display = 'block';
    imagePreviewImg.src = url;
    imagePreviewImg.onerror = () => {
      imagePreviewImg.style.display = 'none';
    };
    imagePreviewImg.onload = () => {
      imagePreviewImg.style.display = 'block';
    };
  }

  /* ---------- Image Migration ---------- */
  function openMigratePanel() {
    const products = FrozenData.getProducts();
    const withImages = products.filter(p => p.imageUrl && p.imageUrl.startsWith('data:'));
    if (withImages.length === 0) {
      showToast('没有需要迁移的本地图片，所有产品已使用文件路径或网络URL', 'warning', 4000);
      return;
    }
    renderMigrateList();
    migratePanel.style.display = 'block';
  }

  function closeMigratePanel() {
    migratePanel.style.display = 'none';
  }

  function renderMigrateList() {
    const products = FrozenData.getProducts();
    const withImages = products.filter(p => p.imageUrl && p.imageUrl.startsWith('data:'));
    if (withImages.length === 0) {
      migrateList.innerHTML = '<p style="text-align:center;color:var(--color-text-light);padding:var(--space-lg)">所有图片已迁移完成 ✅</p>';
      return;
    }
    migrateList.innerHTML = withImages.map(p => {
      const sizeKB = (p.imageUrl.length * 0.75 / 1024).toFixed(1);
      const filename = 'product-' + p.id + '.jpg';
      return `
        <div class="migrate-item" data-id="${p.id}">
          <img class="migrate-item-thumb" src="${esc(p.imageUrl)}" alt="">
          <div class="migrate-item-info">
            <div class="migrate-item-name">${esc(p.name)}</div>
            <div class="migrate-item-size">约 ${sizeKB} KB → images/${filename}</div>
          </div>
          <button class="btn btn-primary btn-sm migrate-dl-btn" data-id="${p.id}" data-filename="${filename}">⬇ 下载并替换</button>
          <span class="migrate-item-status" style="display:none">已迁移 ✓</span>
        </div>`;
    }).join('');
  }

  function migrateOne(productId, filename, btn) {
    const p = FrozenData.getProductById(productId);
    if (!p || !p.imageUrl || !p.imageUrl.startsWith('data:')) return;

    // Create download
    const a = document.createElement('a');
    a.href = p.imageUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Replace URL with local path
    FrozenData.updateProduct(productId, { imageUrl: 'images/' + filename });
    if (btn) {
      const item = btn.closest('.migrate-item');
      btn.style.display = 'none';
      item.querySelector('.migrate-item-status').style.display = 'inline';
    }
    renderStats();
    renderTable();
  }

  function migrateAll() {
    const products = FrozenData.getProducts();
    const withImages = products.filter(p => p.imageUrl && p.imageUrl.startsWith('data:'));
    if (withImages.length === 0) return;

    const buttons = $$('.migrate-dl-btn', migrateList);
    let i = 0;
    function next() {
      if (i >= buttons.length) {
        showToast('全部图片已导出！请将下载的文件移动到项目的 images/ 文件夹中', 'success', 6000);
        return;
      }
      const btn = buttons[i];
      const id = btn.dataset.id;
      const filename = btn.dataset.filename;
      migrateOne(id, filename, btn);
      i++;
      setTimeout(next, 600);
    }
    next();
  }

  /* ---------- Export Data ---------- */
  function exportProductsData() {
    const products = FrozenData.getProducts();
    const jsContent = '// 产品数据 — 由管理后台导出生成\n// 如需更新，在后台修改产品后重新点击「导出数据」替换此文件\nwindow.__PRODUCTS_DATA__ = ' + JSON.stringify(products, null, 2) + ';\n';
    const blob = new Blob([jsContent], { type: 'application/javascript' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'products.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    showToast('数据已导出！请将下载的 products.js 放入项目的 data/ 文件夹，替换旧文件即可完成发布', 'success', 6000);
  }

  /* ---------- Password Modal ---------- */
  function openPwdModal() {
    pwdForm.reset();
    clearPwdErrors();
    pwdModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    pwdCurrent.focus();
  }

  function closePwdModal() {
    pwdModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function changePassword() {
    clearPwdErrors();
    let valid = true;

    const current = pwdCurrent.value;
    const stored = FrozenData.getAdminPassword() || DEFAULT_PWD;
    if (current !== stored) {
      showFieldError(pwdCurrent, '当前密码不正确');
      valid = false;
    }

    const newPwd = pwdNew.value;
    if (!newPwd || newPwd.length < 4) {
      showFieldError(pwdNew, '新密码至少4位');
      valid = false;
    }

    if (newPwd !== pwdConfirm.value) {
      showFieldError(pwdConfirm, '两次密码不一致');
      valid = false;
    }

    if (!valid) return;

    if (FrozenData.setAdminPassword(newPwd)) {
      showToast('密码修改成功', 'success', 3000);
      closePwdModal();
    } else {
      showToast('密码修改失败', 'error', 3000);
    }
  }

  function clearPwdErrors() {
    $$('#pwdForm .form-input.error').forEach(el => el.classList.remove('error'));
    $$('#pwdForm .form-error.visible').forEach(el => el.classList.remove('visible'));
  }

  /* ---------- Toast ---------- */
  function showToast(message, type, duration, actionLabel, actionFn) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type || 'success'}`;
    toast.innerHTML = `<span>${esc(message)}</span>`;
    if (actionLabel && actionFn) {
      const btn = document.createElement('span');
      btn.className = 'toast-action';
      btn.textContent = actionLabel;
      btn.addEventListener('click', () => {
        actionFn();
        removeToast(toast);
      });
      toast.appendChild(btn);
    }
    toastContainer.appendChild(toast);
    setTimeout(() => removeToast(toast), duration || 3000);
  }

  function removeToast(toast) {
    if (toast.parentNode) {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.2s';
      setTimeout(() => toast.remove(), 200);
    }
  }

  /* ---------- Password Reset ---------- */
  function resetPassword() {
    if (confirm('确定要重置密码为默认密码吗？')) {
      FrozenData.resetAdminPassword();
      showToast('密码已重置为 admin123', 'success', 3000);
      loginHint.textContent = '默认密码：admin123';
    }
  }

  /* ---------- Helpers ---------- */
  function populateSelect(select, options) {
    select.innerHTML = options.map(o =>
      `<option value="${esc(o.value)}">${o.label}</option>`
    ).join('');
  }

  function esc(str) {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  /* ---------- Event Bindings ---------- */
  function bindEvents() {
    // Login
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      doLogin(loginPassword.value);
    });
    resetPwdBtn.addEventListener('click', resetPassword);

    // Logout
    logoutBtn.addEventListener('click', doLogout);

    // Add product
    addProductBtn.addEventListener('click', () => openFormModal(null));
    if (addFirstBtn) addFirstBtn.addEventListener('click', () => openFormModal(null));

    // Search
    adminSearch.addEventListener('input', () => {
      clearTimeout(adminSearch._debounce);
      adminSearch._debounce = setTimeout(renderTable, 300);
    });

    // Category filter
    adminCatFilter.addEventListener('change', renderTable);

    // Form modal
    formModalClose.addEventListener('click', closeFormModal);
    formModal.addEventListener('click', e => {
      if (e.target === formModal) closeFormModal();
    });
    formCancelBtn.addEventListener('click', closeFormModal);
    productForm.addEventListener('submit', e => {
      e.preventDefault();
      saveProduct();
    });

    // Password modal
    changePwdBtn.addEventListener('click', openPwdModal);
    pwdModalClose.addEventListener('click', closePwdModal);
    pwdModal.addEventListener('click', e => {
      if (e.target === pwdModal) closePwdModal();
    });
    pwdForm.addEventListener('submit', e => {
      e.preventDefault();
      changePassword();
    });

    // Keyboard
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (formModal.classList.contains('active')) closeFormModal();
        else if (pwdModal.classList.contains('active')) closePwdModal();
      }
    });

    // Storage event — cross-tab sync
    window.addEventListener('storage', e => {
      if (e.key === 'frozen_goods_products') {
        FrozenData.initData();
        renderTable();
        renderStats();
      }
    });

    // Migration panel
    const migrateOpenBtn = $('#migrateOpenBtn');
    if (migrateOpenBtn) {
      migrateOpenBtn.addEventListener('click', openMigratePanel);
    }
    migrateCloseBtn.addEventListener('click', closeMigratePanel);
    migrateAllBtn.addEventListener('click', migrateAll);
    migrateList.addEventListener('click', e => {
      const btn = e.target.closest('.migrate-dl-btn');
      if (!btn) return;
      migrateOne(btn.dataset.id, btn.dataset.filename, btn);
    });

    // Export data
    exportDataBtn.addEventListener('click', exportProductsData);
  }

  /* ---------- Start ---------- */
  init();
})();
