/* ============================================================
   ROYAL HOTEL — Digital Menu & Table Ordering System
   ------------------------------------------------------------
   Data layer: Firebase Realtime Database (primary) with
   localStorage as an automatic fallback + offline cache.
   Configure Firebase in firebase-config.js
   ============================================================ */

// ---------- Global state ----------
let menuItems = [];
let categories = [];
let cart = [];
let orders = [];
let currentUser = null;
let settings = {};
let tables = [];
let currentQRTable = null;

// ---------- Firebase init ----------
let database = null;
let dbRef = null;
let firebaseEnabled = false;

(function initFirebase() {
    if (typeof isFirebaseConfigured === 'function' && isFirebaseConfigured()) {
        try {
            if (typeof firebase === 'undefined') throw new Error('Firebase SDK not loaded');
            firebase.initializeApp(FIREBASE_CONFIG);
            database = firebase.database();
            dbRef = database.ref((typeof FIREBASE_DB_PATH !== 'undefined' && FIREBASE_DB_PATH) || 'hotel-menu');
            firebaseEnabled = true;
            console.log('✅ Firebase Realtime Database connected');
        } catch (err) {
            firebaseEnabled = false;
            console.warn('⚠️  Firebase init failed — falling back to localStorage.', err);
        }
    } else {
        console.warn('⚠️  Firebase not configured — running in localStorage mode. Edit firebase-config.js to enable the cloud database.');
    }
})();

// ---------- Storage keys ----------
const LS_KEYS = {
    items: 'hotelMenuItems',
    categories: 'hotelMenuCategories',
    cart: 'hotelMenuCart',
    orders: 'hotelMenuOrders',
    settings: 'hotelMenuSettings',
    tables: 'hotelMenuTables',
    admin: 'hotelMenuAdmin',
    customerName: 'hotelCustomerName'
};

// ---------- Data helpers ----------
function snapshotToArray(snapshot) {
    const val = snapshot && snapshot.val();
    if (!val) return [];
    return Object.keys(val).map(key => {
        const entry = val[key];
        return (entry && typeof entry === 'object') ? entry : { id: key, value: entry };
    });
}

// Compare two collections by their `id` field (order-independent)
function sameCollection(a, b) {
    if (a.length !== b.length) return false;
    const mapB = new Map(b.map(x => [String(x.id), x]));
    return a.every(x => {
        const y = mapB.get(String(x.id));
        return y && JSON.stringify(x) === JSON.stringify(y);
    });
}
// ---------- Persistence layer (Firebase + localStorage) ----------
function persistCollection(refName, collection, lsKey) {
    localStorage.setItem(lsKey, JSON.stringify(collection));
    if (firebaseEnabled && dbRef) {
        dbRef.child(refName).set(collection).catch(err => {
            console.error(`Error writing "${refName}" to Firebase:`, err);
            showToast('⚠️  Could not save to Firebase — check your connection', 'error');
        });
    }
}

function saveMenuItems()   { persistCollection('items', menuItems, LS_KEYS.items); }
function saveCategories()  { persistCollection('categories', categories, LS_KEYS.categories); }
function saveOrders()      { persistCollection('orders', orders, LS_KEYS.orders); }
function persistTables()   { persistCollection('tables', tables, LS_KEYS.tables); }
function persistSettings() { persistCollection('settings', settings, LS_KEYS.settings); }

function saveCart() {
    localStorage.setItem(LS_KEYS.cart, JSON.stringify(cart));
}

// ---------- Default seed data (used on first run) ----------
function getDefaultItems() {
    const now = new Date().toISOString();
    return [
        { id: 1, name: 'Grilled Salmon', description: 'Fresh Atlantic salmon with lemon butter sauce', price: 24.99, category: 'Main Course', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80', prepTime: 20, isSpecial: true, isAvailable: true, createdAt: now },
        { id: 2, name: 'Caesar Salad', description: 'Crisp romaine lettuce with Caesar dressing and croutons', price: 12.99, category: 'Appetizer', image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80', prepTime: 10, isSpecial: false, isAvailable: true, createdAt: now },
        { id: 3, name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with molten center', price: 8.99, category: 'Dessert', image: 'https://images.unsplash.com/photo-1624353365286-3f8d62dadadf?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80', prepTime: 15, isSpecial: true, isAvailable: true, createdAt: now },
        { id: 4, name: 'Beef Burger', description: 'Juicy beef patty with fresh vegetables', price: 16.99, category: 'Main Course', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80', prepTime: 15, isSpecial: false, isAvailable: true, createdAt: now },
        { id: 5, name: 'Margarita Pizza', description: 'Classic pizza with tomato sauce and mozzarella', price: 18.99, category: 'Main Course', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80', prepTime: 25, isSpecial: false, isAvailable: true, createdAt: now }
    ];
}

function getDefaultCategories() {
    return [
        { id: 1, name: 'Appetizer', description: 'Starters and small bites', icon: 'fas fa-seedling' },
        { id: 2, name: 'Main Course', description: 'Main dishes and entrees', icon: 'fas fa-utensils' },
        { id: 3, name: 'Dessert', description: 'Sweet treats and desserts', icon: 'fas fa-ice-cream' },
        { id: 4, name: 'Beverages', description: 'Drinks and beverages', icon: 'fas fa-glass-cheers' },
        { id: 5, name: 'Specials', description: "Today's special offers", icon: 'fas fa-fire' }
    ];
}

function getDefaultTables() {
    return [
        { id: 1, number: 'Table 1', capacity: 4, location: 'Indoor', notes: '' },
        { id: 2, number: 'Table 2', capacity: 4, location: 'Indoor', notes: '' },
        { id: 3, number: 'Table 3', capacity: 2, location: 'Patio', notes: 'Near window' },
        { id: 4, number: 'Table 4', capacity: 6, location: 'VIP', notes: 'Family size' }
    ];
}

function getDefaultSettings() {
    return { hotelName: 'Royal Hotel', currency: '$', taxRate: 10 };
}
// ---------- Data loading (Firebase first, then localStorage, then seed) ----------
async function getCollection(refName, lsKey, defaultsFactory) {
    let result = null;

    if (firebaseEnabled && dbRef) {
        try {
            const snap = await dbRef.child(refName).once('value');
            const arr = snapshotToArray(snap);
            if (arr.length) result = arr;
        } catch (err) {
            console.warn(`Firebase read "${refName}" failed:`, err);
        }
    }

    if (!result) {
        const saved = localStorage.getItem(lsKey);
        if (saved) {
            try { result = JSON.parse(saved); } catch (e) { result = null; }
        }
    }

    if (!result) {
        result = defaultsFactory();
        // Persist so the database receives the seed data on first run
        const localWrite = { refName, collection: result, lsKey };
        persistCollection(localWrite.refName, localWrite.collection, localWrite.lsKey);
    }

    return result;
}

async function getSettingsFromStore() {
    let result = null;

    if (firebaseEnabled && dbRef) {
        try {
            const snap = await dbRef.child('settings').once('value');
            const val = snap.val();
            if (val && Object.keys(val).length) result = val;
        } catch (err) {
            console.warn('Firebase read "settings" failed:', err);
        }
    }

    if (!result) {
        const saved = localStorage.getItem(LS_KEYS.settings);
        if (saved) {
            try { result = JSON.parse(saved); } catch (e) { result = null; }
        }
    }

    if (!result) result = getDefaultSettings();
    return result;
}

async function loadData() {
    console.log('Loading data…');

    const [items, cats, tbls, ords, stts] = await Promise.all([
        getCollection('items', LS_KEYS.items, getDefaultItems),
        getCollection('categories', LS_KEYS.categories, getDefaultCategories),
        getCollection('tables', LS_KEYS.tables, getDefaultTables),
        getCollection('orders', LS_KEYS.orders, () => []),
        getSettingsFromStore()
    ]);

    menuItems = items;
    categories = cats;
    tables = tbls;
    orders = ords;
    settings = stts;

    // Seed settings into the store so the database has a copy on first run
    persistSettings();

    // Customer cart (per device — stored only in localStorage)
    const savedCart = localStorage.getItem(LS_KEYS.cart);
    if (savedCart) {
        try { cart = JSON.parse(savedCart); } catch (e) { cart = []; }
    }

    // Remember admin session
    const savedUser = localStorage.getItem(LS_KEYS.admin);
    if (savedUser) {
        try { currentUser = JSON.parse(savedUser); } catch (e) { currentUser = null; }
    }

    updateCartCount();
    console.log('✅ Data ready:', { menuItems, categories, tables, orders: orders.length });
}

// ---------- App boot ----------
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 DOM ready');
    try {
        await loadData();
    } catch (err) {
        console.error('Error loading data:', err);
        showToast('Error loading data — refresh the page', 'error');
    }
    initializeApp();
    listenForChanges();
});
// ---------- Realtime sync (cross-tab / cross-device) ----------
function listenForChanges() {
    if (!firebaseEnabled || !dbRef) {
        // localStorage mode: keep two tabs in sync via the storage event
        window.addEventListener('storage', handleLocalStorageSync);
        return;
    }

    dbRef.child('items').on('value', snap => {
        const next = snapshotToArray(snap);
        if (!sameCollection(next, menuItems)) {
            menuItems = next;
            refreshCustomerMenu();
            if (document.getElementById('menuItemsTable')) { renderMenuItemsTable(); updateAdminStats(); }
        }
    });

    dbRef.child('categories').on('value', snap => {
        const next = snapshotToArray(snap);
        if (!sameCollection(next, categories)) {
            categories = next;
            refreshCustomerCategories();
            if (document.getElementById('adminCategoriesGrid')) { renderAdminCategories(); updateAdminStats(); }
        }
    });

    dbRef.child('tables').on('value', snap => {
        const next = snapshotToArray(snap);
        if (!sameCollection(next, tables)) {
            tables = next;
            if (document.getElementById('tablesGrid')) renderTablesGrid();
            if (document.getElementById('totalTables')) updateAdminStats();
        }
    });

    dbRef.child('settings').on('value', snap => {
        const next = snap.val() || {};
        if (JSON.stringify(next) !== JSON.stringify(settings)) {
            settings = next;
            refreshCustomerMenu();
            if (document.getElementById('hotelName')) loadSettings();
        }
    });

    dbRef.child('orders').on('value', snap => {
        const next = snapshotToArray(snap);
        if (sameCollection(next, orders)) return;
        applyOrdersUpdate(next, orders);
    });
}

function applyOrdersUpdate(next, prevOrders) {
    const prevById = new Map((prevOrders || []).map(o => [String(o.id), o]));
    orders = next;

    if (document.getElementById('trackingOrders')) {
        renderOrderTracking();
        next.forEach(o => {
            const prev = prevById.get(String(o.id));
            if (prev && prev.status !== o.status) {
                showOrderStatusNotification(o, prev.status, o.status);
            }
        });
    }

    if (document.getElementById('ordersList')) {
        renderOrdersList();
        updateAdminStats();
    }

    if (document.getElementById('tablesGrid')) {
        renderTablesGrid(); // table cards show active order counts
    }
}
function handleLocalStorageSync(e) {
    if (!e || !e.key) return;
    try {
        switch (e.key) {
            case LS_KEYS.orders: {
                const next = JSON.parse(e.newValue || '[]');
                if (!sameCollection(next, orders)) applyOrdersUpdate(next, orders);
                break;
            }
            case LS_KEYS.items: {
                const next = JSON.parse(e.newValue || '[]');
                if (!sameCollection(next, menuItems)) {
                    menuItems = next;
                    refreshCustomerMenu();
                    if (document.getElementById('menuItemsTable')) { renderMenuItemsTable(); updateAdminStats(); }
                }
                break;
            }
            case LS_KEYS.categories: {
                const next = JSON.parse(e.newValue || '[]');
                if (!sameCollection(next, categories)) {
                    categories = next;
                    refreshCustomerCategories();
                    if (document.getElementById('adminCategoriesGrid')) { renderAdminCategories(); updateAdminStats(); }
                }
                break;
            }
            case LS_KEYS.tables: {
                const next = JSON.parse(e.newValue || '[]');
                if (!sameCollection(next, tables)) {
                    tables = next;
                    if (document.getElementById('tablesGrid')) renderTablesGrid();
                    if (document.getElementById('totalTables')) updateAdminStats();
                }
                break;
            }
        }
    } catch (err) {
        console.warn('Cross-tab sync error:', err);
    }
}

// Refresh the customer-facing parts of the UI
function refreshCustomerMenu() {
    if (document.getElementById('menuGrid')) {
        renderMenuItems();
        renderSpecials();
    }
}

function refreshCustomerCategories() {
    if (document.getElementById('categoryFilter')) {
        renderCategories();
        renderMenuItems();
    }
}

// ---------- Order status notifications (customer page) ----------
function showOrderStatusNotification(order, oldStatus, newStatus) {
    if (!document.getElementById('trackingOrders')) return;

    const messages = {
        preparing: `👨‍🍳 Your order #${String(order.id).slice(-6)} is being prepared!`,
        ready: `🔔 Your order is ready! Please collect it at the counter.`,
        completed: `✅ Your order has been completed. Enjoy!`,
        cancelled: `❌ Your order #${String(order.id).slice(-6)} was cancelled.`
    };
    const msg = messages[newStatus] || '';
    if (!msg) return;

    showToast(msg, newStatus === 'cancelled' ? 'error' : 'success');
    if (newStatus === 'ready') playNotificationSound();
    flashTitle(msg);
}

function playNotificationSound() {
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.volume = 0.3;
        audio.play().catch(() => {});
    } catch (e) { /* silent fail */ }
}

function flashTitle(message) {
    const originalTitle = document.title;
    let count = 0;
    const interval = setInterval(() => {
        document.title = count % 2 === 0 ? '🔔 ' + message : originalTitle;
        count++;
        if (count > 6) clearInterval(interval);
    }, 800);
}
// ============================================================
//  UTILITIES
// ============================================================
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    setTimeout(() => { toast.className = 'toast'; }, 3200);
}

function togglePassword(inputId, icon) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function escapeHTML(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getDefaultImage() {
    return 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) return '';
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ============================================================
//  APP INITIALIZATION
// ============================================================
function initializeApp() {
    console.log('Initializing app…');
    if (window.location.pathname.includes('admin.html')) {
        initializeAdminPage();
    } else {
        initializeCustomerPage();
    }
}

// ============================================================
//  CUSTOMER PAGE
// ============================================================
function initializeCustomerPage() {
    console.log('Customer page initialized');
    renderMenuItems();
    renderCategories();
    renderSpecials();
    renderOrderTracking();
    updateCartCount();
    setupEventListeners();

    const urlTable = getTableFromURL();
    if (urlTable) showTableBanner(urlTable);
}

function setupEventListeners() {
    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.querySelector('.nav-links')?.classList.toggle('open');
        });
    }
}

// ---------- Menu rendering ----------
function renderMenuItems() {
    const menuGrid = document.getElementById('menuGrid');
    if (!menuGrid) return;

    const sortByEl = document.getElementById('sortBy');
    const categoryEl = document.getElementById('categorySelect');
    const searchEl = document.getElementById('searchInput');

    const sortBy = sortByEl ? sortByEl.value : 'name';
    const categoryFilter = categoryEl ? categoryEl.value : 'all';
    const searchTerm = searchEl ? searchEl.value.toLowerCase().trim() : '';

    // Show only available items
    let filteredItems = menuItems.filter(item => item.isAvailable !== false);

    if (categoryFilter && categoryFilter !== 'all') {
        filteredItems = filteredItems.filter(item => item.category === categoryFilter);
    }

    if (searchTerm) {
        filteredItems = filteredItems.filter(item =>
            (item.name || '').toLowerCase().includes(searchTerm) ||
            (item.description || '').toLowerCase().includes(searchTerm) ||
            (item.category || '').toLowerCase().includes(searchTerm)
        );
    }

    switch (sortBy) {
        case 'price-low':  filteredItems.sort((a, b) => a.price - b.price); break;
        case 'price-high': filteredItems.sort((a, b) => b.price - a.price); break;
        case 'newest':     filteredItems.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)); break;
        default:           filteredItems.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
if (filteredItems.length === 0) {
        menuGrid.innerHTML = `
            <div class="no-items" style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#666;">
                <i class="fas fa-utensils" style="font-size:48px;color:#ccc;display:block;margin-bottom:15px;"></i>
                <p>${menuItems.length === 0 ? 'No menu items available yet.' : 'No items match your filters.'}</p>
            </div>`;
        return;
    }

    const currency = (settings && settings.currency) || '$';

    menuGrid.innerHTML = filteredItems.map(item => `
        <div class="menu-item ${item.isSpecial ? 'special' : ''}">
            <div class="item-image">
                <img src="${item.image || getDefaultImage()}"
                     alt="${escapeHTML(item.name)}"
                     onerror="this.src='${getDefaultImage()}'">
            </div>
            <div class="item-info">
                <div class="item-header">
                    <h3>${escapeHTML(item.name)}</h3>
                    <div class="item-price">${currency}${item.price.toFixed(2)}</div>
                </div>
                <p class="item-description">${escapeHTML(item.description || '')}</p>
                <div class="item-footer">
                    <span class="item-category">${escapeHTML(item.category || 'Other')}</span>
                    <div class="item-actions">
                        <button class="btn-cart" onclick="addToCart(${item.id})">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                ${item.prepTime ? `<div class="prep-time"><i class="fas fa-clock"></i> ${item.prepTime} min</div>` : ''}
            </div>
        </div>
    `).join('');
}

function filterMenu() { renderMenuItems(); }

function filterByCategory(category) {
    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
    const categorySelect = document.getElementById('categorySelect');
    if (categorySelect) categorySelect.value = 'all';
    renderMenuItems();
}

function renderCategories() {
    const categoryFilter = document.getElementById('categoryFilter');
    const categorySelect = document.getElementById('categorySelect');

    if (categoryFilter) {
        categoryFilter.innerHTML = `
            <button class="category-btn active" data-category="all" onclick="filterByCategory('all')">
                <i class="fas fa-utensils"></i> All
            </button>
            ${categories.map(cat => `
                <button class="category-btn" data-category="${escapeHTML(cat.name)}" onclick="filterByCategory('${escapeHTML(cat.name)}')">
                    <i class="${cat.icon}"></i> ${escapeHTML(cat.name)}
                </button>
            `).join('')}
        `;
    }

    if (categorySelect) {
        categorySelect.innerHTML = `
            <option value="all">All Categories</option>
            ${categories.map(cat => `<option value="${escapeHTML(cat.name)}">${escapeHTML(cat.name)}</option>`).join('')}
        `;
    }
}
confirmCheckout 
function renderSpecials() {
    const specialsGrid = document.getElementById('specialsGrid');
    if (!specialsGrid) return;

    const specialItems = menuItems.filter(item =>
        (item.isSpecial === true || item.isSpecial === 'true') && item.isAvailable !== false
    );

    if (specialItems.length === 0) {
        specialsGrid.innerHTML = `
            <p class="no-specials" style="grid-column:1/-1;text-align:center;color:rgba(255,255,255,0.7);padding:40px;">
                <i class="fas fa-star" style="font-size:32px;display:block;margin-bottom:10px;opacity:0.5;"></i>
                No specials available today. Check back soon!
            </p>`;
        return;
    }

    const currency = (settings && settings.currency) || '$';

    specialsGrid.innerHTML = specialItems.map(item => `
        <div class="special-card">
            <i class="fas fa-star"></i>
            <h3>${escapeHTML(item.name)}</h3>
            <p>${escapeHTML(item.description || '')}</p>
            <div class="special-price">${currency}${item.price.toFixed(2)}</div>
            <button class="btn-cart-small" onclick="addToCart(${item.id})">
                <i class="fas fa-plus"></i> Add to Cart
            </button>
        </div>
    `).join('');
}
// ============================================================
//  CART
// ============================================================
function addToCart(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) { showToast('Item not found', 'error'); return; }
    if (item.isAvailable === false) { showToast('This item is currently unavailable', 'error'); return; }

    const existingItem = cart.find(i => i.id === itemId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...item, quantity: 1 });
    }

    saveCart();
    updateCartCount();
    showToast(`${item.name} added to cart!`, 'success');

    if (document.querySelector('.cart-sidebar.open')) renderCartItems();
}

function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    }
}

function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    if (!cartSidebar) return;
    cartSidebar.classList.toggle('open');
    if (cartSidebar.classList.contains('open')) renderCartItems();
}

function closeCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    if (cartSidebar) cartSidebar.classList.remove('open');
}

function renderCartItems() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    if (!cartItems || !cartTotal) return;

    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
        cartTotal.textContent = '0.00';
        return;
    }

    const currency = (settings && settings.currency) || '$';
    const fallbackImg = getDefaultImage();

    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                <img src="${item.image || fallbackImg}" alt="${escapeHTML(item.name)}" onerror="this.src='${fallbackImg}'">
            </div>
            <div class="cart-item-info">
                <h4>${escapeHTML(item.name)}</h4>
                <div class="cart-item-price">${currency}${item.price.toFixed(2)}</div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, -1)">−</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, 1)">+</button>
                </div>
            </div>
            <div class="cart-item-actions">
                <button class="remove-item" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = total.toFixed(2);
}
// ============================================================
//  CHECKOUT
// ============================================================
function checkout() {
    if (cart.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
    }

    const modal = document.getElementById('checkoutModal');
    if (!modal) { confirmCheckout(); return; }

    // Order summary
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const currency = (settings && settings.currency) || '$';
    const summary = document.getElementById('checkoutSummary');
    if (summary) {
        summary.innerHTML = `
            <div style="background:#f8f9fa;padding:15px;border-radius:10px;margin-top:15px;">
                <strong>Order Summary (${cart.length} items)</strong>
                ${cart.map(i => `
                    <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:14px;">
                        <span>${escapeHTML(i.name)} × ${i.quantity}</span>
                        <span>${currency}${(i.price * i.quantity).toFixed(2)}</span>
                    </div>`).join('')}
                <div style="display:flex;justify-content:space-between;margin-top:12px;padding-top:12px;border-top:2px solid #ddd;font-size:16px;">
                    <strong>Total:</strong>
                    <strong style="color:#3498db;">${currency}${total.toFixed(2)}</strong>
                </div>
            </div>`;
    }

    prefillTableFromQR();

    const savedName = localStorage.getItem(LS_KEYS.customerName);
    const nameInput = document.getElementById('customerName');
    if (savedName && nameInput) nameInput.value = savedName;

    modal.classList.add('show');
}

function prefillTableFromQR() {
    const tableInput = document.getElementById('tableNumber');
    if (!tableInput) return;

    const urlTable = getTableFromURL();
    if (urlTable) {
        tableInput.value = urlTable;
        tableInput.setAttribute('readonly', true);
        tableInput.style.background = '#e8f5e9';
        tableInput.style.cursor = 'not-allowed';

        const existingBadge = document.getElementById('tableBadge');
        if (existingBadge) existingBadge.remove();

        const badge = document.createElement('div');
        badge.id = 'tableBadge';
        badge.style.cssText = 'background:#d4edda;color:#155724;padding:8px 12px;border-radius:8px;font-size:13px;margin-bottom:10px;display:flex;align-items:center;gap:8px;';
        badge.innerHTML = `<i class="fas fa-qrcode"></i> Table auto-detected from QR: <strong>${escapeHTML(urlTable)}</strong>`;
        tableInput.parentElement.insertBefore(badge, tableInput);

        showToast(`Welcome! You're ordering from ${urlTable}`, 'info');
    } else {
        tableInput.removeAttribute('readonly');
        tableInput.style.background = '';
        tableInput.style.cursor = '';
    }
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) modal.classList.remove('show');
}

function confirmCheckout() {
    const tableNumber = document.getElementById('tableNumber').value.trim();
    const customerName = document.getElementById('customerName').value.trim();
    const orderNotes = document.getElementById('orderNotes').value.trim();

    if (!tableNumber) {
        showToast('Please enter your table/sit number', 'error');
        return;
    }

    if (customerName) localStorage.setItem(LS_KEYS.customerName, customerName);

    const order = {
        id: Date.now(),
        tableNumber: tableNumber,
        customerName: customerName || 'Guest',
        notes: orderNotes,
        items: cart.map(item => ({
            id: item.id, name: item.name, price: item.price, quantity: item.quantity
        })),
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    orders.push(order);
    saveOrders();

    // Remember which orders this device placed (customer-side tracking)
    const MY_ORDERS_KEY = 'hotelMenuMyOrders';
    const mine = JSON.parse(localStorage.getItem(MY_ORDERS_KEY) || '[]');
    if (!mine.includes(order.id)) mine.push(order.id);
    localStorage.setItem(MY_ORDERS_KEY, JSON.stringify(mine));

    // Clear the cart
    cart = [];
    saveCart();
    updateCartCount();
    closeCart();
    closeCheckoutModal();

    document.getElementById('tableNumber').value = '';
    document.getElementById('orderNotes').value = '';

    showToast(`Order placed! Table ${tableNumber}. We'll notify you when it's ready.`, 'success');

    renderOrderTracking();
    setTimeout(() => {
        document.getElementById('orderTracking')?.scrollIntoView({ behavior: 'smooth' });
    }, 500);
}
function updateCartQuantity(itemId, change) {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;
    item.quantity += change;
    if (item.quantity <= 0) {
        removeFromCart(itemId);
    } else {
        saveCart();
        updateCartCount();
        renderCartItems();
    }
}

function removeFromCart(itemId) {
    const index = cart.findIndex(i => i.id === itemId);
    if (index !== -1) {
        cart.splice(index, 1);
        saveCart();
        updateCartCount();
        renderCartItems();
        showToast('Item removed from cart', 'info');
    }
}
// ============================================================
//  CUSTOMER ORDER TRACKING
// ============================================================
function renderOrderTracking() {
    const container = document.getElementById('trackingOrders');
    if (!container) return;

   
    const urlTable = getTableFromURL();

// Show only orders belonging to the table
    const myOrders = urlTable
    ? orders.filter(o =>
        String(o.tableNumber).trim().toLowerCase() ===
        String(urlTable).trim().toLowerCase()
      )
    : [];
    const sortedOrders = [...myOrders]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 10);

    if (sortedOrders.length === 0) {
        container.innerHTML = `
            <div class="no-orders-message">
                <i class="fas fa-receipt" style="font-size:48px;color:#ccc;display:block;margin-bottom:15px;"></i>
                <p>You haven't placed any orders yet.</p>
                <p style="font-size:14px;color:#999;">Add items to your cart and checkout to see them here.</p>
            </div>`;
        return;
    }

    const currency = (settings && settings.currency) || '$';

    container.innerHTML = sortedOrders.map(order => `
        <div class="tracking-card" data-status="${order.status}">
            <div class="tracking-header">
                <div>
                    <h4><i class="fas fa-receipt"></i> Order #${String(order.id).slice(-6)}</h4>
                    <span class="tracking-meta">
                        <i class="fas fa-chair"></i> ${escapeHTML(order.tableNumber || 'N/A')}
                        ${order.customerName ? ` • <i class="fas fa-user"></i> ${escapeHTML(order.customerName)}` : ''}
                    </span>
                </div>
                <span class="tracking-status status-${order.status}">
                    ${getStatusLabel(order.status)}
                </span>
            </div>

            <div class="tracking-progress">
                ${renderProgressBar(order.status)}
            </div>

            <div class="tracking-items">
                ${(order.items || []).map(item => `
                    <div class="tracking-item-row">
                        <span>${escapeHTML(item.name)} × ${item.quantity}</span>
                        <span>${currency}${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `).join('')}
                <div class="tracking-total">
                    <strong>Total:</strong>
                    <strong>${currency}${Number(order.total).toFixed(2)}</strong>
                </div>
            </div>

            ${order.notes ? `<div class="tracking-notes"><i class="fas fa-sticky-note"></i> ${escapeHTML(order.notes)}</div>` : ''}

            <div class="tracking-footer">
                <small>Placed: ${formatDate(order.createdAt)}</small>
                ${order.status === 'ready' ? `
                    <div class="ready-banner">
                        <i class="fas fa-bell"></i> Your order is ready!
                    </div>
                ` : ''}
                ${order.status === 'cancelled' ? `
                    <div class="ready-banner" style="background:#f8d7da;color:#721c24;">
                        <i class="fas fa-times-circle"></i> Order cancelled
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function getStatusLabel(status) {
    const labels = {
        pending: 'Pending',
        preparing: 'Preparing',
        ready: 'Ready',
        completed: 'Completed',
        cancelled: 'Cancelled'
    };
    return labels[status] || status;
}

function renderProgressBar(status) {
    const steps = ['pending', 'preparing', 'ready', 'completed'];

    if (status === 'cancelled') {
        return `<div class="cancelled-banner"><i class="fas fa-times-circle"></i> Order Cancelled</div>`;
    }

    const currentIndex = steps.indexOf(status);

    return `
        <div class="progress-steps">
            ${steps.map((step, i) => {
                const isDone = i <= currentIndex;
                const isCurrent = i === currentIndex;
                return `
                    <div class="progress-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}">
                        <div class="step-circle">
                            <i class="fas ${getStepIcon(step)}"></i>
                        </div>
                        <span class="step-label">${getStatusLabel(step)}</span>
                    </div>
                    ${i < steps.length - 1 ? `<div class="step-line ${i < currentIndex ? 'done' : ''}"></div>` : ''}
                `;
            }).join('')}
        </div>
    `;
}

function getStepIcon(step) {
    const icons = {
        pending: 'fa-clock',
        preparing: 'fa-fire',
        ready: 'fa-bell',
        completed: 'fa-check'
    };
    return icons[step] || 'fa-circle';
}
// ============================================================
//  TABLE MANAGEMENT & QR CODES
// ============================================================
function getTableFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('table');
}
getTableOrderURL(table)
function showTableBanner(tableNumber) {
    const existing = document.getElementById('tableWelcomeBanner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'tableWelcomeBanner';
    banner.innerHTML = `
        <div class="container">
            <i class="fas fa-chair"></i>
            <span>Welcome to <strong>${escapeHTML(tableNumber)}</strong>! Browse the menu and place your order — your table is already set.</span>
            <button onclick="this.parentElement.parentElement.remove()"
                    style="background:none;border:none;color:white;font-size:20px;cursor:pointer;margin-left:auto;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    const header = document.querySelector('.header');
    if (header && header.nextSibling) {
        header.parentElement.insertBefore(banner, header.nextSibling);
    }
}

function renderTablesGrid() {
    const grid = document.getElementById('tablesGrid');
    if (!grid) return;

    if (tables.length === 0) {
        grid.innerHTML = `
            <div class="no-tables-message" style="grid-column: 1/-1; text-align:center; padding:60px 20px; background:white; border-radius:15px;">
                <i class="fas fa-chair" style="font-size:48px;color:#ccc;display:block;margin-bottom:15px;"></i>
                <h3 style="color:#666;">No tables yet</h3>
                <p style="color:#999;margin-bottom:20px;">Add your first table to generate its QR code.</p>
                <button onclick="openAddTableModal()" class="btn-add">
                    <i class="fas fa-plus"></i> Add First Table
                </button>
            </div>`;
        return;
    }

    grid.innerHTML = tables.map(table => {
        const activeOrders = orders.filter(o =>
            o.tableNumber === table.number &&
            o.status !== 'completed' &&
            o.status !== 'cancelled'
        ).length;

        return `
            <div class="table-card">
                <div class="table-card-header">
                    <div class="table-icon"><i class="fas fa-chair"></i></div>
                    <div class="table-card-info">
                        <h4>${escapeHTML(table.number)}</h4>
                        <span class="table-meta">
                            <i class="fas fa-users"></i> ${table.capacity} seats
                            ${table.location ? ` • <i class="fas fa-map-marker-alt"></i> ${escapeHTML(table.location)}` : ''}
                        </span>
                    </div>
                    ${activeOrders > 0 ? `<span class="active-orders-badge">${activeOrders} active</span>` : ''}
                </div>

                ${table.notes ? `<p class="table-notes"><i class="fas fa-info-circle"></i> ${escapeHTML(table.notes)}</p>` : ''}

                <div class="table-qr-preview" onclick="showQRCode(${table.id})">
                    <div class="qr-mini" id="qr-mini-${table.id}"></div>
                    <span>Click to view QR</span>
                </div>

                <div class="table-actions">
                    <button class="btn-action btn-qr" onclick="showQRCode(${table.id})" title="Show QR Code">
                        <i class="fas fa-qrcode"></i> QR
                    </button>
                    <button class="btn-action btn-edit" onclick="editTable(${table.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="deleteTable(${table.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Render mini QR codes
    tables.forEach(table => {
        const container = document.getElementById(`qr-mini-${table.id}`);
        if (container && typeof QRCode !== 'undefined') {
            container.innerHTML = '';
            new QRCode(container, {
                text: getTableOrderURL(table),
                width: 80,
                height: 80,
                colorDark: "#2c3e50",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });
        }
    });
}

// Build the URL that a QR code points to
function getTableOrderURL(table) {
// Always direct QR codes to the customer menu page.
const currentUrl = new URL(window.location.href);
const customerUrl = new URL('index.html', currentUrl);

```
// Remove any admin query parameters or URL fragments.
customerUrl.search = '';
customerUrl.hash = '';

// Preserve the table number for ordering.
customerUrl.searchParams.set('table', table.number);

return customerUrl.href;
```

}


function openAddTableModal() {
    const modal = document.getElementById('addTableModal');
    const form = document.getElementById('tableForm');

    form.reset();
    document.getElementById('tableCapacity').value = 4;

    modal.querySelector('h3').innerHTML = '<i class="fas fa-plus"></i> Add New Table';
    modal.dataset.mode = 'add';
    modal.dataset.tableId = '';
    modal.classList.add('show');
}

function editTable(tableId) {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const modal = document.getElementById('addTableModal');

    document.getElementById('tableNumberInput').value = table.number;
    document.getElementById('tableCapacity').value = table.capacity || 4;
    document.getElementById('tableLocation').value = table.location || '';
    document.getElementById('tableNotes').value = table.notes || '';

    modal.querySelector('h3').innerHTML = '<i class="fas fa-edit"></i> Edit Table';
    modal.dataset.mode = 'edit';
    modal.dataset.tableId = tableId;
    modal.classList.add('show');
}

function saveTable(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }

    const modal = document.getElementById('addTableModal');
    const mode = modal.dataset.mode;

    const tableData = {
        number: document.getElementById('tableNumberInput').value.trim(),
        capacity: parseInt(document.getElementById('tableCapacity').value) || 4,
        location: document.getElementById('tableLocation').value.trim(),
        notes: document.getElementById('tableNotes').value.trim()
    };

    if (!tableData.number) {
        showToast('Table number is required', 'error');
        return false;
    }

    const duplicate = tables.find(t =>
        t.number.toLowerCase() === tableData.number.toLowerCase() &&
        (mode === 'add' || t.id !== parseInt(modal.dataset.tableId))
    );
    if (duplicate) {
        showToast('A table with this number already exists', 'error');
        return false;
    }

    if (mode === 'add') {
        tableData.id = Date.now();
        tableData.createdAt = new Date().toISOString();
        tables.push(tableData);
        showToast(`"${tableData.number}" added! QR code generated.`, 'success');
    } else {
        const tableId = parseInt(modal.dataset.tableId);
        const index = tables.findIndex(t => t.id === tableId);
        if (index !== -1) {
            tableData.id = tableId;
            tableData.createdAt = tables[index].createdAt;
            tables[index] = tableData;
            showToast(`"${tableData.number}" updated!`, 'success');
        }
    }

    persistTables();
    closeModal();
    renderTablesGrid();

    return false;
}

function deleteTable(tableId) {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    if (!confirm(`Delete "${table.number}"? Its QR code will no longer work.`)) return;

    tables = tables.filter(t => t.id !== tableId);
    persistTables();
    renderTablesGrid();
    showToast(`"${table.number}" deleted`, 'success');
}

function showQRCode(tableId) {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    currentQRTable = table;

    document.getElementById('qrTableName').textContent = table.number;
    document.getElementById('qrTableMeta').innerHTML =
        `<i class="fas fa-users"></i> ${table.capacity} seats` +
        (table.location ? ` • <i class="fas fa-map-marker-alt"></i> ${escapeHTML(table.location)}` : '');

    const container = document.getElementById('qrCodeContainer');
    container.innerHTML = '';

    if (typeof QRCode === 'undefined') {
        container.innerHTML = '<p style="color:#e74c3c;">QR library not loaded. Check your internet connection.</p>';
        document.getElementById('qrModal').classList.add('show');
        return;
    }

    new QRCode(container, {
        text: getTableOrderURL(table),
        width: 250,
        height: 250,
        colorDark: "#2c3e50",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    document.getElementById('qrModal').classList.add('show');
}

function printQRCode() {
    if (!currentQRTable) return;
    const { dataUrl } = getQRDataUrl();
    if (!dataUrl) { showToast('QR code not ready', 'error'); return; }

    const win = window.open('', '_blank');
    win.document.write(`
        <html>
        <head>
            <title>Print QR - ${escapeHTML(currentQRTable.number)}</title>
            <style>
                body { font-family: 'Poppins', Arial, sans-serif; text-align: center; padding: 40px; }
                .card { border: 3px solid #2c3e50; border-radius: 20px; padding: 40px; max-width: 450px; margin: 0 auto; }
                h1 { font-size: 28px; margin: 0 0 10px; color: #2c3e50; }
                h2 { font-size: 20px; margin: 0 0 20px; color: #3498db; }
                img { width: 300px; height: 300px; margin: 20px 0; }
                p { color: #666; font-size: 14px; margin: 10px 0; }
                .scan-text { font-size: 18px; font-weight: 600; color: #2c3e50; margin-top: 20px; }
                .footer { font-size: 12px; color: #999; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>🍽️ ${escapeHTML(settings.hotelName || 'Royal Hotel')}</h1>
                <h2>${escapeHTML(currentQRTable.number)}</h2>
                <img src="${dataUrl}" alt="QR Code">
                <p class="scan-text">📱 Scan to view menu & order</p>
                <p>Point your phone camera at the QR code</p>
                <div class="footer">Capacity: ${currentQRTable.capacity} seats${currentQRTable.location ? ' • ' + escapeHTML(currentQRTable.location) : ''}</div>
            </div>
            <script>
                window.onload = function() {
                    setTimeout(function() { window.print(); }, 300);
                };
            <\/script>
        </body>
        </html>
    `);
    win.document.close();
}

function printAllQRCodes() {
    if (tables.length === 0) { showToast('No tables to print', 'error'); return; }
    if (typeof QRCode === 'undefined') { showToast('QR library not loaded', 'error'); return; }

    const qrPromises = tables.map(table => {
        return new Promise(resolve => {
            const temp = document.createElement('div');
            new QRCode(temp, {
                text: getTableOrderURL(table),
                width: 300,
                height: 300,
                colorDark: "#2c3e50",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });

            setTimeout(() => {
                const canvas = temp.querySelector('canvas');
                const img = temp.querySelector('img');
                const dataUrl = canvas ? canvas.toDataURL('image/png') : (img ? img.src : '');
                resolve({ table, dataUrl });
            }, 100);
        });
    });

    Promise.all(qrPromises).then(results => {
        const cardsHTML = results.map(({ table, dataUrl }) => `
            <div class="card">
                <h1>🍽️ ${escapeHTML(settings.hotelName || 'Royal Hotel')}</h1>
                <h2>${escapeHTML(table.number)}</h2>
                <img src="${dataUrl}" alt="QR">
                <p class="scan-text">📱 Scan to view menu & order</p>
                <div class="footer">Capacity: ${table.capacity} seats${table.location ? ' • ' + escapeHTML(table.location) : ''}</div>
            </div>
        `).join('');

        const win = window.open('', '_blank');
        win.document.write(`
            <html>
            <head>
                <title>All Table QR Codes</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                    .card {
                        border: 3px solid #2c3e50; border-radius: 20px; padding: 30px;
                        text-align: center; page-break-inside: avoid; display: inline-block;
                        width: 300px; margin: 10px; vertical-align: top;
                    }
                    h1 { font-size: 20px; margin: 0 0 8px; color: #2c3e50; }
                    h2 { font-size: 18px; margin: 0 0 12px; color: #3498db; }
                    img { width: 240px; height: 240px; margin: 10px 0; }
                    .scan-text { font-size: 14px; font-weight: 600; color: #2c3e50; margin-top: 10px; }
                    .footer { font-size: 11px; color: #999; margin-top: 10px; }
                    @media print { .card { page-break-inside: avoid; } }
                </style>
            </head>
            <body>
                ${cardsHTML}
                <script>
                    window.onload = function() {
                        setTimeout(function() { window.print(); }, 500);
                    };
                <\/script>
            </body>
            </html>
        `);
        win.document.close();
    });
}

function getQRDataUrl() {
    const container = document.getElementById('qrCodeContainer');
    if (!container) return { dataUrl: null };
    const canvas = container.querySelector('canvas');
    const img = container.querySelector('img');
    if (canvas) return { dataUrl: canvas.toDataURL('image/png') };
    if (img && img.src.startsWith('data:')) return { dataUrl: img.src };
    return { dataUrl: null };
}

function downloadQRCode() {
    if (!currentQRTable) return;
    const { dataUrl } = getQRDataUrl();
    if (!dataUrl) { showToast('QR code not ready. Try again.', 'error'); return; }

    const link = document.createElement('a');
    link.download = `QR-${currentQRTable.number.replace(/\s+/g, '-')}.png`;
    link.href = dataUrl;
    link.click();
    showToast('QR code downloaded!', 'success');
}

// ============================================================
//  ADMIN PAGE
// ============================================================
function initializeAdminPage() {
    console.log('Initializing admin page');
    if (currentUser) {
        showAdminPanel();
    }
    setupAdminEventListeners();

    if (!firebaseEnabled) {
        console.log('Admin running in localStorage mode — configure firebase-config.js for cloud storage.');
    }
}

function adminLogin() {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;

    // Demo credentials — switch to Firebase Auth for production.
    if (username === 'admin' && password === 'admin123') {
        currentUser = { username: 'admin', loggedInAt: new Date().toISOString() };
        localStorage.setItem(LS_KEYS.admin, JSON.stringify(currentUser));
        showAdminPanel();
        showToast('Welcome to Admin Panel!', 'success');
    } else {
        showToast('Invalid credentials', 'error');
    }
}

function showAdminPanel() {
    const loginForm = document.getElementById('loginForm');
    const adminPanel = document.getElementById('adminPanel');

    if (loginForm) loginForm.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'block';

    const adminName = document.getElementById('adminName');
    if (adminName && currentUser) adminName.textContent = currentUser.username;

    updateAdminStats();
    renderMenuItemsTable();
    renderAdminCategories();
    renderOrdersList();
    renderTablesGrid();
    loadSettings();
}

function logoutAdmin() {
    currentUser = null;
    localStorage.removeItem(LS_KEYS.admin);

    const loginForm = document.getElementById('loginForm');
    const adminPanel = document.getElementById('adminPanel');

    if (loginForm) loginForm.style.display = 'block';
    if (adminPanel) adminPanel.style.display = 'none';

    document.getElementById('adminPassword').value = '';
}

function showSection(sectionId, btnElement) {
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.admin-nav button').forEach(btn => {
        btn.classList.remove('active');
    });

    const section = document.getElementById(sectionId + 'Section');
    if (section) {
        section.classList.add('active');
        if (sectionId === 'orders') renderOrdersList();
        if (sectionId === 'menu') renderMenuItemsTable();
        if (sectionId === 'categories') renderAdminCategories();
        if (sectionId === 'tables') renderTablesGrid();
        if (sectionId === 'dashboard') updateAdminStats();
        if (sectionId === 'settings') loadSettings();
    }

    if (btnElement) btnElement.classList.add('active');
}

function updateAdminStats() {
    const el = id => document.getElementById(id);
    if (el('totalItems')) el('totalItems').textContent = menuItems.length;
    if (el('totalCategories')) el('totalCategories').textContent = categories.length;
    if (el('totalSpecials')) el('totalSpecials').textContent = menuItems.filter(item => item.isSpecial).length;
    if (el('totalTables')) el('totalTables').textContent = tables.length;

    if (el('todayOrders')) {
        const today = new Date().toDateString();
        el('todayOrders').textContent = orders.filter(order =>
            new Date(order.createdAt).toDateString() === today
        ).length;
    }
}
// ============================================================
//  ADMIN — MENU ITEM MANAGEMENT
// ============================================================
function renderMenuItemsTable() {
    const tableBody = document.getElementById('menuItemsTable');
    if (!tableBody) return;

    if (menuItems.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    No menu items found.
                    <button onclick="openAddItemModal()" style="background: none; border: none; color: #3498db; cursor: pointer; text-decoration: underline;">
                        Add your first item
                    </button>
                </td>
            </tr>`;
        return;
    }

    const currency = (settings && settings.currency) || '$';

    tableBody.innerHTML = menuItems.map(item => `
        <tr>
            <td>
                <div class="item-image-small" onclick="viewImage('${item.image || getDefaultImage()}')" style="cursor: pointer;" title="Click to view larger">
                    <img src="${item.image || getDefaultImage()}"
                         alt="${escapeHTML(item.name)}"
                         onerror="this.src='${getDefaultImage()}'">
                </div>
            </td>
            <td>${escapeHTML(item.name)}</td>
            <td>${escapeHTML(item.category)}</td>
            <td>${currency}${item.price.toFixed(2)}</td>
            <td>${item.isSpecial ? '<span class="status-available">Yes</span>' : 'No'}</td>
            <td>
                <span class="${item.isAvailable ? 'status-available' : 'status-unavailable'}">
                    ${item.isAvailable !== false ? 'Available' : 'Unavailable'}
                </span>
            </td>
            <td>
                <button class="btn-action btn-edit" onclick="editItem(${item.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action btn-delete" onclick="deleteItem(${item.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function editItem(itemId) {
    openEditItemModal(itemId);
}

function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    const index = menuItems.findIndex(i => i.id === itemId);
    if (index !== -1) {
        menuItems.splice(index, 1);
        saveMenuItems();
        renderMenuItemsTable();
        updateAdminStats();
        showToast('Item deleted successfully', 'success');
    }
}

function openAddItemModal() {
    const modal = document.getElementById('addItemModal');
    const form = document.getElementById('itemForm');
    const categorySelect = document.getElementById('itemCategory');

    if (form) form.reset();
    resetImagePreview();

    if (categorySelect) {
        categorySelect.innerHTML = categories.map(cat =>
            `<option value="${escapeHTML(cat.name)}">${escapeHTML(cat.name)}</option>`
        ).join('');
    }

    modal.querySelector('h3').innerHTML = '<i class="fas fa-plus"></i> Add New Menu Item';
    modal.dataset.mode = 'add';
    modal.dataset.itemId = '';
    modal.classList.add('show');
}
function openEditItemModal(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) { showToast('Item not found', 'error'); return; }

    const modal = document.getElementById('addItemModal');
    const categorySelect = document.getElementById('itemCategory');

    document.getElementById('itemName').value = item.name;
    document.getElementById('itemDescription').value = item.description;
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemPrepTime').value = item.prepTime || 15;
    document.getElementById('itemSpecial').checked = item.isSpecial === true;
    document.getElementById('itemAvailable').checked = item.isAvailable !== false;

    if (item.image) {
        updateImagePreview(item.image);
        document.getElementById('itemImageUrl').value = item.image;
    } else {
        resetImagePreview();
    }

    if (categorySelect) {
        categorySelect.innerHTML = categories.map(cat =>
            `<option value="${escapeHTML(cat.name)}" ${cat.name === item.category ? 'selected' : ''}>${escapeHTML(cat.name)}</option>`
        ).join('');
    }

    modal.querySelector('h3').innerHTML = '<i class="fas fa-edit"></i> Edit Menu Item';
    modal.dataset.mode = 'edit';
    modal.dataset.itemId = itemId;
    modal.classList.add('show');
}

function saveItem(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const modal = document.getElementById('addItemModal');
    const mode = modal.dataset.mode;

    const imageUrl = document.getElementById('itemImage').value.trim();

    const itemData = {
        name: document.getElementById('itemName').value.trim(),
        description: document.getElementById('itemDescription').value.trim(),
        price: parseFloat(document.getElementById('itemPrice').value) || 0,
        category: document.getElementById('itemCategory').value,
        image: imageUrl,
        prepTime: parseInt(document.getElementById('itemPrepTime').value) || 15,
        isSpecial: document.getElementById('itemSpecial').checked,
        isAvailable: document.getElementById('itemAvailable').checked,
        createdAt: new Date().toISOString()
    };

    if (!itemData.name) { showToast('Item name is required', 'error'); return false; }
    if (itemData.price <= 0) { showToast('Price must be greater than 0', 'error'); return false; }
    if (!itemData.category) { showToast('Category is required', 'error'); return false; }

    if (!itemData.image) {
        const useDefault = confirm('No image selected. Use default image?');
        if (useDefault) {
            itemData.image = getDefaultImage();
        } else {
            showToast('Please select an image for the item', 'error');
            return false;
        }
    }

    let successMessage = '';

    if (mode === 'add') {
        itemData.id = Date.now();
        menuItems.push(itemData);
        successMessage = `"${itemData.name}" added successfully!`;
    } else if (mode === 'edit') {
        const itemId = parseInt(modal.dataset.itemId);
        const index = menuItems.findIndex(i => i.id === itemId);
        if (index !== -1) {
            itemData.id = itemId;
            itemData.createdAt = menuItems[index].createdAt;
            menuItems[index] = itemData;
            successMessage = `"${itemData.name}" updated successfully!`;
        } else {
            showToast('Item not found', 'error');
            return false;
        }
    }

    saveMenuItems();
    showToast(successMessage, 'success');

    setTimeout(() => {
        closeModal();
        resetImagePreview();
    }, 1200);

    renderMenuItemsTable();
    updateAdminStats();
    return false;
}

function viewImage(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3>Image Preview</h3>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" class="close-modal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body" style="text-align: center;">
                <img src="${imageUrl}" alt="Preview" class="modal-image-preview"
                     onerror="this.src='${getDefaultImage()}'">
                <div style="margin-top: 20px;">
                    <a href="${imageUrl}" target="_blank" class="btn" style="background: #3498db; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">
                        <i class="fas fa-external-link-alt"></i> Open Original
                    </a>
                </div>
            </div>
        </div>
    `;

    modal.onclick = function(e) {
        if (e.target === modal) modal.remove();
    };

    document.body.appendChild(modal);
}
// ============================================================
//  ADMIN — CATEGORY MANAGEMENT
// ============================================================
function renderAdminCategories() {
    const categoriesGrid = document.getElementById('adminCategoriesGrid');
    if (!categoriesGrid) return;

    if (categories.length === 0) {
        categoriesGrid.innerHTML = '<div style="text-align: center; padding: 40px;">No categories found. Add your first category!</div>';
        return;
    }

    categoriesGrid.innerHTML = categories.map(cat => `
        <div class="category-card">
            <i class="${cat.icon}"></i>
            <h4>${escapeHTML(cat.name)}</h4>
            <p>${escapeHTML(cat.description || '')}</p>
            <div class="category-actions">
                <button class="btn-action btn-edit" onclick="editCategory(${cat.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action btn-delete" onclick="deleteCategory(${cat.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function openAddCategoryModal() {
    const modal = document.getElementById('addCategoryModal');
    const form = document.getElementById('categoryForm');

    if (form) form.reset();
    modal.querySelector('#addCategoryModal h3').innerHTML = '<i class="fas fa-plus"></i> Add New Category';
    modal.dataset.mode = 'add';
    modal.dataset.categoryId = '';
    modal.classList.add('show');
}

function saveCategory(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const modal = document.getElementById('addCategoryModal');
    const mode = modal.dataset.mode;

    const categoryData = {
        name: document.getElementById('categoryName').value.trim(),
        description: document.getElementById('categoryDescription').value.trim(),
        icon: document.getElementById('categoryIcon').value.trim() || 'fas fa-tag'
    };

    if (!categoryData.name) {
        showToast('Category name is required', 'error');
        return false;
    }

    const exists = categories.find(cat => cat.name.toLowerCase() === categoryData.name.toLowerCase());
    if (exists && mode === 'add') {
        showToast('Category already exists', 'error');
        return false;
    }

    if (mode === 'add') {
        categoryData.id = Date.now();
        categories.push(categoryData);
        showToast('Category added successfully!', 'success');
    } else {
        const categoryId = parseInt(modal.dataset.categoryId);
        const index = categories.findIndex(c => c.id === categoryId);
        if (index !== -1) {
            categoryData.id = categoryId;
            categories[index] = categoryData;
            showToast('Category updated successfully!', 'success');
        }
    }

    saveCategories();
    closeModal();
    renderAdminCategories();
    updateAdminStats();

    return false;
}

function editCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const modal = document.getElementById('addCategoryModal');

    document.getElementById('categoryName').value = category.name;
    document.getElementById('categoryDescription').value = category.description || '';
    document.getElementById('categoryIcon').value = category.icon || 'fas fa-tag';

    modal.querySelector('#addCategoryModal h3').innerHTML = '<i class="fas fa-edit"></i> Edit Category';
    modal.dataset.mode = 'edit';
    modal.dataset.categoryId = categoryId;
    modal.classList.add('show');
}

function deleteCategory(categoryId) {
    if (!confirm('Are you sure you want to delete this category? Items in this category will be moved to "Uncategorized".')) return;

    const index = categories.findIndex(c => c.id === categoryId);
    if (index !== -1) {
        const defaultCategory = categories[0]?.name || 'Uncategorized';
        menuItems.forEach(item => {
            if (item.category === categories[index].name) {
                item.category = defaultCategory;
            }
        });

        categories.splice(index, 1);

        saveCategories();
        saveMenuItems();
        renderAdminCategories();
        renderMenuItemsTable();
        updateAdminStats();
        showToast('Category deleted successfully', 'success');
    }
}

// ============================================================
//  ADMIN — SETTINGS
// ============================================================
function loadSettings() {
    if (!settings) return;
    if (document.getElementById('hotelName')) document.getElementById('hotelName').value = settings.hotelName || 'Royal Hotel';
    if (document.getElementById('currency')) document.getElementById('currency').value = settings.currency || '$';
    if (document.getElementById('taxRate')) document.getElementById('taxRate').value = settings.taxRate || 10;
}

function saveSettings() {
    settings.hotelName = document.getElementById('hotelName').value.trim();

    settings.currency = document.getElementById('currency').value;
    settings.taxRate = parseFloat(document.getElementById('taxRate').value) || 10;

    persistSettings();
    showToast('Settings saved successfully!', 'success');
}
// ============================================================
//  ADMIN — IMAGE UPLOAD & PREVIEW
// ============================================================
function updateImagePreview(imageUrl) {
    const previewImage = document.getElementById('previewImage');
    const imagePlaceholder = document.getElementById('imagePlaceholder');
    const imageInput = document.getElementById('itemImage');

    const existingValidation = document.querySelector('.image-validation');
    if (existingValidation) existingValidation.remove();

    if (!imageUrl) {
        resetImagePreview();
        return;
    }

    if (isValidImageUrl(imageUrl)) {
        previewImage.src = imageUrl;
        previewImage.classList.add('loaded');
        imagePlaceholder.classList.add('hidden');
        if (imageInput) imageInput.value = imageUrl;
        showImageValidation('valid', 'Image URL is valid');
    } else {
        previewImage.classList.remove('loaded');
        imagePlaceholder.classList.remove('hidden');
        if (imageInput) imageInput.value = '';
        showImageValidation('invalid', 'Invalid image URL');
    }
}

function isValidImageUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

function showImageValidation(type, message) {
    const existingValidation = document.querySelector('.image-validation');
    if (existingValidation) existingValidation.remove();

    const validation = document.createElement('div');
    validation.className = `image-validation ${type}`;
    validation.innerHTML = `
        <i class="fas fa-${type === 'valid' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${escapeHTML(message)}</span>
    `;

    const container = document.querySelector('.image-upload-container');
    if (container) container.appendChild(validation);
}

function resetImagePreview() {
    const previewImage = document.getElementById('previewImage');
    const imagePlaceholder = document.getElementById('imagePlaceholder');
    const imageInput = document.getElementById('itemImage');
    const imageUrlInput = document.getElementById('itemImageUrl');
    const fileInput = document.getElementById('itemImageFile');
    const sampleSelect = document.getElementById('sampleImages');

    if (previewImage) {
        previewImage.src = '';
        previewImage.classList.remove('loaded');
    }
    if (imagePlaceholder) imagePlaceholder.classList.remove('hidden');
    if (imageInput) imageInput.value = '';
    if (imageUrlInput) imageUrlInput.value = '';
    if (fileInput) fileInput.value = '';
    if (sampleSelect) sampleSelect.value = '';

    const validation = document.querySelector('.image-validation');
    if (validation) validation.remove();
}

function handleImageUpload(input) {
    const file = input.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        updateImagePreview(e.target.result);
        showToast('Image uploaded successfully!', 'success');
    };
    reader.onerror = function() {
        showToast('Error reading image file', 'error');
    };
    reader.readAsDataURL(file);
}

function selectSampleImage(select) {
    if (select.value) {
        updateImagePreview(select.value);
        showToast('Sample image selected', 'info');
    }
}

// ============================================================
//  ADMIN — ORDERS MANAGEMENT
// ============================================================
function renderOrdersList() {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;

    if (orders.length === 0) {
        ordersList.innerHTML = '<div class="no-orders">No orders yet</div>';
        return;
    }

    const sortedOrders = [...orders].sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    const currency = (settings && settings.currency) || '$';

    ordersList.innerHTML = sortedOrders.map(order => `
        <div class="order-card" data-order-id="${order.id}">
            <div class="order-info">
                <div class="order-header">
                    <div>
                        <h4>
                            <i class="fas fa-chair"></i> ${escapeHTML(order.tableNumber || 'No Table')}
                            <span class="order-id">#${String(order.id).slice(-6)}</span>
                        </h4>
                        <span class="order-time">
                            ${order.customerName ? `<i class="fas fa-user"></i> ${escapeHTML(order.customerName)} • ` : ''}
                            ${formatDate(order.createdAt)}
                        </span>
                    </div>
                    <span class="tracking-status status-${order.status}">
                        ${getStatusLabel(order.status)}
                    </span>
                </div>

                <div class="order-items">
                    ${(order.items || []).map(item => `
                        <div class="order-item">
                            <span>${escapeHTML(item.name)} × ${item.quantity}</span>
                            <span>${currency}${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>

                ${order.notes ? `<div class="order-notes"><i class="fas fa-sticky-note"></i> ${escapeHTML(order.notes)}</div>` : ''}

                <div class="order-total">
                    <strong>Total:</strong>
                    <strong>${currency}${Number(order.total).toFixed(2)}</strong>
                </div>
            </div>

            <div class="order-status">
                <label style="font-size:12px;color:#666;margin-bottom:5px;">Update Status:</label>
                <select class="status-select" onchange="updateOrderStatus(${order.id}, this.value)">
                    <option value="pending"   ${order.status === 'pending'   ? 'selected' : ''}>🕐 Pending</option>
                    <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>🔥 Preparing</option>
                    <option value="ready"     ${order.status === 'ready'     ? 'selected' : ''}>🔔 Ready</option>
                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>✅ Completed</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>❌ Cancelled</option>
                </select>
                <button class="btn-delete-order" onclick="deleteOrder(${order.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function updateOrderStatus(orderId, status) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    order.status = status;
    order.updatedAt = new Date().toISOString();
    saveOrders();

    renderOrdersList();
    updateAdminStats();

    const statusLabels = {
        pending: 'Pending',
        preparing: 'Preparing 🔥',
        ready: 'Ready 🔔',
        completed: 'Completed ✅',
        cancelled: 'Cancelled ❌'
    };

    showToast(
        `Table ${order.tableNumber}: Order #${String(orderId).slice(-6)} → ${statusLabels[status]}`,
        status === 'ready' ? 'success' : 'info'
    );
}

function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order?')) return;

    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
        orders.splice(index, 1);
        saveOrders();
        renderOrdersList();
        updateAdminStats();
        showToast('Order deleted successfully', 'success');
    }
}

// ============================================================
//  MODAL HELPERS
// ============================================================
function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
}

function setupAdminEventListeners() {
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
}
// ============================================================
//  GLOBAL EXPORTS (for inline HTML onclick handlers)
// ============================================================
// Customer page
window.addToCart = addToCart;
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.checkout = checkout;
window.closeCheckoutModal = closeCheckoutModal;
window.confirmCheckout = confirmCheckout;
window.toggleCart = toggleCart;
window.closeCart = closeCart;
window.filterMenu = filterMenu;
window.filterByCategory = filterByCategory;
window.renderMenuItems = renderMenuItems;
window.renderOrderTracking = renderOrderTracking;
window.getStatusLabel = getStatusLabel;

// Admin page
window.adminLogin = adminLogin;
window.logoutAdmin = logoutAdmin;
window.showSection = showSection;
window.showAdminPanel = showAdminPanel;
window.openAddItemModal = openAddItemModal;
window.openEditItemModal = openEditItemModal;
window.saveItem = saveItem;
window.deleteItem = deleteItem;
window.editItem = editItem;
window.openAddCategoryModal = openAddCategoryModal;
window.saveCategory = saveCategory;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.saveSettings = saveSettings;
window.loadSettings = loadSettings;
window.closeModal = closeModal;
window.togglePassword = togglePassword;
window.renderMenuItemsTable = renderMenuItemsTable;
window.renderAdminCategories = renderAdminCategories;
window.renderOrdersList = renderOrdersList;
window.updateOrderStatus = updateOrderStatus;
window.deleteOrder = deleteOrder;
window.openAddTableModal = openAddTableModal;
window.editTable = editTable;
window.saveTable = saveTable;
window.deleteTable = deleteTable;
window.showQRCode = showQRCode;
window.downloadQRCode = downloadQRCode;
window.printQRCode = printQRCode;
window.printAllQRCodes = printAllQRCodes;
window.renderTablesGrid = renderTablesGrid;
window.getTableFromURL = getTableFromURL;

// Image handling
window.viewImage = viewImage;
window.updateImagePreview = updateImagePreview;
window.handleImageUpload = handleImageUpload;
window.selectSampleImage = selectSampleImage;
window.resetImagePreview = resetImagePreview;

// Keep initializeApp on the global scope too
window.initializeApp = initializeApp;
