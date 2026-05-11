// ========================================
// NEARCART - MAIN APPLICATION
// ========================================

// ===== GLOBAL STATE =====
let currentUser = null;
let users = [];
let cart = [];
let orders = [];
let userAddresses = [];
let selectedAddressId = null;
let currentFilter = 'all';

// ===== EMAILJS CONFIG =====
const EMAILJS_CONFIG = {
    PUBLIC_KEY: "eV1DfeWmYEf9xmjWy",
    SERVICE_ID: "service_sljtn7j",
    TEMPLATE_ID: "template_s1wltq6"
};

// ===== PRODUCTS DATA =====
const products = [
    { id: 1, name: "Organic Honey", price: 250, icon: "🍯", seller: "Sweet Nature", distance: "1.5 km", description: "100% pure organic honey from local farms." },
    { id: 2, name: "Handmade Saree", price: 899, icon: "👗", seller: "Radha Creations", distance: "2.3 km", description: "Beautiful handwoven saree from local artisans." }
];

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initializeEmailJS();
    setupEventListeners();
    
    if (currentUser) {
        showMainApp();
        renderProducts();
        updateAddressDisplay();
    }
});

function loadData() {
    users = JSON.parse(localStorage.getItem('nearcart_users')) || [];
    currentUser = JSON.parse(localStorage.getItem('nearcart_current_user'));
    cart = JSON.parse(localStorage.getItem('nearcart_cart')) || [];
    orders = JSON.parse(localStorage.getItem('nearcart_orders')) || [];
    userAddresses = JSON.parse(localStorage.getItem('nearcart_addresses')) || [];
    selectedAddressId = localStorage.getItem('nearcart_selected_address') || null;
}

function initializeEmailJS() {
    emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
}

function setupEventListeners() {
    // OTP auto-focus will be set in pages
}

// ===== UI FUNCTIONS =====
function showMainApp() {
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('userName').innerHTML = currentUser.name;
    document.getElementById('profileName').innerHTML = currentUser.name;
    document.getElementById('profileEmail').innerHTML = currentUser.email;
}

function showScreen(screenId) {
    document.querySelectorAll('#mainApp .screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    // Update bottom nav
    const navMap = { homeScreen: 0, ordersScreen: 1, cartScreen: 2, profileScreen: 3 };
    document.querySelectorAll('.nav-item').forEach((n, i) => {
        n.classList.toggle('active', navMap[screenId] === i);
    });
}

function showHome() { showScreen('homeScreen'); }
function showCart() { renderCart(); showScreen('cartScreen'); }
function showOrders() { renderOrders(); showScreen('ordersScreen'); }
function showProfile() { showScreen('profileScreen'); }

// ===== EXPORT FUNCTIONS (Global) =====
window.showHome = showHome;
window.showCart = showCart;
window.showOrders = showOrders;
window.showProfile = showProfile;

// ===== PRODUCT FUNCTIONS =====
function renderProducts() {
    const container = document.getElementById('productsList');
    if (!container) return;
    
    container.innerHTML = products.map(p => `
        <div class="product-card" onclick="showProductDetail(${p.id})">
            <div class="product-icon">${p.icon}</div>
            <div class="product-details">
                <div class="product-name">${p.name}</div>
                <div class="product-seller">by ${p.seller}</div>
                <div class="product-price">₹${p.price}</div>
                <div class="product-distance">📍 ${p.distance}</div>
            </div>
            <button class="btn-primary" style="width:auto; padding:8px 16px;" onclick="event.stopPropagation(); window.addToCart(${p.id})">Buy</button>
        </div>
    `).join('');
}

window.showProductDetail = function(id) {
    const p = products.find(x => x.id === id);
    const detailContent = document.getElementById('detailContent');
    if (detailContent) {
        detailContent.innerHTML = `
            <div class="detail-image">${p.icon}</div>
            <h2>${p.name}</h2>
            <div class="product-price" style="font-size:1.5rem;">₹${p.price}</div>
            <div class="product-seller">by ${p.seller}</div>
            <p style="margin:16px 0;">${p.description}</p>
            <button class="btn-primary" onclick="window.addToCart(${p.id}); window.showCart()">Add to Cart</button>
            <button class="btn-outline" onclick="window.openChat('${p.seller}')">💬 Chat with Seller</button>
        `;
    }
    showScreen('detailScreen');
};

window.addToCart = function(id) {
    const p = products.find(x => x.id === id);
    const existing = cart.find(i => i.id === id);
    if (existing) existing.quantity++;
    else cart.push({ ...p, quantity: 1 });
    localStorage.setItem('nearcart_cart', JSON.stringify(cart));
    renderCart();
    alert(`${p.name} added to cart`);
};

window.removeFromCart = function(id) {
    cart = cart.filter(i => i.id !== id);
    localStorage.setItem('nearcart_cart', JSON.stringify(cart));
    renderCart();
};

window.updateQuantity = function(id, qty) {
    if (qty <= 0) window.removeFromCart(id);
    else {
        cart.find(i => i.id === id).quantity = qty;
        localStorage.setItem('nearcart_cart', JSON.stringify(cart));
        renderCart();
    }
};

function renderCart() {
    const container = document.getElementById('cartList');
    if (!container) return;
    
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const discount = Math.floor(subtotal * 0.1);
    const delivery = subtotal > 500 ? 0 : 40;
    const total = subtotal - discount + delivery;
    
    container.innerHTML = cart.length ? cart.map(i => `
        <div class="cart-item">
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:1.5rem;">${i.icon}</span>
                <div>
                    <div style="font-weight:600;">${i.name}</div>
                    <div style="color:#6366f1;">₹${i.price} × ${i.quantity}</div>
                </div>
            </div>
            <div style="display:flex; gap:6px; align-items:center;">
                <button class="qty-btn" onclick="window.updateQuantity(${i.id}, ${i.quantity-1})">−</button>
                <span style="min-width:20px; text-align:center;">${i.quantity}</span>
                <button class="qty-btn" onclick="window.updateQuantity(${i.id}, ${i.quantity+1})">+</button>
                <button onclick="window.removeFromCart(${i.id})" style="background:none; border:none; font-size:1.2rem; cursor:pointer;">🗑️</button>
            </div>
        </div>
    `).join('') : '<p style="text-align:center; padding:40px;">Your cart is empty 🛒</p>';
    
    document.getElementById('cartSubtotal').innerHTML = subtotal;
    document.getElementById('cartDiscount').innerHTML = discount;
    document.getElementById('cartDelivery').innerHTML = delivery === 0 ? 'FREE' : delivery;
    document.getElementById('cartTotal').innerHTML = total;
    document.getElementById('payTotal').innerHTML = total;
}

// ===== ADDRESS FUNCTIONS =====
window.showAddressScreen = function() {
    renderAddressList();
    showScreen('addressScreen');
};

function renderAddressList() {
    const container = document.getElementById('addressList');
    if (!container) return;
    
    container.innerHTML = userAddresses.map(a => `
        <div class="address-card ${selectedAddressId == a.id ? 'selected' : ''}" onclick="window.selectAddress(${a.id})">
            <div>
                <strong>🏠 ${a.type}</strong><br>
                <span style="font-size:0.85rem; color:#666;">${a.street}, ${a.city}</span><br>
                <span style="font-size:0.75rem; color:#888;">${a.pincode}</span>
            </div>
            ${a.isDefault ? '<span style="color:#6366f1; font-size:0.7rem; font-weight:600;">DEFAULT</span>' : ''}
        </div>
    `).join('');
}

window.selectAddress = function(id) {
    selectedAddressId = id;
    localStorage.setItem('nearcart_selected_address', id);
    updateAddressDisplay();
    showHome();
};

window.showAddAddressForm = function() {
    document.getElementById('addAddressForm').style.display = 'block';
};

window.cancelAddAddress = function() {
    document.getElementById('addAddressForm').style.display = 'none';
};

window.saveAddress = function() {
    const type = document.getElementById('newType').value;
    const street = document.getElementById('newStreet').value;
    const city = document.getElementById('newCity').value;
    const pincode = document.getElementById('newPincode').value;
    
    if (!type || !street || !city || !pincode) {
        alert('Please fill all fields');
        return;
    }
    
    userAddresses.push({ id: Date.now(), type, street, city, pincode, isDefault: false });
    localStorage.setItem('nearcart_addresses', JSON.stringify(userAddresses));
    window.cancelAddAddress();
    renderAddressList();
    alert('Address saved!');
};

function updateAddressDisplay() {
    const addr = userAddresses.find(a => a.id == selectedAddressId);
    if (addr) {
        document.getElementById('selectedLocation').innerHTML = `${addr.type}: ${addr.street}`;
        document.getElementById('deliveryAddress').innerHTML = `${addr.street}, ${addr.city}`;
    }
}

// ===== ORDERS FUNCTIONS =====
function renderOrders() {
    const container = document.getElementById('ordersList');
    if (!container) return;
    
    const filtered = currentFilter === 'all' ? orders : orders.filter(o => o.status === currentFilter);
    container.innerHTML = filtered.length ? filtered.map(o => `
        <div class="order-card">
            <div style="display:flex; gap:12px; align-items:center;">
                <div style="font-size:2rem;">🛍️</div>
                <div>
                    <strong>Order #${o.id}</strong>
                    <div style="font-size:0.8rem; color:#666;">${o.date}</div>
                    <div style="font-weight:700; color:#6366f1;">₹${o.total}</div>
                    <div class="order-status status-${o.status}">${o.status.toUpperCase()}</div>
                </div>
            </div>
        </div>
    `).join('') : '<p style="text-align:center; padding:40px;">No orders found</p>';
}

window.filterOrders = function(status) {
    currentFilter = status;
    document.querySelectorAll('.order-tab').forEach((tab, i) => {
        tab.classList.toggle('active', (i===0 && status==='all') || (i===1 && status==='pending') || (i===2 && status==='delivered'));
    });
    renderOrders();
};

// ===== CHAT FUNCTIONS =====
window.openChat = function(seller) {
    document.getElementById('chatSellerName').innerHTML = seller;
    showScreen('chatScreen');
};

window.sendChatMessage = function() {
    const input = document.getElementById('chatInput');
    if (!input.value.trim()) return;
    
    const messagesDiv = document.getElementById('chatMessages');
    messagesDiv.innerHTML += `
        <div class="message sent">
            <div class="message-content">${input.value}</div>
        </div>
    `;
    input.value = '';
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
};

// ===== PAYMENT FUNCTIONS =====
window.showPayment = function() {
    if (!selectedAddressId) {
        alert('Please select delivery address first');
        window.showAddressScreen();
        return;
    }
    
    const total = parseInt(document.getElementById('cartTotal').innerHTML);
    if (!total || total <= 0) {
        alert('Your cart is empty');
        return;
    }
    
    document.getElementById('paymentOptions').innerHTML = `
        <div class="payment-option" onclick="window.selectPayment('upi')">📱 UPI / QR Code</div>
    `;
    showScreen('paymentScreen');
};

window.selectPayment = function(method) {
    if (method !== 'upi') {
        alert('Only UPI/QR payment is available');
        return;
    }
    
    const total = parseInt(document.getElementById('cartTotal').innerHTML);
    const qrUrl = `https://quickchart.io/qr?size=200&text=upi://pay?pa=9238480409@ibl&pn=NearCart&am=${total}&cu=INR`;
    document.getElementById('qrImage').src = qrUrl;
    document.getElementById('qrModal').style.display = 'flex';
    window.pendingOrderId = 'NC' + Date.now();
    window.currentPaymentTotal = total;
};

window.closeQRModal = function() {
    document.getElementById('qrModal').style.display = 'none';
};

window.confirmQRPayment = function() {
    const newOrder = {
        id: window.pendingOrderId,
        items: [...cart],
        total: window.currentPaymentTotal,
        status: 'pending',
        date: new Date().toLocaleDateString()
    };
    orders.unshift(newOrder);
    localStorage.setItem('nearcart_orders', JSON.stringify(orders));
    cart = [];
    localStorage.setItem('nearcart_cart', JSON.stringify(cart));
    window.closeQRModal();
    alert('✅ Payment Successful! Order placed.');
    showOrders();
    renderCart();
};

// ===== LOGOUT =====
window.logout = function() {
    localStorage.removeItem('nearcart_current_user');
    location.reload();
};