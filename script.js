// Global Variables
let menuItems = [];
let categories = [];
let cart = [];
let orders = [];
let currentUser = null;
let settings = {};
let tables = [];
// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 DOM ready — booting app');
    
    try {
        loadData();
    } catch (e) {
        console.error('❌ loadData() failed:', e);
    }
    
    // Wait one tick for the browser to finish painting
    // (avoids a rare race where #menuGrid isn't in the DOM yet)
    setTimeout(function () {
        try {
            initializeApp();
        } catch (e) {
            console.error('❌ initializeApp() failed:', e);
        }
    }, 0);
});

// Load data from localStorage
function loadData() {
    console.log('Loading data...');
    
    // Load menu items
    const savedItems = localStorage.getItem('hotelMenuItems');
    if (savedItems) {
        menuItems = JSON.parse(savedItems);
        console.log('Loaded menu items:', menuItems);
    } else {
        // Default menu items
        menuItems = [
            {
                id: 1,
                name: 'Grilled Salmon',
                description: 'Fresh Atlantic salmon with lemon butter sauce',
                price: 24.99,
                category: 'Main Course',
                image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80',
                prepTime: 20,
                isSpecial: true,
                isAvailable: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                name: 'Caesar Salad',
                description: 'Crisp romaine lettuce with Caesar dressing and croutons',
                price: 12.99,
                category: 'Appetizer',
                image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80',
                prepTime: 10,
                isSpecial: false,
                isAvailable: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                name: 'Chocolate Lava Cake',
                description: 'Warm chocolate cake with molten center',
                price: 8.99,
                category: 'Dessert',
                image: 'https://images.unsplash.com/photo-1624353365286-3f8d62dadadf?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80',
                prepTime: 15,
                isSpecial: true,
                isAvailable: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 4,
                name: 'Beef Burger',
                description: 'Juicy beef patty with fresh vegetables',
                price: 16.99,
                category: 'Main Course',
                image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80',
                prepTime: 15,
                isSpecial: false,
                isAvailable: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 5,
                name: 'Margarita Pizza',
                description: 'Classic pizza with tomato sauce and mozzarella',
                price: 18.99,
                category: 'Main Course',
                image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80',
                prepTime: 25,
                isSpecial: false,
                isAvailable: true,
                createdAt: new Date().toISOString()
            }
        ];
        saveMenuItems();
    }

    // Load categories
    const savedCategories = localStorage.getItem('hotelMenuCategories');
    if (savedCategories) {
        categories = JSON.parse(savedCategories);
        console.log('Loaded categories:', categories);
    } else {
        // Default categories
        categories = [
            { id: 1, name: 'Appetizer', description: 'Starters and small bites', icon: 'fas fa-seedling' },
            { id: 2, name: 'Main Course', description: 'Main dishes and entrees', icon: 'fas fa-utensils' },
            { id: 3, name: 'Dessert', description: 'Sweet treats and desserts', icon: 'fas fa-ice-cream' },
            { id: 4, name: 'Beverages', description: 'Drinks and beverages', icon: 'fas fa-glass-cheers' },
            { id: 5, name: 'Specials', description: 'Today\'s special offers', icon: 'fas fa-fire' }
        ];
        saveCategories();
    }
// Load tables
    const savedTables = localStorage.getItem('hotelMenuTables');
    if (savedTables) {
        tables = JSON.parse(savedTables);
        console.log('Loaded tables:', tables);
    } else {
        // Default tables
        tables = [
            { id: 1, number: 'Table 1', capacity: 4, location: 'Indoor', notes: '' },
            { id: 2, number: 'Table 2', capacity: 4, location: 'Indoor', notes: '' },
            { id: 3, number: 'Table 3', capacity: 2, location: 'Patio', notes: 'Near window' },
            { id: 4, number: 'Table 4', capacity: 6, location: 'VIP', notes: 'Family size' }
        ];
        persistTables();
    }
    // Load cart
    //const savedCart = localStorage.getItem('hotelMenuCart');
    //if (savedCart) {
    //    cart = JSON.parse(savedCart);
    normalizeCart();
    updateCartCount();
    
    //}
addToCart(itemId)
    // Load orders
    const savedOrders = localStorage.getItem('hotelMenuOrders');
    if (savedOrders) {
        orders = JSON.parse(savedOrders);
    }

    // Load settings
    const savedSettings = localStorage.getItem('hotelMenuSettings');
    if (savedSettings) {
        settings = JSON.parse(savedSettings);
    } else {
        settings = {
            hotelName: 'Royal Hotel',
            currency: '$',
            taxRate: 10
        };
        saveSettings();
    }

    // Load admin status
    const savedUser = localStorage.getItem('hotelMenuAdmin');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    }
  // ========== CROSS-TAB REAL-TIME SYNC ==========
// This listens for changes to localStorage made by OTHER tabs.
// When admin updates an order status in admin.html,
// the customer page (index.html) automatically updates!

window.addEventListener('storage', (e) => {
    // Order status changed by admin
    if (e.key === 'hotelMenuOrders') {
        orders = JSON.parse(e.newValue || '[]');
        
        // If we're on the customer page, refresh tracking
        if (document.getElementById('trackingOrders')) {
            renderOrderTracking();
            
            // Find recently changed order to show a notification
            if (e.oldValue) {
                const oldOrders = JSON.parse(e.oldValue);
                detectAndNotifyStatusChange(oldOrders, orders);
            }
        }
        
        // If we're on the admin page, refresh orders list
        if (document.getElementById('ordersList')) {
            renderOrdersList();
            updateAdminStats();
        }
    }
    
    // Menu items changed (admin edited menu)
    if (e.key === 'hotelMenuItems') {
        menuItems = JSON.parse(e.newValue || '[]');
        if (document.getElementById('menuGrid')) {
            renderMenuItems();
            renderSpecials();
        }
    }
    if (e.key === 'hotelMenuTables') {
    tables = JSON.parse(e.newValue || '[]');
    if (document.getElementById('tablesGrid')) {
        renderTablesGrid();
    }
    }
    // Categories changed
    if (e.key === 'hotelMenuCategories') {
        categories = JSON.parse(e.newValue || '[]');
        if (document.getElementById('categoryFilter')) {
            renderCategories();
        }
    }
});

// Detect if a status changed and show notification to the customer
function detectAndNotifyStatusChange(oldOrders, newOrders) {
    newOrders.forEach(newOrder => {
        const oldOrder = oldOrders.find(o => o.id === newOrder.id);
        if (oldOrder && oldOrder.status !== newOrder.status) {
            const messages = {
                'preparing': `👨‍🍳 Your order #${newOrder.id.toString().slice(-6)} is being prepared!`,
                'ready': `🔔 Your order is ready! Please collect it at the counter.`,
                'completed': `✅ Your order has been completed. Enjoy!`,
                'cancelled': `❌ Your order #${newOrder.id.toString().slice(-6)} was cancelled.`
            };
            
            const msg = messages[newOrder.status];
            if (msg) {
                showToast(msg, newOrder.status === 'cancelled' ? 'error' : 'success');
                
                // Play a bell sound for "ready" status
                if (newOrder.status === 'ready') {
                    playNotificationSound();
                }
                
                // Also flash the browser tab title
                flashTitle(msg);
            }
        }
    });
}

// Optional: play a chime sound
function playNotificationSound() {
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignore if browser blocks autoplay
    } catch (e) {
        // Silent fail
    }
}

// Flash browser tab title to get user attention
function flashTitle(message) {
    const originalTitle = document.title;
    let count = 0;
    const interval = setInterval(() => {
        document.title = count % 2 === 0 ? '🔔 ' + message : originalTitle;
        count++;
        if (count > 6) {
            clearInterval(interval);
            document.title = originalTitle;
        }
    }, 800);
} 
    


}

// Save data to localStorage
function saveMenuItems() {
    localStorage.setItem('hotelMenuItems', JSON.stringify(menuItems));
}

function saveCategories() {
    localStorage.setItem('hotelMenuCategories', JSON.stringify(categories));
}

// ========== CART PERSISTENCE ==========

function saveCart() {
    try {
        localStorage.setItem('hotelMenuCart', JSON.stringify(cart));
    } catch (err) {
        console.error('Failed to save cart:', err);
    }
}

// Normalize cart items after loading from localStorage
function normalizeCart() {
    if (!Array.isArray(cart)) { cart = []; return; }
    
    cart = cart
        .filter(item => item && item.id != null)
        .map(item => ({
            id: Number(item.id),
            name: item.name || 'Unknown Item',
            price: Number(item.price) || 0,
            image: item.image || '',
            category: item.category || '',
            quantity: Math.max(1, Number(item.quantity) || 1)
        }));
}
function saveOrders() {
    localStorage.setItem('hotelMenuOrders', JSON.stringify(orders));
}

function saveSettings() {
    settings.hotelName = document.getElementById('hotelName').value.trim();
    settings.currency = document.getElementById('currency').value;
    settings.taxRate = parseFloat(document.getElementById('taxRate').value) || 10;
    
    // FIX: Use the localStorage save function, not recursion
    localStorage.setItem('hotelMenuSettings', JSON.stringify(settings));
    
    showToast('Settings saved successfully!', 'success');
}
function persistTables() {
    localStorage.setItem('hotelMenuTables', JSON.stringify(tables));
}
// Initialize app based on current page
function initializeApp() {
    console.log('Initializing app...');
    console.log('menuItems:', menuItems.length, 'categories:', categories.length, 'orders:', orders.length);
    
    const isAdminPage = window.location.pathname.includes('admin.html') 
                     || document.getElementById('adminPanel') !== null;
    
    if (isAdminPage) {
        console.log('→ Admin page');
        initializeAdminPage();
    } else {
        console.log('→ Customer page');
        initializeCustomerPage();
    }
}
function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
}
function showAdminPanel() {
    const loginForm = document.getElementById('loginForm');
    const adminPanel = document.getElementById('adminPanel');
    
    if (loginForm) loginForm.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'block';
    
    // Load admin data
    updateAdminStats();
    renderMenuItemsTable();
    renderAdminCategories();
    renderOrdersList();   // ← Add this
    loadSettings();
    
    // Set admin name
    const adminName = document.getElementById('adminName');
    if (adminName && currentUser) adminName.textContent = currentUser.username;
}
// ========== CUSTOMER PAGE FUNCTIONS ==========

function initializeCustomerPage() {
    console.log('📄 Customer page initializing...');
    
    // --- Sanity checks ---
    if (!Array.isArray(menuItems)) menuItems = [];
    if (!Array.isArray(categories)) categories = [];
    if (!Array.isArray(orders)) orders = [];
    if (!Array.isArray(cart)) cart = [];
    if (!settings || typeof settings !== 'object') {
        settings = { hotelName: 'Royal Hotel', currency: '$', taxRate: 10 };
    }
    
    // --- Normalize data types (in case localStorage had bad data) ---
    if (typeof normalizeMenuItems === 'function') normalizeMenuItems();
    if (typeof normalizeCart === 'function') normalizeCart();
    if (typeof normalizeOrders === 'function') normalizeOrders();
    
    console.log('After normalize:', menuItems.length, 'items |', orders.length, 'orders');
    
    // --- Render everything, and LOG if containers are missing ---
    if (document.getElementById('menuGrid')) {
        renderMenuItems();
        console.log('✅ Rendered menu items');
    } else {
        console.warn('⚠️ #menuGrid not found in HTML');
    }
    
    if (document.getElementById('categoryFilter')) {
        renderCategories();
        console.log('✅ Rendered categories');
    }
    
    if (document.getElementById('specialsGrid')) {
        renderSpecials();
        console.log('✅ Rendered specials. Specials count:',
            menuItems.filter(i => i.isSpecial === true || i.isSpecial === 'true').length);
    } else {
        console.warn('⚠️ #specialsGrid not found in HTML');
    }
    
    if (document.getElementById('trackingOrders')) {
        renderOrderTracking();
        console.log('✅ Rendered order tracking');
    }
    
    updateCartCount();
    
    // --- Show table banner if QR scanned ---
    try {
        const urlTable = typeof getTableFromURL === 'function' ? getTableFromURL() : null;
        if (urlTable && typeof showTableBanner === 'function') {
            showTableBanner(urlTable);
        }
    } catch (e) { /* ignore */ }
    
    setupEventListeners();
    console.log('📄 Customer page ready.');
}

function renderMenuItems() {
    const menuGrid = document.getElementById('menuGrid');
    if (!menuGrid) return;
    
    // Read filters safely
    const sortByEl = document.getElementById('sortBy');
    const categoryEl = document.getElementById('categorySelect');
    const searchEl = document.getElementById('searchInput');
    
    const sortBy = sortByEl ? sortByEl.value : 'name';
    const categoryFilter = categoryEl ? categoryEl.value : 'all';
    const searchTerm = searchEl ? searchEl.value.toLowerCase().trim() : '';
    
    // Start with all items, but only AVAILABLE ones
    let filteredItems = menuItems.filter(item => item.isAvailable !== false);
    
    // Filter by category
    if (categoryFilter && categoryFilter !== 'all') {
        filteredItems = filteredItems.filter(item => item.category === categoryFilter);
    }
    
    // Filter by search
    if (searchTerm) {
        filteredItems = filteredItems.filter(item =>
            (item.name || '').toLowerCase().includes(searchTerm) ||
            (item.description || '').toLowerCase().includes(searchTerm) ||
            (item.category || '').toLowerCase().includes(searchTerm)
        );
    }
    
    // Sort
    const sortKey = sortBy || 'name';
    switch (sortKey) {
        case 'price-low':
            filteredItems.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredItems.sort((a, b) => b.price - a.price);
            break;
        case 'newest':
            filteredItems.sort((a, b) => 
                new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
            );
            break;
        default:
            filteredItems.sort((a, b) => 
                (a.name || '').localeCompare(b.name || '')
            );
    }
    
    if (filteredItems.length === 0) {
        menuGrid.innerHTML = `
            <div class="no-items" style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#666;">
                <i class="fas fa-utensils" style="font-size:48px;color:#ccc;display:block;margin-bottom:15px;"></i>
                <p>${menuItems.length === 0 
                    ? 'No menu items available yet.' 
                    : 'No items match your filters.'}</p>
            </div>
        `;
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
                        <button class="btn-cart" onclick="addToCart(${item.id})" 
                                ${!item.isAvailable ? 'disabled style="opacity:0.5"' : ''}>
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                ${item.prepTime ? `<div class="prep-time"><i class="fas fa-clock"></i> ${item.prepTime} min</div>` : ''}
            </div>
        </div>
    `).join('');
}

// Small helper to prevent HTML injection in item names/descriptions
function escapeHTML(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function renderCategories() {
    console.log('Rendering categories...');
    const categoryFilter = document.getElementById('categoryFilter');
    const categorySelect = document.getElementById('categorySelect');
    
    if (categoryFilter) {
        categoryFilter.innerHTML = `
            <button class="category-btn active" data-category="all" onclick="filterByCategory('all')">
                <i class="fas fa-all"></i> All
            </button>
            ${categories.map(cat => `
                <button class="category-btn" data-category="${cat.name}" onclick="filterByCategory('${cat.name}')">
                    <i class="${cat.icon}"></i> ${cat.name}
                </button>
            `).join('')}
        `;
    }
    
    if (categorySelect) {
        categorySelect.innerHTML = `
            <option value="all">All Categories</option>
            ${categories.map(cat => `
                <option value="${cat.name}">${cat.name}</option>
            `).join('')}
        `;
    }
}
  

// ========== TABLE MANAGEMENT ==========

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
            </div>
        `;
        return;
    }
    
    grid.innerHTML = tables.map(table => {
        // Count active orders for this table
        const activeOrders = orders.filter(o => 
            o.tableNumber === table.number && 
            o.status !== 'completed' && 
            o.status !== 'cancelled'
        ).length;
        
        return `
            <div class="table-card">
                <div class="table-card-header">
                    <div class="table-icon">
                        <i class="fas fa-chair"></i>
                    </div>
                    <div class="table-card-info">
                        <h4>${table.number}</h4>
                        <span class="table-meta">
                            <i class="fas fa-users"></i> ${table.capacity} seats
                            ${table.location ? ` • <i class="fas fa-map-marker-alt"></i> ${table.location}` : ''}
                        </span>
                    </div>
                    ${activeOrders > 0 ? `<span class="active-orders-badge">${activeOrders} active</span>` : ''}
                </div>
                
                ${table.notes ? `<p class="table-notes"><i class="fas fa-info-circle"></i> ${table.notes}</p>` : ''}
                
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
    // Get the base URL (works for file://, http://, and hosted)
    const baseUrl = window.location.href.split('?')[0].split('#')[0];
    const menuUrl = baseUrl.includes('admin.html') 
        ? baseUrl.replace('admin.html', 'index.html')
        : baseUrl;
    
    return `${menuUrl}?table=${encodeURIComponent(table.number)}`;
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
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
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
    
    // Check for duplicates
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

// ========== QR CODE GENERATION ==========

let currentQRTable = null;

function showQRCode(tableId) {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    currentQRTable = table;
    
    document.getElementById('qrTableName').textContent = table.number;
    document.getElementById('qrTableMeta').innerHTML = 
        `<i class="fas fa-users"></i> ${table.capacity} seats` +
        (table.location ? ` • <i class="fas fa-map-marker-alt"></i> ${table.location}` : '');
    
    const container = document.getElementById('qrCodeContainer');
    container.innerHTML = '';
    
    if (typeof QRCode === 'undefined') {
        container.innerHTML = '<p style="color:#e74c3c;">QR library not loaded. Check your internet connection.</p>';
        document.getElementById('qrModal').classList.add('show');
        return;
    }
    
    // Generate QR code
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

function downloadQRCode() {
    const container = document.getElementById('qrCodeContainer');
    const canvas = container.querySelector('canvas');
    const img = container.querySelector('img');
    
    if (!currentQRTable) return;
    
    let dataUrl;
    
    if (canvas) {
        dataUrl = canvas.toDataURL('image/png');
    } else if (img && img.src.startsWith('data:')) {
        dataUrl = img.src;
    } else {
        showToast('QR code not ready. Try again.', 'error');
        return;
    }
    
    const link = document.createElement('a');
    link.download = `QR-${currentQRTable.number.replace(/\s+/g, '-')}.png`;
    link.href = dataUrl;
    link.click();
    
    showToast('QR code downloaded!', 'success');
}

function printQRCode() {
    const container = document.getElementById('qrCodeContainer');
    const canvas = container.querySelector('canvas');
    const img = container.querySelector('img');
    
    if (!currentQRTable) return;
    
    let dataUrl;
    if (canvas) {
        dataUrl = canvas.toDataURL('image/png');
    } else if (img && img.src.startsWith('data:')) {
        dataUrl = img.src;
    } else {
        showToast('QR code not ready', 'error');
        return;
    }
    
    const win = window.open('', '_blank');
    win.document.write(`
        <html>
        <head>
            <title>Print QR - ${currentQRTable.number}</title>
            <style>
                body {
                    font-family: 'Poppins', Arial, sans-serif;
                    text-align: center;
                    padding: 40px;
                }
                .card {
                    border: 3px solid #2c3e50;
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 450px;
                    margin: 0 auto;
                }
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
                <h1>🍽️ Royal Hotel</h1>
                <h2>${currentQRTable.number}</h2>
                <img src="${dataUrl}" alt="QR Code">
                <p class="scan-text">📱 Scan to view menu & order</p>
                <p>Point your phone camera at the QR code</p>
                <div class="footer">Capacity: ${currentQRTable.capacity} seats${currentQRTable.location ? ' • ' + currentQRTable.location : ''}</div>
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
    if (tables.length === 0) {
        showToast('No tables to print', 'error');
        return;
    }
    
    if (typeof QRCode === 'undefined') {
        showToast('QR library not loaded', 'error');
        return;
    }
    
    // Build QR data URLs for each table
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
                <h1>🍽️ Royal Hotel</h1>
                <h2>${table.number}</h2>
                <img src="${dataUrl}" alt="QR">
                <p class="scan-text">📱 Scan to view menu & order</p>
                <div class="footer">Capacity: ${table.capacity} seats${table.location ? ' • ' + table.location : ''}</div>
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
                        border: 3px solid #2c3e50;
                        border-radius: 20px;
                        padding: 30px;
                        text-align: center;
                        page-break-inside: avoid;
                        display: inline-block;
                        width: 300px;
                        margin: 10px;
                        vertical-align: top;
                    }
                    h1 { font-size: 20px; margin: 0 0 8px; color: #2c3e50; }
                    h2 { font-size: 18px; margin: 0 0 12px; color: #3498db; }
                    img { width: 240px; height: 240px; margin: 10px 0; }
                    .scan-text { font-size: 14px; font-weight: 600; color: #2c3e50; margin-top: 10px; }
                    .footer { font-size: 11px; color: #999; margin-top: 10px; }
                    @media print {
                        .card { page-break-inside: avoid; }
                    }
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

// ========== READ TABLE NUMBER FROM URL ==========

function getTableFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('table');
}








function renderSpecials() {
    const specialsGrid = document.getElementById('specialsGrid');
    if (!specialsGrid) return;
    
    // ✅ Accept boolean `true` OR string `"true"`, exclude unavailable items
    const specialItems = menuItems.filter(item => 
        (item.isSpecial === true || item.isSpecial === 'true') &&
        item.isAvailable !== false
    );
    
    if (specialItems.length === 0) {
        specialsGrid.innerHTML = `
            <p class="no-specials" style="grid-column:1/-1;text-align:center;color:rgba(255,255,255,0.7);padding:40px;">
                <i class="fas fa-star" style="font-size:32px;display:block;margin-bottom:10px;opacity:0.5;"></i>
                No specials available today. Check back soon!
            </p>
        `;
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

function filterMenu() {
    renderMenuItems();
}

function filterByCategory(category) {
    console.log('Filtering by category:', category);
    
    // Update active button
    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach(btn => {
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update select
    const categorySelect = document.getElementById('categorySelect');
    if (categorySelect) {
        categorySelect.value = category === 'all' ? 'all' : category;
    }
    
    renderMenuItems();
}

function setupEventListeners() {
    console.log('🔗 setupEventListeners()');
    
    // NOTE: Cart icon is handled via inline onclick="toggleCart()" in HTML.
    // Do NOT add another listener here — it would fire twice.
    
    // ---- Close cart button ----
    const closeBtn = document.querySelector('.close-cart');
    if (closeBtn) {
        closeBtn.onclick = function (e) {
            e.preventDefault();
            closeCart();
        };
    }
    
    // ---- Checkout button ----
    const checkoutBtn = document.querySelector('.btn-checkout');
    if (checkoutBtn) {
        checkoutBtn.onclick = function (e) {
            e.preventDefault();
            checkout();
        };
    }
    
    // ---- Search input ----
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterMenu);
    }
    
    // ---- Dropdowns ----
    const sortBy = document.getElementById('sortBy');
    if (sortBy) sortBy.addEventListener('change', renderMenuItems);
    
    const categorySelect = document.getElementById('categorySelect');
    if (categorySelect) categorySelect.addEventListener('change', renderMenuItems);
    
    console.log('🔗 Event listeners attached');
}
// Cart Functions
function addToCart(itemId) {
    console.log('addToCart called with:', itemId);
    
    // Find the item (normalize id type)
    const numericId = Number(itemId);
    const item = menuItems.find(i => Number(i.id) === numericId);
    
    if (!item) {
        console.warn('Item not found in menuItems:', itemId);
        showToast('Item not found', 'error');
        return;
    }
    
    if (item.isAvailable === false || item.isAvailable === 'false') {
        showToast('This item is currently unavailable', 'error');
        return;
    }
    
    // Look for existing cart entry
    const existing = cart.find(i => Number(i.id) === numericId);
    
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: Number(item.id),
            name: item.name,
            price: Number(item.price) || 0,
            image: item.image || '',
            category: item.category || '',
            quantity: 1
        });
    }
    
    saveCart();
    updateCartCount();
    showToast(`${item.name} added to cart!`, 'success');
    
    // Refresh cart display if the sidebar is open
    const sidebar = document.getElementById('cartSidebar');
    if (sidebar && sidebar.classList.contains('open')) {
        renderCartItems();
    }
}

function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    if (!cartCount) return;   // admin page has no cart badge
    
    const total = Array.isArray(cart)
        ? cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
        : 0;
    
    cartCount.textContent = total;
    // Optional: hide badge when 0
    cartCount.style.display = total > 0 ? 'flex' : 'none';
}

function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    if (!sidebar) return;
    sidebar.classList.toggle('open');
    if (sidebar.classList.contains('open')) {
        renderCartItems();
    }
}

function closeCart() {
    const sidebar = document.getElementById('cartSidebar');
    if (sidebar) sidebar.classList.remove('open');
}

function openCart() {
    const sidebar = document.getElementById('cartSidebar');
    if (sidebar) {
        sidebar.classList.add('open');
        renderCartItems();
    }
}
function renderCartItems() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    if (!cartItems || !cartTotal) return;
    
    // Guard against malformed cart
    if (!Array.isArray(cart)) cart = [];
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart" style="text-align:center;padding:60px 20px;color:#999;">
                <i class="fas fa-shopping-basket" style="font-size:48px;color:#ddd;display:block;margin-bottom:15px;"></i>
                <p>Your cart is empty</p>
                <p style="font-size:13px;margin-top:8px;">Add items from the menu to get started.</p>
            </div>
        `;
        cartTotal.textContent = '0.00';
        return;
    }
    
    const currency = (settings && settings.currency) || '$';
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <div class="cart-item-image">
                <img src="${item.image || getDefaultImage()}" 
                     alt="${item.name}"
                     onerror="this.src='${getDefaultImage()}'">
            </div>
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <div class="cart-item-price">${currency}${(item.price || 0).toFixed(2)}</div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, -1)">−</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, 1)">+</button>
                </div>
            </div>
            <div class="cart-item-actions">
                <button class="remove-item" onclick="removeFromCart(${item.id})" title="Remove">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    const total = cart.reduce(
        (sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 0)),
        0
    );
    cartTotal.textContent = total.toFixed(2);
}
function updateCartQuantity(itemId, change) {
    const numericId = Number(itemId);
    const item = cart.find(i => Number(i.id) === numericId);
    if (!item) return;
    
    item.quantity = (Number(item.quantity) || 0) + change;
    
    if (item.quantity <= 0) {
        removeFromCart(numericId);
        return;
    }
    
    saveCart();
    updateCartCount();
    renderCartItems();
}

function removeFromCart(itemId) {
    const numericId = Number(itemId);
    const before = cart.length;
    cart = cart.filter(i => Number(i.id) !== numericId);
    
    if (cart.length === before) return;   // nothing removed
    
    saveCart();
    updateCartCount();
    renderCartItems();
    showToast('Item removed from cart', 'info');
}

function clearCart() {
    if (!confirm('Clear all items from your cart?')) return;
    cart = [];
    saveCart();
    updateCartCount();
    renderCartItems();
    showToast('Cart cleared', 'info');
}

// ========== CHECKOUT FLOW ==========

function checkout() {
    if (!Array.isArray(cart) || cart.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
    }
    
    const modal = document.getElementById('checkoutModal');
    if (!modal) {
        // Fallback if modal is missing — go straight through
        confirmCheckout();
        return;
    }
    
    // Build mini summary
    const total = cart.reduce(
        (sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 0)),
        0
    );
    const currency = (settings && settings.currency) || '$';
    
    const summary = document.getElementById('checkoutSummary');
    if (summary) {
        summary.innerHTML = `
            <div style="background:#f8f9fa;padding:15px;border-radius:10px;margin-top:15px;">
                <strong>Order Summary (${cart.reduce((s,i)=>s+(Number(i.quantity)||0),0)} items)</strong>
                ${cart.map(i => `
                    <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:14px;">
                        <span>${i.name} × ${i.quantity}</span>
                        <span>${currency}${((Number(i.price)||0) * (Number(i.quantity)||0)).toFixed(2)}</span>
                    </div>
                `).join('')}
                <div style="display:flex;justify-content:space-between;margin-top:12px;padding-top:12px;border-top:2px solid #ddd;font-size:16px;">
                    <strong>Total:</strong>
                    <strong style="color:#3498db;">${currency}${total.toFixed(2)}</strong>
                </div>
            </div>
        `;
    }
    
    // Pre-fill from URL (QR scan) and remembered name
    const tableInput = document.getElementById('tableNumber');
    const badge = document.getElementById('tableBadge');
    if (badge) badge.remove();   // clean old badge if reopening
    
    const urlTable = typeof getTableFromURL === 'function' ? getTableFromURL() : null;
    if (urlTable && tableInput) {
        tableInput.value = urlTable;
        tableInput.setAttribute('readonly', true);
        tableInput.style.background = '#e8f5e9';
        tableInput.style.cursor = 'not-allowed';
        
        const badgeEl = document.createElement('div');
        badgeEl.id = 'tableBadge';
        badgeEl.style.cssText = 'background:#d4edda;color:#155724;padding:8px 12px;border-radius:8px;font-size:13px;margin-bottom:10px;display:flex;align-items:center;gap:8px;';
        badgeEl.innerHTML = `<i class="fas fa-qrcode"></i> Table auto-detected from QR: <strong>${urlTable}</strong>`;
        tableInput.parentElement.insertBefore(badgeEl, tableInput);
    } else if (tableInput) {
        tableInput.removeAttribute('readonly');
        tableInput.style.background = '';
        tableInput.style.cursor = '';
    }
    
    const savedName = localStorage.getItem('hotelCustomerName');
    const nameInput = document.getElementById('customerName');
    if (savedName && nameInput && !nameInput.value) {
        nameInput.value = savedName;
    }
    
    modal.classList.add('show');
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) modal.classList.remove('show');
}

function confirmCheckout() {
    if (!Array.isArray(cart) || cart.length === 0) {
        showToast('Your cart is empty', 'error');
        closeCheckoutModal();
        return;
    }
    
    const tableInput = document.getElementById('tableNumber');
    const nameInput = document.getElementById('customerName');
    const notesInput = document.getElementById('orderNotes');
    
    const tableNumber = tableInput ? tableInput.value.trim() : '';
    const customerName = nameInput ? nameInput.value.trim() : '';
    const orderNotes = notesInput ? notesInput.value.trim() : '';
    
    if (!tableNumber) {
        showToast('Please enter your table/sit number', 'error');
        return;
    }
    
    // Remember customer name
    if (customerName) {
        localStorage.setItem('hotelCustomerName', customerName);
    }
    
    // Build the order
    const order = {
        id: Date.now(),
        tableNumber: tableNumber,
        customerName: customerName || 'Guest',
        notes: orderNotes,
        items: cart.map(item => ({
            id: Number(item.id),
            name: item.name,
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1
        })),
        total: cart.reduce(
            (sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 0)),
            0
        ),
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Save to orders
    if (!Array.isArray(orders)) orders = [];
    orders.push(order);
    saveOrders();
    
    // Clear the cart
    cart = [];
    saveCart();
    updateCartCount();
    renderCartItems();
    closeCart();
    closeCheckoutModal();
    
    // Reset inputs (except the table, which we keep from URL)
    if (nameInput) nameInput.value = '';
    if (notesInput) notesInput.value = '';
    
    showToast(`✅ Order placed! Table ${tableNumber}. We'll notify you when it's ready.`, 'success');
    
    // Refresh customer tracking
    if (typeof renderOrderTracking === 'function') {
        renderOrderTracking();
    }
    
    // Scroll to tracking
    setTimeout(() => {
        const tracking = document.getElementById('orderTracking');
        if (tracking) tracking.scrollIntoView({ behavior: 'smooth' });
    }, 500);
}
////

// ========== CUSTOMER ORDER TRACKING ==========
function renderOrderTracking() {
    const container = document.getElementById('trackingOrders');
    if (!container) {
        console.warn('trackingOrders container not found');
        return;
    }
    
    // Filter out old cancelled/completed orders if desired (optional)
    // Keep last 10 orders sorted by newest
    const sortedOrders = [...orders].sort((a, b) => 
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    ).slice(0, 10);
    
    if (sortedOrders.length === 0) {
        container.innerHTML = `
            <div class="no-orders-message">
                <i class="fas fa-receipt" style="font-size:48px;color:#ccc;display:block;margin-bottom:15px;"></i>
                <p>You haven't placed any orders yet.</p>
                <p style="font-size:14px;color:#999;">Add items to your cart and checkout to see them here.</p>
            </div>
        `;
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
            </div>
        </div>
    `).join('');
}

function getStatusLabel(status) {
    const labels = {
        'pending': 'Pending',
        'preparing': 'Preparing',
        'ready': 'Ready',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    };
    return labels[status] || status;
}

function renderProgressBar(status) {
    const steps = ['pending', 'preparing', 'ready', 'completed'];
    
    // If cancelled, show a cancelled banner instead
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
        'pending': 'fa-clock',
        'preparing': 'fa-fire',
        'ready': 'fa-bell',
        'completed': 'fa-check'
    };
    return icons[step] || 'fa-circle';
}

 




// ========== ADMIN PAGE FUNCTIONS ==========
function initializeAdminPage() {
    console.log('🔧 Admin page initializing...');
    
    // Ensure data is loaded
    if (!Array.isArray(menuItems)) menuItems = [];
    if (!Array.isArray(categories)) categories = [];
    if (!Array.isArray(orders)) orders = [];
    if (!Array.isArray(tables)) tables = [];
    
    if (typeof normalizeMenuItems === 'function') normalizeMenuItems();
    if (typeof normalizeOrders === 'function') normalizeOrders();
    
    console.log('Admin data:', menuItems.length, 'items |', orders.length, 'orders |', tables.length, 'tables');
    
    // Show login or panel
    if (currentUser) {
        showAdminPanel();
    }
    
    setupAdminEventListeners();
}
function adminLogin() {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    // Default admin credentials (in production, use proper authentication)
    if (username === 'admin' && password === 'admin123') {
        currentUser = { username: 'admin', loggedInAt: new Date().toISOString() };
        localStorage.setItem('hotelMenuAdmin', JSON.stringify(currentUser));
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
    
    // Set admin name
    const adminName = document.getElementById('adminName');
    if (adminName && currentUser) adminName.textContent = currentUser.username || 'Administrator';
    
    // Force-load fresh orders from localStorage (in case another tab just wrote)
    try {
        const savedOrders = localStorage.getItem('hotelMenuOrders');
        if (savedOrders) {
            orders = JSON.parse(savedOrders) || [];
            if (typeof normalizeOrders === 'function') normalizeOrders();
            console.log('🔄 Reloaded orders from localStorage:', orders.length);
        }
    } catch (e) {
        console.error('Failed to reload orders:', e);
    }
    
    // Render everything
    updateAdminStats();
    
    if (document.getElementById('menuItemsTable'))     renderMenuItemsTable();
    if (document.getElementById('adminCategoriesGrid')) renderAdminCategories();
    if (document.getElementById('ordersList'))         renderOrdersList();
    if (document.getElementById('tablesGrid'))         renderTablesGrid();
    
    loadSettings();
    
    console.log('🔧 Admin panel ready. Orders:', orders.length);
}

function logoutAdmin() {
    currentUser = null;
    localStorage.removeItem('hotelMenuAdmin');
    
    const loginForm = document.getElementById('loginForm');
    const adminPanel = document.getElementById('adminPanel');
    
    if (loginForm) loginForm.style.display = 'block';
    if (adminPanel) adminPanel.style.display = 'none';
    
    // Clear form
    document.getElementById('adminPassword').value = '';
}
function showSection(sectionId, btnElement) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.admin-nav button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    const section = document.getElementById(sectionId + 'Section');
    if (section) {
        section.classList.add('active');
        
        // Load section-specific data
        if (sectionId === 'orders') renderOrdersList();
        if (sectionId === 'menu') renderMenuItemsTable();
        if (sectionId === 'categories') renderAdminCategories();
        if (sectionId === 'dashboard') updateAdminStats();
    }
    
    // Add active class to clicked button
    if (btnElement) {
        btnElement.classList.add('active');
    }
}
function updateAdminStats() {
    document.getElementById('totalItems').textContent = menuItems.length;
    document.getElementById('totalCategories').textContent = categories.length;
    document.getElementById('totalSpecials').textContent = menuItems.filter(item => item.isSpecial).length;
    document.getElementById('totalTables').textContent = tables.length;
    // Count today's orders
    const today = new Date().toDateString();
    const todayOrders = orders.filter(order => 
        new Date(order.createdAt).toDateString() === today
    ).length;
    document.getElementById('todayOrders').textContent = todayOrders;
}

function renderMenuItemsTable() {
    const tableBody = document.getElementById('menuItemsTable');
    if (!tableBody) return;
    
    if (menuItems.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No menu items found. Add your first item!</td></tr>';
        return;
    }
    
    tableBody.innerHTML = menuItems.map(item => `
        <tr>
            <td>
                <div class="item-image-small">
                    <img src="${item.image || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80'}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80'">
                </div>
            </td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${settings.currency || '$'}${item.price.toFixed(2)}</td>
            <td>${item.isSpecial ? '<span class="status-available">Yes</span>' : 'No'}</td>
            <td>
                <span class="${item.isAvailable ? 'status-available' : 'status-unavailable'}">
                    ${item.isAvailable ? 'Available' : 'Unavailable'}
                </span>
            </td>
            <td>
                <button class="btn-action btn-edit" onclick="editItem(${item.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action btn-delete" onclick="deleteItem(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

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
            <h4>${cat.name}</h4>
            <p>${cat.description}</p>
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

function openAddItemModal() {
    const modal = document.getElementById('addItemModal');
    const form = document.getElementById('itemForm');
    const categorySelect = document.getElementById('itemCategory');
    
    // Reset form
    form.reset();
    
    // Populate categories
    categorySelect.innerHTML = categories.map(cat => `
        <option value="${cat.name}">${cat.name}</option>
    `).join('');
    
    // Set title
    document.querySelector('#addItemModal h3').innerHTML = '<i class="fas fa-plus"></i> Add New Menu Item';
    
    // Show modal
    modal.classList.add('show');
    modal.dataset.mode = 'add';
}

function openEditItemModal(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    
    const modal = document.getElementById('addItemModal');
    const form = document.getElementById('itemForm');
    const categorySelect = document.getElementById('itemCategory');
    
    // Populate form
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemDescription').value = item.description;
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemImage').value = item.image || '';
    document.getElementById('itemPrepTime').value = item.prepTime || 15;
    document.getElementById('itemSpecial').checked = item.isSpecial;
    document.getElementById('itemAvailable').checked = item.isAvailable;
    
    // Populate categories
    categorySelect.innerHTML = categories.map(cat => `
        <option value="${cat.name}" ${cat.name === item.category ? 'selected' : ''}>${cat.name}</option>
    `).join('');
    
    // Set title
    document.querySelector('#addItemModal h3').innerHTML = '<i class="fas fa-edit"></i> Edit Menu Item';
    
    // Show modal
    modal.classList.add('show');
    modal.dataset.mode = 'edit';
    modal.dataset.itemId = itemId;
}

function saveItem(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
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
    
    // Validation
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
    } else {
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
    }, 1000);
    
    renderMenuItemsTable();
    updateAdminStats();
    
    return false;
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

function editItem(itemId) {
    openEditItemModal(itemId);
}

function openAddCategoryModal() {
    const modal = document.getElementById('addCategoryModal');
    const form = document.getElementById('categoryForm');
    
    // Reset form
    form.reset();
    
    // Set title
    document.querySelector('#addCategoryModal h3').innerHTML = '<i class="fas fa-plus"></i> Add New Category';
    
    // Show modal
    modal.classList.add('show');
    modal.dataset.mode = 'add';
}

function saveCategory(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
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
function deleteCategory(categoryId) {
    if (!confirm('Are you sure you want to delete this category? Items in this category will be moved to "Uncategorized".')) return;
    
    const index = categories.findIndex(c => c.id === categoryId);
    if (index !== -1) {
        // Move items to first available category or create "Uncategorized"
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

function editCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    const modal = document.getElementById('addCategoryModal');
    const form = document.getElementById('categoryForm');
    
    // Populate form
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categoryDescription').value = category.description || '';
    document.getElementById('categoryIcon').value = category.icon || 'fas fa-tag';
    
    // Set title
    document.querySelector('#addCategoryModal h3').innerHTML = '<i class="fas fa-edit"></i> Edit Category';
    
    // Show modal
    modal.classList.add('show');
    modal.dataset.mode = 'edit';
    modal.dataset.categoryId = categoryId;
}

function loadSettings() {
    if (!settings) return;
    
    document.getElementById('hotelName').value = settings.hotelName || 'Royal Hotel';
    document.getElementById('currency').value = settings.currency || '$';
    document.getElementById('taxRate').value = settings.taxRate || 10;
}

function saveSettings() {
    settings.hotelName = document.getElementById('hotelName').value.trim();
    settings.currency = document.getElementById('currency').value;
    settings.taxRate = parseFloat(document.getElementById('taxRate').value) || 10;
    
    saveSettings();
    showToast('Settings saved successfully!', 'success');
}

function setupAdminEventListeners() {
    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
}

// ========== UTILITY FUNCTIONS ==========

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

function togglePassword(inputId, icon) {
    const input = document.getElementById(inputId);
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
// ========== ORDER FUNCTIONS ==========

function renderOrdersList() {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<div class="no-orders">No orders yet</div>';
        return;
    }
    
    // Sort orders by date (newest first)
    const sortedOrders = [...orders].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    ordersList.innerHTML = sortedOrders.map(order => `
        <div class="order-card" data-order-id="${order.id}">
            <div class="order-info">
                <div class="order-header">
                    <div>
                        <h4>
                            <i class="fas fa-chair"></i> ${order.tableNumber || 'No Table'}
                            <span class="order-id">#${order.id.toString().slice(-6)}</span>
                        </h4>
                        <span class="order-time">
                            ${order.customerName ? `<i class="fas fa-user"></i> ${order.customerName} • ` : ''}
                            ${formatDate(order.createdAt)}
                        </span>
                    </div>
                    <span class="tracking-status status-${order.status}">
                        ${getStatusLabel(order.status)}
                    </span>
                </div>
                
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <span>${item.name} × ${item.quantity}</span>
                            <span>${settings.currency || '$'}${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                
                ${order.notes ? `<div class="order-notes"><i class="fas fa-sticky-note"></i> ${order.notes}</div>` : ''}
                
                <div class="order-total">
                    <strong>Total:</strong>
                    <strong>${settings.currency || '$'}${order.total.toFixed(2)}</strong>
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

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function updateOrderStatus(orderId, status) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const oldStatus = order.status;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    saveOrders();
    
    // Manually trigger storage event for the same-tab case is not needed,
    // but we call renderOrdersList to refresh admin UI
    renderOrdersList();
    updateAdminStats();
    
    // Show a helpful toast
    const statusLabels = {
        'pending': 'Pending',
        'preparing': 'Preparing 🔥',
        'ready': 'Ready 🔔',
        'completed': 'Completed ✅',
        'cancelled': 'Cancelled ❌'
    };
    
    showToast(
        `Table ${order.tableNumber}: Order #${orderId.toString().slice(-6)} → ${statusLabels[status]}`,
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

// Update the showSection function to load orders when that section is opened
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.admin-nav button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    const section = document.getElementById(sectionId + 'Section');
    if (section) {
        section.classList.add('active');
        
        // If showing orders section, render orders
        if (sectionId === 'orders') {
            renderOrdersList();
        }
    }
    
    // Add active class to clicked button
    event.target.classList.add('active');
}
// Show welcome banner if table detected from QR
const urlTable = getTableFromURL();
if (urlTable) {
    showTableBanner(urlTable);
}

function showTableBanner(tableNumber) {
    // Remove existing banner
    const existing = document.getElementById('tableWelcomeBanner');
    if (existing) existing.remove();
    
    const banner = document.createElement('div');
    banner.id = 'tableWelcomeBanner';
    banner.innerHTML = `
        <div class="container">
            <i class="fas fa-chair"></i>
            <span>Welcome to <strong>${tableNumber}</strong>! Browse the menu and place your order — your table is already set.</span>
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
// Update the initializeAdminPage function
function initializeAdminPage() {
    console.log('Initializing admin page');
    // Check if user is already logged in
    if (currentUser) {
        showAdminPanel();
    }
    
    // Setup admin event listeners
    setupAdminEventListeners();
    
    // Initialize orders if not exists
    if (!orders || orders.length === 0) {
        // Add some sample orders for testing
        orders = [
            {
                id: 1001,
                items: [
                    { id: 1, name: 'Grilled Salmon', price: 24.99, quantity: 2 },
                    { id: 3, name: 'Chocolate Lava Cake', price: 8.99, quantity: 1 }
                ],
                total: 58.97,
                status: 'completed',
                createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                updatedAt: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: 1002,
                items: [
                    { id: 4, name: 'Beef Burger', price: 16.99, quantity: 1 },
                    { id: 2, name: 'Caesar Salad', price: 12.99, quantity: 1 }
                ],
                total: 29.98,
                status: 'preparing',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        saveOrders();
    }
}

// Image Handling Functions
function updateImagePreview(imageUrl) {
    const previewImage = document.getElementById('previewImage');
    const imagePlaceholder = document.getElementById('imagePlaceholder');
    const imageInput = document.getElementById('itemImage');
    
    // Clear validation first
    const existingValidation = document.querySelector('.image-validation');
    if (existingValidation) existingValidation.remove();
    
    if (!imageUrl) {
        // Empty input - just reset preview, don't show error
        resetImagePreview();
        return;
    }
    
    if (isValidImageUrl(imageUrl)) {
        previewImage.src = imageUrl;
        previewImage.classList.add('loaded');
        imagePlaceholder.classList.add('hidden');
        imageInput.value = imageUrl;
        showImageValidation('valid', 'Image URL is valid');
    } else {
        previewImage.classList.remove('loaded');
        imagePlaceholder.classList.remove('hidden');
        imageInput.value = '';
        showImageValidation('invalid', 'Invalid image URL');
    }
}

function handleImageUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB', 'error');
        return;
    }
    
    // Create a FileReader to read the image
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const imageUrl = e.target.result;
        updateImagePreview(imageUrl);
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

function isValidImageUrl(url) {
    // Simple URL validation
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

function showImageValidation(type, message) {
    // Remove existing validation
    const existingValidation = document.querySelector('.image-validation');
    if (existingValidation) {
        existingValidation.remove();
    }
    
    // Create new validation element
    const validation = document.createElement('div');
    validation.className = `image-validation ${type}`;
    validation.innerHTML = `
        <i class="fas fa-${type === 'valid' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add after image preview
    const container = document.querySelector('.image-upload-container');
    if (container) {
        container.appendChild(validation);
    }
}

// Update the openAddItemModal function to reset image preview
function openAddItemModal() {
    console.log('Opening add item modal');
    
    const modal = document.getElementById('addItemModal');
    const form = document.getElementById('itemForm');
    const categorySelect = document.getElementById('itemCategory');
    
    // Reset form
    if (form) {
        form.reset();
        // Set default values
        document.getElementById('itemPrepTime').value = 15;
        document.getElementById('itemAvailable').checked = true;
    }
    
    // Reset image preview
    resetImagePreview();
    
    // Populate categories dropdown
    if (categorySelect) {
        categorySelect.innerHTML = categories.map(cat => `
            <option value="${cat.name}">${cat.name}</option>
        `).join('');
    }
    
    // Set modal title
    const modalTitle = modal.querySelector('h3');
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-plus"></i> Add New Menu Item';
    }
    
    // Set modal mode
    modal.dataset.mode = 'add';
    modal.dataset.itemId = '';
    
    // Show modal
    modal.classList.add('show');
    
    console.log('Add item modal opened');
}

// Update the openEditItemModal function to show existing image
function openEditItemModal(itemId) {
    console.log('Opening edit modal for item:', itemId);
    
    const item = menuItems.find(i => i.id === itemId);
    if (!item) {
        showToast('Item not found', 'error');
        return;
    }
    
    const modal = document.getElementById('addItemModal');
    const categorySelect = document.getElementById('itemCategory');
    
    // Fill form with item data
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemDescription').value = item.description;
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemPrepTime').value = item.prepTime || 15;
    document.getElementById('itemSpecial').checked = item.isSpecial;
    document.getElementById('itemAvailable').checked = item.isAvailable;
    
    // Set image
    if (item.image) {
        updateImagePreview(item.image);
        document.getElementById('itemImageUrl').value = item.image;
    } else {
        resetImagePreview();
    }
    
    // Populate categories
    if (categorySelect) {
        categorySelect.innerHTML = categories.map(cat => `
            <option value="${cat.name}" ${cat.name === item.category ? 'selected' : ''}>${cat.name}</option>
        `).join('');
    }
    
    // Set modal title
    const modalTitle = modal.querySelector('h3');
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Menu Item';
    }
    
    // Set modal mode
    modal.dataset.mode = 'edit';
    modal.dataset.itemId = itemId;
    
    // Show modal
    modal.classList.add('show');
    
    console.log('Edit item modal opened');
}

function resetImagePreview() {
    const previewImage = document.getElementById('previewImage');
    const imagePlaceholder = document.getElementById('imagePlaceholder');
    const imageInput = document.getElementById('itemImage');
    const imageUrlInput = document.getElementById('itemImageUrl');
    const fileInput = document.getElementById('itemImageFile');
    const sampleSelect = document.getElementById('sampleImages');
    
    // Reset preview
    previewImage.src = '';
    previewImage.classList.remove('loaded');
    imagePlaceholder.classList.remove('hidden');
    
    // Reset inputs
    imageInput.value = '';
    if (imageUrlInput) imageUrlInput.value = '';
    if (fileInput) fileInput.value = '';
    if (sampleSelect) sampleSelect.value = '';
    
    // Remove validation
    const validation = document.querySelector('.image-validation');
    if (validation) {
        validation.remove();
    }
}

// Update the saveItem function to handle image validation
function saveItem() {
    console.log('Saving item...');
    
    // Prevent any default form behavior
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const modal = document.getElementById('addItemModal');
    const mode = modal.dataset.mode;
    
    // Get image URL from hidden input
    const imageUrl = document.getElementById('itemImage').value.trim();
    
    // Get form values
    const itemData = {
        name: document.getElementById('itemName').value.trim(),
        description: document.getElementById('itemDescription').value.trim(),
        price: parseFloat(document.getElementById('itemPrice').value) || 0,
        category: document.getElementById('itemCategory').value,
        image: imageUrl, // Use the image URL from hidden input
        prepTime: parseInt(document.getElementById('itemPrepTime').value) || 15,
        isSpecial: document.getElementById('itemSpecial').checked,
        isAvailable: document.getElementById('itemAvailable').checked,
        createdAt: new Date().toISOString()
    };
    
    console.log('Item data:', itemData);
    console.log('Mode:', mode);
    
    // Validation
    if (!itemData.name) {
        showToast('Item name is required', 'error');
        return false;
    }
    
    if (itemData.price <= 0) {
        showToast('Price must be greater than 0', 'error');
        return false;
    }
    
    if (!itemData.category) {
        showToast('Category is required', 'error');
        return false;
    }
    
    // Image validation (optional but recommended)
    if (!itemData.image) {
        const useDefault = confirm('No image selected. Use default image?');
        if (useDefault) {
            itemData.image = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80';
        } else {
            showToast('Please select an image for the item', 'error');
            return false;
        }
    }
    
    let successMessage = '';
    
    if (mode === 'add') {
        // Add new item
        itemData.id = Date.now();
        menuItems.push(itemData);
        successMessage = `"${itemData.name}" added successfully!`;
        console.log('New item added with ID:', itemData.id);
    } else if (mode === 'edit') {
        // Edit existing item
        const itemId = parseInt(modal.dataset.itemId);
        const index = menuItems.findIndex(i => i.id === itemId);
        
        if (index !== -1) {
            itemData.id = itemId;
            itemData.createdAt = menuItems[index].createdAt; // Keep original date
            menuItems[index] = itemData;
            successMessage = `"${itemData.name}" updated successfully!`;
            console.log('Item updated:', itemData);
        } else {
            showToast('Item not found', 'error');
            return false;
        }
    }
    
    // Save to localStorage
    saveMenuItems();
    
    // Show success message
    showToast(successMessage, 'success');
    
    // Close modal after 1.5 seconds (so user can see the message)
    setTimeout(() => {
        closeModal();
        resetImagePreview(); // Reset for next use
    }, 1500);
    
    // Refresh displays
    renderMenuItemsTable();
    updateAdminStats();
    
    // If on customer page, refresh it too
    if (!window.location.pathname.includes('admin.html')) {
        renderMenuItems();
        renderSpecials();
        renderCategories();
    }
    
    console.log('Item saved successfully. Total items:', menuItems.length);
    
    return false; // Prevent form submission
}

// Update renderMenuItemsTable to show images better
function renderMenuItemsTable() {
    const tableBody = document.getElementById('menuItemsTable');
    if (!tableBody) return;
    
    if (menuItems.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    No menu items found. <button onclick="openAddItemModal()" style="background: none; border: none; color: #3498db; cursor: pointer; text-decoration: underline;">Add your first item</button>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = menuItems.map(item => `
        <tr>
            <td>
                <div class="item-image-small" onclick="viewImage('${item.image || getDefaultImage()}')" style="cursor: pointer;" title="Click to view larger">
                    <img src="${item.image || getDefaultImage()}" 
                         alt="${item.name}"
                         onerror="this.src='${getDefaultImage()}'">
                </div>
            </td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${settings.currency || '$'}${item.price.toFixed(2)}</td>
            <td>${item.isSpecial ? '<span class="status-available">Yes</span>' : 'No'}</td>
            <td>
                <span class="${item.isAvailable ? 'status-available' : 'status-unavailable'}">
                    ${item.isAvailable ? 'Available' : 'Unavailable'}
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

// Add function to view larger image
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
        if (e.target === modal) {
            modal.remove();
        }
    };
    
    document.body.appendChild(modal);
}

function getDefaultImage() {
    return 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80';
}
// Add CSS for orders in style.css (add this to the end of the file)
// Export functions for HTML onclick handlers
window.addToCart = addToCart;
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.checkout = checkout;
window.toggleCart = toggleCart;
window.closeCart = closeCart;
window.adminLogin = adminLogin;
window.logoutAdmin = logoutAdmin;
window.showSection = showSection;
window.openAddItemModal = openAddItemModal;
window.openAddCategoryModal = openAddCategoryModal;
window.closeModal = closeModal;
window.saveSettings = saveSettings;
window.togglePassword = togglePassword;
window.filterMenu = filterMenu;
window.filterByCategory = filterByCategory;
window.renderMenuItems = renderMenuItems;
window.editItem = editItem;
window.deleteItem = deleteItem;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.saveItem = saveItem;
window.saveCategory = saveCategory;

// Add these to global scope for button clicks
window.initializeApp = initializeApp;

window.viewImage = viewImage;
window.updateImagePreview = updateImagePreview;
window.handleImageUpload = handleImageUpload;
window.selectSampleImage = selectSampleImage;
window.resetImagePreview = resetImagePreview;
window.updateOrderStatus = updateOrderStatus;
window.deleteOrder = deleteOrder;
window.renderOrdersList = renderOrdersList;


window.checkout = checkout;
window.closeCheckoutModal = closeCheckoutModal;
window.confirmCheckout = confirmCheckout;
window.renderOrderTracking = renderOrderTracking;
window.getStatusLabel = getStatusLabel;

window.openAddTableModal = openAddTableModal;
window.editTable = editTable;
window.deleteTable = deleteTable;
window.saveTable = saveTable;
window.showQRCode = showQRCode;
window.downloadQRCode = downloadQRCode;
window.printQRCode = printQRCode;
window.printAllQRCodes = printAllQRCodes;
window.renderTablesGrid = renderTablesGrid;
window.getTableFromURL = getTableFromURL;
