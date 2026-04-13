// Global state
let allProducts = [];
let currentUser = null;
let currentFilters = {
    search: '',
    category: 'ALL',
    lowStock: false
};
let currentSort = {
    key: null,
    direction: 'asc' // or 'desc'
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('PRO Store Management System initialized');
    loadProducts(); 
    loadProfile();
    
    // Smooth navigation for hash-based sections
    window.addEventListener('hashchange', () => {
        const id = window.location.hash.substring(1) || 'products';
        showSection(id);
    });

    // Handle initial hash or default
    const initialId = window.location.hash.substring(1) || 'products';
    showSection(initialId);

    // Initial load
    refreshDashboard();

    // Event Listeners for Filters
    document.getElementById('productSearch')?.addEventListener('input', (e) => {
        currentFilters.search = e.target.value.toLowerCase();
        applyFilters();
    });

    document.getElementById('categoryFilter')?.addEventListener('change', (e) => {
        currentFilters.category = e.target.value;
        applyFilters();
    });
});

function refreshDashboard() {
    loadProducts();
    loadProfile();
    if (window.location.hash === '#team') loadTeamMembers();
    if (window.location.hash === '#crm') loadCustomers();
    if (window.location.hash === '#sales') loadSalesHistory();
    if (window.location.hash === '#logs') loadActivityLogs();
}

function showSection(id) {
    // Basic navigation logic
    document.querySelectorAll('.dashboard-main section').forEach(s => {
        s.style.display = 'none';
        s.classList.remove('animate-up');
    });

    const target = document.getElementById(id);
    if(target) {
        target.style.display = 'block';
        target.classList.add('animate-up');
    }

    // Nav Link Highlighting
    document.querySelectorAll('.app-nav a').forEach(a => {
        a.classList.remove('active');
        if(a.onclick && a.onclick.toString().includes(id)) {
            a.classList.add('active');
        }
    });

    // Specialized Loaders
    if(id === 'logs') loadActivityLogs();
    if(id === 'team') loadTeamMembers();
    if(id === 'crm') loadCustomers();
    if(id === 'sales') loadSalesHistory();
}

async function loadProfile() {
    const profile = await handleFetch('/api/profile');
    if (profile) {
        currentUser = profile;
        const displayName = profile.fullName || profile.username;
        
        // Update Header
        if(document.getElementById('headerUsername')) {
            document.getElementById('headerUsername').textContent = displayName;
        }
        if(document.querySelector('.avatar')) {
            document.querySelector('.avatar').textContent = displayName.charAt(0).toUpperCase();
        }

        // Update Profile Section
        if(document.getElementById('profileName')) {
            document.getElementById('profileName').textContent = displayName;
            document.getElementById('profileRole').textContent = profile.role + ' ACCESS';
        }
        
        // Fill profile form
        if(document.getElementById('editFullName')) {
            document.getElementById('editFullName').value = profile.fullName || '';
            document.getElementById('editPhone').value = profile.phoneNumber || '';
            document.getElementById('editAddress').value = profile.address || '';
        }
    }
}

async function loadActivityLogs() {
    const logs = await handleFetch('/api/activity-logs');
    if (!logs) return;
    
    const tbody = document.getElementById('logTableBody');
    tbody.innerHTML = '';
    logs.forEach((log, index) => {
        const tr = document.createElement('tr');
        tr.style.animationDelay = `${index * 0.05}s`;
        tr.classList.add('animate-up');
        tr.innerHTML = `
            <td><span class="badge badge-primary">${new Date(log.timestamp).toLocaleTimeString()}</span></td>
            <td><div style="font-weight: 700;">${log.username}</div><div style="font-size: 0.7rem; color: var(--text-muted);">IP: ${log.ipAddress || 'Internal'}</div></td>
            <td><span class="badge ${log.action.includes('ERR') ? 'badge-danger' : 'badge-success'}">${log.action}</span></td>
            <td style="font-size: 0.85rem; color: var(--text-muted);">${log.details}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function loadTeamMembers() {
    const users = await handleFetch('/api/users');
    if (!users) return;
    
    const tbody = document.getElementById('teamTableBody');
    tbody.innerHTML = '';
    users.forEach((user, index) => {
        const tr = document.createElement('tr');
        tr.style.animationDelay = `${index * 0.05}s`;
        tr.classList.add('animate-up');
        tr.innerHTML = `
            <td>
                <div style="font-weight: 700;">${user.username}</div>
                <div style="font-size: 0.7rem; color: var(--text-muted);">${user.fullName || 'No Name Set'}</div>
            </td>
            <td>${user.email}</td>
            <td><span class="badge ${user.role === 'ADMIN' ? 'badge-danger' : 'badge-primary'}">${user.role}</span></td>
            <td>
                <button onclick="deleteTeamMember(${user.id})" class="badge badge-danger" style="border:none; cursor:pointer;">Terminate Access</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function deleteTeamMember(id) {
    if (currentUser && id === currentUser.id) {
        showToast('Cannot terminate your own session');
        return;
    }
    if (!confirm('Permanent revocation of employee access?')) return;
    
    const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (response.ok) {
        showToast('Employee account purged');
        loadTeamMembers();
    }
}

async function updateProfile(event) {
    event.preventDefault();
    const btn = event.submitter || event.target.querySelector('button[type="submit"]');
    const originalText = btn ? btn.textContent : 'Save';
    
    if (btn) {
        btn.textContent = 'Securing...';
        btn.disabled = true;
    }

    const profileData = {
        fullName: document.getElementById('editFullName').value,
        phoneNumber: document.getElementById('editPhone').value,
        address: document.getElementById('editAddress').value
    };
    const result = await handleFetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
    });

    if (result) {
        showToast('Identity updated successfully');
        loadProfile();
    } else {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// PRODUCT MANAGEMENT
async function loadProducts() {
    const products = await handleFetch('/api/products');
    if (!products) return;
    
    // Update Record Count for visibility debugging
    const badge = document.getElementById('productCountBadge');
    if (badge) {
        badge.textContent = `${products.length} Records in Ledger`;
        badge.classList.add('pulse'); // Visual cue for update
    }

    allProducts = products;
    console.log('DEBUG: Received products from API:', products);
    
    // Update category filter options
    const catFilter = document.getElementById('categoryFilter');
    if (catFilter) {
        const categories = [...new Set(products.map(p => p.category ? p.category.name : 'GENERAL'))];
        catFilter.innerHTML = '<option value="ALL">All Categories</option>';
        categories.sort().forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            catFilter.appendChild(option);
        });
        catFilter.value = currentFilters.category;
    }

    applyFilters();
    updateStats(allProducts);
}

function applyFilters() {
    let filtered = allProducts.filter(p => {
        const matchesSearch = !currentFilters.search || 
            p.name.toLowerCase().includes(currentFilters.search) || 
            (p.category && p.category.name.toLowerCase().includes(currentFilters.search)) ||
            p.barcode?.toLowerCase().includes(currentFilters.search);
        
        const catName = p.category ? p.category.name : 'GENERAL';
        const matchesCategory = currentFilters.category === 'ALL' || catName === currentFilters.category;
        
        const matchesLowStock = !currentFilters.lowStock || p.stock < 10;
        
        return matchesSearch && matchesCategory && matchesLowStock;
    });

    // Apply Sorting
    if (currentSort.key) {
        filtered.sort((a, b) => {
            let valA = a[currentSort.key];
            let valB = b[currentSort.key];
            
            if (currentSort.key === 'price' || currentSort.key === 'stock') {
                valA = parseFloat(valA) || 0;
                valB = parseFloat(valB) || 0;
            } else {
                valA = (valA || '').toString().toLowerCase();
                valB = (valB || '').toString().toLowerCase();
            }

            if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    renderProducts(filtered);
}

function setSort(key) {
    if (currentSort.key === key) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.key = key;
        currentSort.direction = 'asc';
    }

    // Update indicators
    document.querySelectorAll('[id^="sort-"]').forEach(el => el.textContent = '');
    const indicator = document.getElementById(`sort-${key}`);
    if (indicator) {
        indicator.textContent = currentSort.direction === 'asc' ? ' ↑' : ' ↓';
    }

    applyFilters();
}

function toggleLowStockFilter() {
    currentFilters.lowStock = !currentFilters.lowStock;
    const btn = document.getElementById('lowStockToggle');
    const status = document.getElementById('lowStockStatus');
    if (btn && status) {
        if (currentFilters.lowStock) {
            btn.style.background = 'rgba(239, 68, 68, 0.1)';
            btn.style.borderColor = 'var(--danger)';
            status.style.background = 'var(--danger)';
        } else {
            btn.style.background = 'rgba(255, 255, 255, 0.03)';
            btn.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            status.style.background = '#94a3b8';
        }
    }
    applyFilters();
}

function renderProducts(products) {
    const tbody = document.getElementById('productTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 3rem; color: var(--text-muted);">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">📦</div>
            No inventory assets found in the current ledger.
        </td></tr>`;
        return;
    }
    
    products.forEach((p, index) => {
        try {
            const tr = document.createElement('tr');
            tr.style.animationDelay = `${index * 0.03}s`;
            tr.classList.add('animate-up');
            
            // Format values safely
            const price = typeof p.price === 'number' ? p.price.toFixed(2) : '0.00';
            const stock = p.stock || 0;
            const catName = (p.category && p.category.name) ? p.category.name : 'GENERAL';
            
            // Image handling (Placeholder if empty)
            const imgSrc = p.imagePath || 'https://via.placeholder.com/40/222/var(--primary).png?text=📦';

            tr.innerHTML = `
                <td>
                    <img src="${imgSrc}" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(255,255,255,0.05);">
                </td>
                <td>
                    <div style="font-weight: 700;">${p.name || 'Unnamed Asset'}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${p.description || 'No description provided'}</div>
                </td>
                <td><span class="badge badge-primary">${catName}</span></td>
                <td style="font-weight: 700;">$${price}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <button onclick="adjustStock(${p.id}, -1)" class="badge badge-danger" style="border:none; cursor:pointer; font-size: 0.8rem; padding: 2px 6px;">-</button>
                        <span style="font-weight: 800; color: ${stock < 10 ? 'var(--danger)' : 'var(--success)'}; min-width: 30px; text-align: center;">${stock}</span>
                        <button onclick="adjustStock(${p.id}, 1)" class="badge badge-success" style="border:none; cursor:pointer; font-size: 0.8rem; padding: 2px 6px;">+</button>
                    </div>
                </td>
                <td style="font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; letter-spacing: 1px;">${p.barcode || '---'}</td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button onclick="buyProduct(${p.id})" class="badge badge-success" style="border:none; cursor:pointer;">Buy</button>
                        <button onclick="editProduct(${p.id})" class="badge badge-primary" style="border:none; cursor:pointer;">Edit</button>
                        <button onclick="deleteProduct(${p.id})" class="badge badge-danger" style="border:none; cursor:pointer;">Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        } catch (e) {
            console.error(`DEBUG: Failed to render product at index ${index}:`, p, e);
        }
    });
}

async function adjustStock(id, delta) {
    const result = await handleFetch(`/api/products/${id}/adjust-stock?delta=${delta}`, {
        method: 'PATCH'
    });

    if (result) {
        showToast(`Stock updated: ${delta > 0 ? '+' : ''}${delta}`);
        await loadProducts(); // Auto-refresh everything including stats
    }
}

function updateStats(products) {
    animateNumber('totalProductsCount', products.length);
    const lowStock = products.filter(p => p.stock < 10).length;
    animateNumber('lowStockCount', lowStock);

    // Calculate Total Valuation
    const totalValuation = products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0);
    const valBadge = document.getElementById('totalValueBadge');
    if (valBadge) {
        valBadge.textContent = `Valuation: $${totalValuation.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
}

function animateNumber(id, end) {
    const el = document.getElementById(id);
    if (!el) return;
    let start = 0;
    const duration = 1000;
    const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        el.textContent = Math.floor(progress * end);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}


// Modal Logic
function openAddProductModal() {
    document.getElementById('modalTitle').textContent = 'Create Asset';
    document.getElementById('productForm').reset();
    document.getElementById('prodId').value = '';
    document.getElementById('productModal').style.display = 'flex';
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
}

function editProduct(id) {
    console.log('Editing product:', id);
    const p = allProducts.find(item => item.id == id);
    if (!p) {
        console.error('Product not found in state:', id);
        return;
    }
    
    document.getElementById('modalTitle').textContent = 'Update Asset';
    document.getElementById('prodId').value = p.id;
    document.getElementById('prodName').value = p.name;
    document.getElementById('prodDesc').value = p.description || '';
    document.getElementById('prodPrice').value = p.price;
    document.getElementById('prodStock').value = p.stock;
    document.getElementById('prodCategory').value = p.category ? p.category.name : '';
    // Reset image input
    document.getElementById('prodImage').value = '';
    
    document.getElementById('productModal').style.display = 'flex';
}

async function saveProduct(event) {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    const originalText = btn ? btn.textContent : 'Save Asset';
    
    if (btn) {
        btn.textContent = 'Integrating...';
        btn.disabled = true;
    }

    try {
        const id = document.getElementById('prodId').value;
        const formData = new FormData();
        
        const mode = id ? 'UPDATE' : 'CREATE';
        console.log(`DEBUG: Saving product in ${mode} mode (ID: ${id})`);
        
        const productData = {
            name: document.getElementById('prodName').value,
            description: document.getElementById('prodDesc').value,
            price: parseFloat(document.getElementById('prodPrice').value),
            stock: parseInt(document.getElementById('prodStock').value),
            category: { name: document.getElementById('prodCategory').value }
        };

        console.log('Saving product data:', productData, 'ID:', id);

        formData.append('product', new Blob([JSON.stringify(productData)], { type: 'application/json' }));
        
        const imageFile = document.getElementById('prodImage').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }

        const response = await fetch('/api/products' + (id ? `/${id}` : ''), {
            method: id ? 'PUT' : 'POST',
            body: formData
        });

        console.log('Response status:', response.status);

        if (response.ok) {
            const savedProduct = await response.json();
            console.log('DEBUG: Saved product response:', savedProduct);
            showToast(`Asset '${savedProduct.name}' saved with ID: ${savedProduct.id}`);
            closeProductModal();
            await loadProducts();
        } else {
            const errText = await response.text();
            alert('Error: ' + errText);
        }
    } catch (error) {
        console.error('Save product error:', error);
        alert('Internal Error: ' + error.message);
    } finally {
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
}

async function buyProduct(id) {
    const p = allProducts.find(item => item.id == id);
    if (!p) return;
    
    if (p.stock <= 0) {
        showToast('Out of stock!');
        return;
    }

    if (!confirm(`Buy 1 unit of ${p.name} for $${p.price.toFixed(2)}?`)) return;

    const saleData = {
        items: [{
            product: { id: p.id },
            quantity: 1
        }],
        paymentMethod: 'CASH'
    };

    const result = await handleFetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
    });

    if (result) {
        showToast('Purchase successful!');
        loadProducts();
    }
}

async function addSimpleUser() {
    const username = prompt("Enter username:");
    if (!username) return;
    const email = prompt("Enter email:");
    if (!email) return;

    const userData = {
        username: username,
        email: email,
        role: 'USER',
        enabled: true
    };

    const result = await handleFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });

    if (result) {
        showToast('User added successfully');
        if (window.location.hash === '#team') loadTeamMembers();
    }
}

async function deleteProduct(id) {
    if (!confirm('Commit deletion of this inventory asset?')) return;
    const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (response.ok) {
        showToast('Asset removed from grid');
        loadProducts();
    }
}

// Bulk Import
async function importProducts(input) {
    const file = input.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    const result = await handleFetch('/api/products/import', { method: 'POST', body: formData });
    if (result) {
        showToast('Bulk assets integrated successfully');
        loadProducts();
    }
    input.value = ''; 
}

// CRM MANAGEMENT
let allCustomers = [];

async function loadCustomers() {
    const customers = await handleFetch('/api/customers');
    if (!customers) return;
    allCustomers = customers;
    
    // Update CRM Metrics
    animateNumber('crmTotalCount', customers.length);
    const totalPoints = customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);
    animateNumber('crmTotalPoints', totalPoints);
    
    const tbody = document.getElementById('crmTableBody');
    tbody.innerHTML = '';
    customers.forEach((c, index) => {
        const tr = document.createElement('tr');
        tr.style.animationDelay = `${index * 0.05}s`;
        tr.classList.add('animate-up');
        tr.innerHTML = `
            <td><div style="font-weight: 800;">${c.name}</div><div style="font-size: 0.7rem; color: var(--text-muted);">UID: ${c.id}</div></td>
            <td><div>${c.email}</div><div style="font-size: 0.75rem;">${c.phone || '---'}</div></td>
            <td><span class="badge badge-success">${c.loyaltyPoints || 0} pts</span></td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="editCustomer(${c.id})" class="badge badge-primary" style="border:none; cursor:pointer;">Edit</button>
                    <button onclick="deleteCustomer(${c.id})" class="badge badge-danger" style="border:none; cursor:pointer;">Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openCustomerModal() {
    document.getElementById('custModalTitle').textContent = 'Register Customer';
    document.getElementById('customerForm').reset();
    document.getElementById('custId').value = '';
    document.getElementById('customerModal').style.display = 'flex';
}

function closeCustomerModal() {
    document.getElementById('customerModal').style.display = 'none';
}

function editCustomer(id) {
    const c = allCustomers.find(item => item.id == id);
    if (!c) return;
    document.getElementById('custModalTitle').textContent = 'Update Profile';
    document.getElementById('custId').value = c.id;
    document.getElementById('custName').value = c.name;
    document.getElementById('custEmail').value = c.email;
    document.getElementById('custPhone').value = c.phone || '';
    document.getElementById('custAddress').value = c.address || '';
    document.getElementById('customerModal').style.display = 'flex';
}

async function saveCustomer(event) {
    event.preventDefault();
    const id = document.getElementById('custId').value;
    const customerData = {
        name: document.getElementById('custName').value,
        email: document.getElementById('custEmail').value,
        phone: document.getElementById('custPhone').value,
        address: document.getElementById('custAddress').value
    };

    const result = await handleFetch('/api/customers' + (id ? `/${id}` : ''), {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
    });

    if (result) {
        showToast('Customer base updated');
        closeCustomerModal();
        loadCustomers();
    }
}

async function deleteCustomer(id) {
    if (!confirm('Permanently remove this customer from the database?')) return;
    const response = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    if (response.ok) {
        showToast('Client profile purged');
        loadCustomers();
    }
}

// SALES MANAGEMENT
async function loadSalesHistory() {
    const sales = await handleFetch('/api/sales');
    if (!sales) return;
    
    // Update Sales Metrics
    animateNumber('salesTotalCount', sales.length);
    const revenue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    document.getElementById('salesTotalRevenue').textContent = `$${revenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    const tbody = document.getElementById('salesTableBody');
    tbody.innerHTML = '';
    sales.forEach((s, index) => {
        const tr = document.createElement('tr');
        tr.style.animationDelay = `${index * 0.05}s`;
        tr.classList.add('animate-up');
        tr.innerHTML = `
            <td style="font-weight: 800;">#S-${s.id}</td>
            <td>${new Date(s.saleDate).toLocaleDateString()}</td>
            <td><span class="badge badge-primary">${s.items ? s.items.length : 0} Items</span></td>
            <td style="font-weight: 800; color: var(--success);">$${(s.totalAmount || 0).toFixed(2)}</td>
            <td><span class="badge badge-success">${s.status || 'COMPLETED'}</span></td>
            <td><button onclick="viewSaleDetails(${s.id})" class="badge badge-primary" style="border:none; cursor:pointer;">Detail</button></td>
        `;
        tbody.appendChild(tr);
    });
}

async function viewSaleDetails(id) {
    const s = await handleFetch(`/api/sales/${id}`);
    if (!s) return;
    
    document.getElementById('saleDetailTitle').textContent = `Audit Memo #S-${s.id}`;
    const content = document.getElementById('saleDetailContent');
    let itemsHtml = (s.items || []).map(item => `
        <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <div>
                <div style="font-weight: 700;">${item.productName || 'Line Item'}</div>
                <div style="font-size: 0.7rem; color: var(--text-muted);">Qty: ${item.quantity} × $${item.priceAtSale.toFixed(2)}</div>
            </div>
            <div style="font-weight: 800;">$${(item.quantity * item.priceAtSale).toFixed(2)}</div>
        </div>
    `).join('');

    content.innerHTML = `
        <div style="margin-bottom: 1.5rem;">
            <p><strong>Customer:</strong> ${s.customer ? s.customer.name : 'Guest Client'}</p>
            <p><strong>Method:</strong> ${s.paymentMethod || 'CASH'}</p>
            <p><strong>Timestamp:</strong> ${new Date(s.saleDate).toLocaleString()}</p>
        </div>
        <div style="background: rgba(255,255,255,0.02); padding: 1rem; border-radius: 8px;">
            <h4 style="margin-top: 0; color: var(--primary);">Transaction Breakdown</h4>
            ${itemsHtml}
            <div style="display: flex; justify-content: space-between; margin-top: 1.5rem; padding-top: 1rem; border-top: 2px solid var(--primary);">
                <span style="font-weight: 800; text-transform: uppercase;">Total Ledger Value</span>
                <span style="font-weight: 800; color: var(--success); font-size: 1.25rem;">$${(s.totalAmount || 0).toFixed(2)}</span>
            </div>
        </div>
    `;
    document.getElementById('saleDetailModal').style.display = 'flex';
}

function closeSaleDetailModal() {
    document.getElementById('saleDetailModal').style.display = 'none';
}

// Utilities
async function handleFetch(url, options = {}) {
    try {
        // Cache busting for GET requests
        if (!options.method || options.method === 'GET') {
            const separator = url.includes('?') ? '&' : '?';
            url = `${url}${separator}_t=${Date.now()}`;
        }

        const response = await fetch(url, options);
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                window.location.href = '/login';
                return null;
            }
            const errorText = await response.text();
            alert(`System Error: ${errorText || response.statusText}`);
            return null;
        }
        const contentType = response.headers.get("content-type");
        return (contentType && contentType.includes("application/json")) ? await response.json() : await response.text();
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
}

function showToast(msg) {
    // Simple visual feedback
    const toast = document.createElement('div');
    toast.style = "position:fixed; bottom:30px; right:30px; background:#0f172a; color:white; padding:12px 24px; border-radius:12px; box-shadow:0 10px 20px rgba(0,0,0,0.2); z-index:9999; animation:slideUp 0.4s ease forwards;";
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = "fadeIn 0.4s ease reverse forwards";
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}