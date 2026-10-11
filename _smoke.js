/*
 * TEMP smoke test for script.js (localStorage fallback mode).
 * Mocks a minimal DOM so we can verify boot + core flows run without errors.
 */
const fs = require('fs');
const path = require('path');

function makeClassList() {
    return {
        _set: new Set(),
        add(...c) { c.forEach(x => this._set.add(x)); },
        remove(...c) { c.forEach(x => this._set.delete(x)); },
        toggle(c) { this._set.has(c) ? this._set.delete(c) : this._set.add(c); },
        contains(c) { return this._set.has(c); }
    };
}

function makeElement(id) {
    const el = {
        id, value: '', checked: false, style: {}, dataset: {}, files: [], _html: '',
        classList: makeClassList(),
        set innerHTML(v) { this._html = v; },
        get innerHTML() { return this._html; },
        set textContent(v) { this._text = v; },
        get textContent() { return this._text || ''; },
        addEventListener() {}, removeEventListener() {},
        setAttribute() {}, removeAttribute() {},
        appendChild() {}, remove() {}, reset() { this.value = ''; },
        querySelector() { return makeElement('q'); }, querySelectorAll() { return []; },
        insertBefore() {}, scrollIntoView() {}
    };
    el.parentElement = { insertBefore() {} };
    return el;
}

const registry = new Map();
function el(id) {
    if (!registry.has(id)) registry.set(id, makeElement(id));
    return registry.get(id);
}

const listeners = {};
global.document = {
    ready: false,
    addEventListener(type, cb) { listeners[type] = cb; },
    getElementById: el,
    querySelector(sel) {
        if (sel === '.cart-count') return el('__cartCount');
        return makeElement('q_' + sel);
    },
    querySelectorAll() { return []; },
    createElement() { return makeElement('dyn'); },
    body: { appendChild() {} },
    title: ''
};

global.window = {
    addEventListener(type, cb) { listeners['window_' + type] = cb; },
    location: { pathname: '/index.html', search: '', href: 'file:///C:/test/index.html' },
    open() { return { document: { write() {}, close() {} } }; }
};

const store = {};
global.confirm = () => true;
global.localStorage = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
};

// Firebase intentionally undefined -> localStorage fallback mode.

const script = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');
eval(script);
(async () => {
    const results = [];
    try {
        await listeners.DOMContentLoaded();

        const items = JSON.parse(localStorage.getItem('hotelMenuItems') || '[]');
        const categories = JSON.parse(localStorage.getItem('hotelMenuCategories') || '[]');
        const tables = JSON.parse(localStorage.getItem('hotelMenuTables') || '[]');
        const settings = JSON.parse(localStorage.getItem('hotelMenuSettings') || '{}');
        results.push(['seed items = 5', items.length === 5]);
        results.push(['seed categories = 5', categories.length === 5]);
        results.push(['seed tables = 4', tables.length === 4]);
        results.push(['settings.hotelName = Royal Hotel', settings.hotelName === 'Royal Hotel']);
        results.push(['menuGrid rendered', el('menuGrid').innerHTML.includes('Grilled Salmon')]);
        results.push(['categories rendered', el('categoryFilter').innerHTML.includes('Main Course')]);
        results.push(['specials rendered', el('specialsGrid').innerHTML.includes('Chocolate Lava Cake')]);

        window.addToCart(1);
        window.addToCart(1);
        window.addToCart(2);
        const cartAfterAdd = JSON.parse(store['hotelMenuCart']);
        results.push(['cart has 2 line entries (id1 qty2, id2 qty1)', cartAfterAdd.length === 2 && cartAfterAdd.find(i => i.id === 1).quantity === 2]);
        window.updateCartQuantity(1, -1);
        window.updateCartQuantity(1, -1);
        results.push(['cart after both decrements = 1 entry', JSON.parse(store['hotelMenuCart']).length === 1]);
        window.removeFromCart(2);
        results.push(['cart after remove = empty', JSON.parse(store['hotelMenuCart']).length === 0]);

        el('tableNumber').value = 'Table 5';
        el('customerName').value = 'Test';
        el('orderNotes').value = 'no onions';
        window.confirmCheckout();
        const orders = JSON.parse(localStorage.getItem('hotelMenuOrders') || '[]');
        results.push(['order created', orders.length === 1]);
        results.push(['order table = Table 5', orders[0].tableNumber === 'Table 5']);
        results.push(['order status = pending', orders[0].status === 'pending']);
        results.push(['cart cleared after order', JSON.parse(store['hotelMenuCart']).length === 0]);
        results.push(['tracking shows order', el('trackingOrders').innerHTML.includes('#')]);

        el('hotelName').value = 'Grand Hotel';
        el('currency').value = '€';
        el('taxRate').value = '8.5';
        window.saveSettings();
        const updatedSettings = JSON.parse(localStorage.getItem('hotelMenuSettings'));
        results.push(['settings saved', updatedSettings.hotelName === 'Grand Hotel' && updatedSettings.currency === '€']);

        el('categoryName').value = 'Soups';
        window.openAddCategoryModal();
        window.saveCategory({ preventDefault() {}, stopPropagation() {} });
        results.push(['category added', JSON.parse(store['hotelMenuCategories']).some(c => c.name === 'Soups')]);

        el('itemName').value = 'Tomato Soup';
        el('itemDescription').value = 'Warm & smooth';
        el('itemPrice').value = '6.5';
        el('itemCategory').value = 'Soups';
        el('itemImage').value = 'https://example.com/soup.jpg';
        el('itemPrepTime').value = '10';
        el('itemSpecial').checked = false;
        el('itemAvailable').checked = true;
        window.openAddItemModal();
        window.saveItem({ preventDefault() {}, stopPropagation() {} });
        results.push(['menu item added', JSON.parse(store['hotelMenuItems']).some(i => i.name === 'Tomato Soup')]);

        window.updateOrderStatus(orders[0].id, 'ready');
        results.push(['order status updated to ready', JSON.parse(store['hotelMenuOrders'])[0].status === 'ready']);

        el('tableNumberInput').value = 'Table 9';
        el('tableCapacity').value = '8';
        el('tableLocation').value = 'Patio';
        el('tableNotes').value = '';
        window.openAddTableModal();
        window.saveTable({ preventDefault() {}, stopPropagation() {} });
        results.push(['table added', JSON.parse(store['hotelMenuTables']).some(t => t.number === 'Table 9')]);

        // Order delete
        window.deleteOrder(orders[0].id);
        results.push(['order deleted', JSON.parse(store['hotelMenuOrders']).length === 0]);
    } catch (err) {
        results.push(['SMOKE ERROR: ' + err.stack, false]);
    }

    let pass = true;
    for (const [name, ok] of results) {
        console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name);
        if (!ok) pass = false;
    }
    console.log(pass ? '\nSMOKE TEST PASSED' : '\nSMOKE TEST FAILED');
    process.exit(pass ? 0 : 1);
})();