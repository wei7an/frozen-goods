/* ========================================
   data.js — Shared Data Layer
   localStorage CRUD, mock seed data,
   category definitions, filtering/search
   ======================================== */

const STORAGE_KEY = 'frozen_goods_products';
const PWD_KEY = 'frozen_goods_admin_pwd';

const CATEGORIES = [
  { id: 'frozen-food',   name: '速冻食品',   icon: '🥟', color: '#43A047' },
  { id: 'hotpot',        name: '火锅食材',   icon: '🍲', color: '#D81B60' },
];

const CATEGORY_MAP = {};
CATEGORIES.forEach(c => { CATEGORY_MAP[c.id] = c; });

const UNITS = ['斤', '袋', '箱', '盒', '条', '只'];
const STOCK_OPTIONS = [
  { value: 'in-stock',     label: '充足' },
  { value: 'low-stock',    label: '紧张' },
  { value: 'out-of-stock', label: '缺货' },
];
const STOCK_MAP = {};
STOCK_OPTIONS.forEach(s => { STOCK_MAP[s.value] = s.label; });

/* ---------- Mock Seed Data (20 products × 5 categories) ---------- */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

const DEFAULT_PRODUCTS = [
  // 速冻食品
  { id: 'mock-frozen-01', name: '速冻水饺（猪肉白菜）', category: 'frozen-food', unit: '袋', specs: '1kg/袋', description: '传统手工包制，皮薄馅大，猪肉白菜经典口味。水煮、煎饺、蒸饺均可。',                 imageUrl: '', stock: 'in-stock',     featured: true,  createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'mock-frozen-02', name: '速冻汤圆（黑芝麻）',   category: 'frozen-food', unit: '袋', specs: '500g/袋', description: '传统黑芝麻馅汤圆，软糯香甜。适合节日食用、早餐、甜品。',                         imageUrl: '', stock: 'in-stock',     featured: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'mock-frozen-03', name: '速冻包子（鲜肉馅）',   category: 'frozen-food', unit: '袋', specs: '600g/袋', description: '发酵面皮松软可口，鲜肉馅料饱满多汁。蒸制8-10分钟即可食用。',                   imageUrl: '', stock: 'in-stock',     featured: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'mock-frozen-04', name: '速冻馄饨（鲜虾馅）',   category: 'frozen-food', unit: '袋', specs: '500g/袋', description: '薄皮大馅，每个含完整虾仁。煮汤、红油、干拌均可。',                             imageUrl: '', stock: 'low-stock',    featured: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'mock-frozen-05', name: '速冻馒头（奶香）',     category: 'frozen-food', unit: '袋', specs: '800g/袋', description: '奶香松软馒头，蒸制5分钟即可。早餐、主食首选。',                                     imageUrl: '', stock: 'in-stock',     featured: true,  createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'mock-frozen-06', name: '速冻烧麦（糯米猪肉）', category: 'frozen-food', unit: '袋', specs: '600g/袋', description: '糯米猪肉烧麦，皮薄馅香。蒸制8分钟即可。早茶点心、快餐必备。',                     imageUrl: '', stock: 'in-stock',     featured: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'mock-frozen-07', name: '速冻春卷（蔬菜馅）',   category: 'frozen-food', unit: '袋', specs: '500g/袋', description: '酥脆蔬菜春卷，馅料丰富。油炸3-5分钟即可。适合快餐、小吃。',                       imageUrl: '', stock: 'low-stock',    featured: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'mock-frozen-08', name: '速冻葱油饼',           category: 'frozen-food', unit: '袋', specs: '500g/袋', description: '层层酥脆葱油饼，无需解冻直接煎制。早餐、夜宵首选。',                               imageUrl: '', stock: 'in-stock',     featured: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  // 火锅食材
  { id: 'mock-hp-01', name: '火锅肥牛卷',     category: 'hotpot', unit: '盒', specs: '500g/盒',    description: '精选肥牛刨片，肥瘦相间，涮3-5秒即可。入口即化，火锅必备。',                             imageUrl: '', stock: 'in-stock',     featured: true,  createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'mock-hp-02', name: '火锅羊肉卷',     category: 'hotpot', unit: '盒', specs: '500g/盒',    description: '内蒙古羔羊肉刨片，肉质鲜嫩无膻味。涮火锅、做葱爆羊肉皆可。',                           imageUrl: '', stock: 'in-stock',     featured: true,  createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'mock-hp-03', name: '火锅丸子组合装', category: 'hotpot', unit: '袋', specs: '1kg/袋',     description: '含牛肉丸、鱼丸、虾丸、墨鱼丸四款经典丸子。Q弹有嚼劲，火锅、关东煮必备。',           imageUrl: '', stock: 'in-stock',     featured: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'mock-hp-04', name: '火锅毛肚',       category: 'hotpot', unit: '斤', specs: '500g/袋',    description: '新鲜毛肚，口感脆爽。七上八下涮法，蘸香油碟一绝。',                                     imageUrl: '', stock: 'low-stock',    featured: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'mock-hp-05', name: '火锅鸭肠',       category: 'hotpot', unit: '袋', specs: '500g/袋',    description: '新鲜鸭肠，脆嫩爽口。涮10-15秒即可，蘸干碟更香。',                                       imageUrl: '', stock: 'in-stock',     featured: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'mock-hp-06', name: '火锅黄喉',       category: 'hotpot', unit: '袋', specs: '300g/袋',    description: '猪黄喉，口感脆嫩。适合红油火锅，久煮不烂。',                                             imageUrl: '', stock: 'low-stock',    featured: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'mock-hp-07', name: '火锅虾滑',       category: 'hotpot', unit: '袋', specs: '500g/袋',    description: '虾肉含量≥90%，Q弹爽滑。适合火锅、煮汤。',                                               imageUrl: '', stock: 'in-stock',     featured: true,  createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'mock-hp-08', name: '火锅午餐肉',     category: 'hotpot', unit: '盒', specs: '340g/盒',    description: '经典午餐肉，切片即涮。火锅、煎制、炒饭多用途。',                                         imageUrl: '', stock: 'in-stock',     featured: false, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
];

/* ---------- Storage Helpers ---------- */
let inMemoryStore = null;

function storageAvailable() {
  try {
    const key = '__storage_test__';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    return false;
  }
}

function readProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) { /* fall through */ }
  return null;
}

function writeProducts(products) {
  inMemoryStore = products;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    return true;
  } catch (e) {
    return false;
  }
}

/* ---------- Public API ---------- */
window.FrozenData = {

  initData() {
    const existing = readProducts();
    if (existing) {
      inMemoryStore = existing;
    } else if (window.__PRODUCTS_DATA__ && window.__PRODUCTS_DATA__.length > 0) {
      // Load from static data file (deployed site)
      inMemoryStore = [...window.__PRODUCTS_DATA__];
      writeProducts(inMemoryStore);
    } else {
      // Fallback to built-in mock data
      inMemoryStore = [...DEFAULT_PRODUCTS];
      writeProducts(inMemoryStore);
    }
  },

  getProducts() {
    if (!inMemoryStore) this.initData();
    return [...inMemoryStore];
  },

  getProductById(id) {
    if (!inMemoryStore) this.initData();
    return inMemoryStore.find(p => p.id === id) || null;
  },

  saveProducts(products) {
    return writeProducts(products);
  },

  addProduct(data) {
    if (!inMemoryStore) this.initData();
    const now = new Date().toISOString().split('T')[0];
    const product = {
      id: generateId(),
      name: data.name || '',
      category: data.category || 'frozen-food',
      unit: data.unit || '袋',
      specs: data.specs || '',
      description: data.description || '',
      imageUrl: data.imageUrl || '',
      stock: data.stock || 'in-stock',
      featured: !!data.featured,
      createdAt: now,
      updatedAt: now,
    };
    inMemoryStore.unshift(product);
    if (!writeProducts(inMemoryStore)) {
      // Rollback on write failure
      inMemoryStore = inMemoryStore.filter(p => p.id !== product.id);
      return null;
    }
    return product;
  },

  updateProduct(id, data) {
    if (!inMemoryStore) this.initData();
    const idx = inMemoryStore.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString().split('T')[0];
    const previous = { ...inMemoryStore[idx] };
    inMemoryStore[idx] = {
      ...inMemoryStore[idx],
      ...data,
      id: inMemoryStore[idx].id,
      updatedAt: now,
    };
    if (!writeProducts(inMemoryStore)) {
      // Rollback on write failure
      inMemoryStore[idx] = previous;
      return null;
    }
    return inMemoryStore[idx];
  },

  deleteProduct(id) {
    if (!inMemoryStore) this.initData();
    const product = inMemoryStore.find(p => p.id === id);
    if (!product) return false;
    inMemoryStore = inMemoryStore.filter(p => p.id !== id);
    if (!writeProducts(inMemoryStore)) {
      return false;
    }
    return product;
  },

  getStorageUsage() {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        total += localStorage.getItem(key).length * 2; // UTF-16
      }
      return total;
    } catch (e) { return -1; }
  },

  filterProducts({ category, search, stock } = {}) {
    if (!inMemoryStore) this.initData();
    let result = [...inMemoryStore];

    if (category && category !== 'all') {
      result = result.filter(p => p.category === category);
    }
    if (stock) {
      result = result.filter(p => p.stock === stock);
    }
    if (search && search.trim()) {
      const kw = search.trim().toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(kw) ||
        p.description.toLowerCase().includes(kw)
      );
    }
    return result;
  },

  getCategories() {
    return CATEGORIES;
  },

  getCategoryById(id) {
    return CATEGORY_MAP[id] || null;
  },

  getStockLabel(value) {
    return STOCK_MAP[value] || value;
  },

  getUnits() {
    return UNITS;
  },

  getStockOptions() {
    return STOCK_OPTIONS;
  },

  getStats() {
    if (!inMemoryStore) this.initData();
    const stats = { total: inMemoryStore.length, byCategory: {}, inStock: 0, lowStock: 0, outOfStock: 0 };
    CATEGORIES.forEach(c => { stats.byCategory[c.id] = 0; });
    inMemoryStore.forEach(p => {
      if (stats.byCategory[p.category] !== undefined) stats.byCategory[p.category]++;
      if (p.stock === 'in-stock') stats.inStock++;
      else if (p.stock === 'low-stock') stats.lowStock++;
      else if (p.stock === 'out-of-stock') stats.outOfStock++;
    });
    return stats;
  },

  isStorageAvailable() {
    return storageAvailable();
  },

  /* ---------- Admin Password ---------- */
  getAdminPassword() {
    try {
      return localStorage.getItem(PWD_KEY) || null;
    } catch (e) { return null; }
  },

  setAdminPassword(password) {
    try {
      localStorage.setItem(PWD_KEY, password);
      return true;
    } catch (e) { return false; }
  },

  resetAdminPassword() {
    try {
      localStorage.removeItem(PWD_KEY);
      return true;
    } catch (e) { return false; }
  },
};
