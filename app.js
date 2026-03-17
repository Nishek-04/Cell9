// ==================== DATA & LOCALSTORAGE ====================
const defaultInv = [
  {id:1, brand:'Apple', model:'iPhone 13', specs:'128GB, Blue', grade:'A', price:42000, instock:true, image:''},
  {id:2, brand:'Samsung', model:'Galaxy S23 Ultra', specs:'256GB, Black', grade:'A+', price:68000, instock:true, image:''},
  {id:3, brand:'OnePlus', model:'11R', specs:'128GB, Silver', grade:'B', price:32000, instock:true, image:''}
];

const defaultLeads = [
  {id:1, name:'Ramesh K.', phone:'9876543210', model:'iPhone 13', grade:'A', time:'10:30 AM', status:'pending'}
];

let invData = JSON.parse(localStorage.getItem('cell9_inv')) || defaultInv;
let leadsData = JSON.parse(localStorage.getItem('cell9_leads')) || defaultLeads;

let nextInvId = invData.length > 0 ? Math.max(...invData.map(i=>i.id))+1 : 4;
let nextLeadId = leadsData.length > 0 ? Math.max(...leadsData.map(i=>i.id))+1 : 2;

function saveToStorage() {
  localStorage.setItem('cell9_inv', JSON.stringify(invData));
  localStorage.setItem('cell9_leads', JSON.stringify(leadsData));
  renderDash();
  renderHomeArrivals();
}

let activeEditId = null;
let activeDeviceId = null; 

// ==================== ROUTING ====================
function handleRoute() {
  let hash = window.location.hash.substring(1) || 'home';
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a=>a.classList.remove('active'));
  
  let page = document.getElementById(hash+'-page');
  if(page) page.classList.add('active');
  let link = document.getElementById('link-'+hash);
  if(link) link.classList.add('active');
  
  if(hash === 'admin') {
    showAdminView('dashboard');
  } else if(hash === 'preowned') {
    renderPreOwnedGrid();
  } else if(hash === 'details') {
    if(!activeDeviceId) {
      window.location.hash = '#preowned';
      return;
    }
    renderDeviceDetails();
  }
  window.scrollTo(0,0);
}
window.addEventListener('hashchange', handleRoute);

// Init
window.onload = () => {
  renderHomeArrivals();
  handleRoute();
  renderInv();
  renderLeads();
  renderDash();
};

// ==================== UI HELPERS ====================
function toast(msg, type='info'){
  const t=document.getElementById('toast');
  let icon = 'ℹ️';
  if(type==='success') icon = '✅';
  if(type==='error') icon = '❌';
  
  t.className=`toast show ${type}`; 
  t.innerHTML=`<span>${icon}</span> <div>${msg}</div>`;
  setTimeout(()=>{t.classList.remove('show');}, 3000);
}

function openWA(){ window.open('https://wa.me/919685030212','_blank'); }
function toggleAdminMenu() { document.getElementById('admin-sidebar').classList.toggle('show'); }

function updatePriceLabel() {
  let val = document.getElementById('filter-price').value;
  document.getElementById('price-val-label').innerText = '₹' + (val/1000) + 'K';
}

function selBrand(el, brand) {
  document.querySelectorAll('.brand-box').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
}

function calcQuote() {
  const cond = document.getElementById('s-cond').value;
  const model = document.getElementById('s-model').value.trim();
  const btn = document.getElementById('calc-btn');
  
  if(!model) {
    toast('Please enter a device model', 'error');
    return;
  }
  
  btn.innerText = "Calculating...";
  setTimeout(() => {
    let base = 25000;
    if(cond === 'Flawless') base += 5000;
    if(cond === 'Average') base -= 5000;
    if(cond === 'Broken') base -= 15000;
    
    document.getElementById('q-amount').innerText = '₹' + base.toLocaleString('en-IN');
    document.getElementById('quote-box').classList.add('show');
    btn.innerText = "Get Estimated Quote";
  }, 800);
}

function submitContact() {
  const btn = document.getElementById('send-msg-btn');
  const name = document.getElementById('cf-name').value;
  if(!name) { toast('Please provide your name', 'error'); return; }
  
  btn.innerText = "Sending...";
  setTimeout(() => {
    toast('Message sent successfully!', 'success');
    btn.innerText = "Send Inquiry";
    document.getElementById('cf-name').value = '';
    document.getElementById('cf-phone').value = '';
    document.getElementById('cf-msg').value = '';
  }, 1000);
}

function viewDevice(id) {
  activeDeviceId = id;
  window.location.hash = '#details';
}

// ==================== HOME PAGE RENDERING ====================
function renderHomeArrivals() {
  const grid = document.getElementById('home-arrivals-grid');
  const heroQuick = document.getElementById('hero-quick-links');
  
  const latest = invData.filter(i => i.instock).slice(0, 3);
  
  heroQuick.innerHTML = latest.slice(0,2).map(item => `
    <div class="hero-phone" onclick="viewDevice(${item.id})">
      <div class="hero-phone-icon">📱</div>
      <div class="hero-phone-name">${item.model}</div>
      <div class="hero-phone-price">₹${item.price.toLocaleString('en-IN')}</div>
    </div>
  `).join('');

  grid.innerHTML = latest.map((item, index) => {
    const bgStyle = item.image ? `style="background-image: url('${item.image}')"` : '';
    const imgContent = item.image ? '' : '📱';
    const badge = index === 0 ? `<div class="new-badge">New Arrival</div>` : '';

    return `
      <div class="phone-card" onclick="viewDevice(${item.id})">
        ${badge}
        <div class="phone-card-img" ${bgStyle}>${imgContent}</div>
        <div class="phone-card-body">
          <div class="phone-card-brand">${item.brand}</div>
          <div class="phone-card-name">${item.model}</div>
          <div class="phone-card-specs">${item.specs} • Grade ${item.grade}</div>
          <div class="phone-card-price">₹${item.price.toLocaleString('en-IN')}</div>
          <div class="card-actions">
            <button class="btn-secondary" onclick="event.stopPropagation(); viewDevice(${item.id})">Details</button>
            <button class="btn-primary" onclick="event.stopPropagation(); openWA()">Buy Now</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}


// ==================== DEVICE DETAILS VIEW ====================
function renderDeviceDetails() {
  const container = document.getElementById('details-content');
  const device = invData.find(i => i.id === activeDeviceId);
  
  if(!device) {
    container.innerHTML = `<div class="empty-state"><span>🔍</span>Device not found in inventory.</div>`;
    return;
  }

  const bgStyle = device.image ? `style="background-image: url('${device.image}')"` : '';
  const imgContent = device.image ? '' : '📱';

  container.innerHTML = `
    <div class="details-container">
      <div class="details-img-box" ${bgStyle}>
        ${imgContent}
      </div>
      <div class="details-info">
        <div class="details-brand">${device.brand}</div>
        <div class="details-title">${device.model}</div>
        <div class="details-price">₹${device.price.toLocaleString('en-IN')}</div>
        
        <div class="details-specs">
          <div class="spec-row">
            <span class="spec-label">Condition</span>
            <span class="spec-val">Grade ${device.grade}</span>
          </div>
          <div class="spec-row">
            <span class="spec-label">Specifications</span>
            <span class="spec-val">${device.specs}</span>
          </div>
          <div class="spec-row">
            <span class="spec-label">Availability</span>
            <span class="spec-val" style="color: ${device.instock ? 'var(--success)' : 'var(--danger)'}">${device.instock ? 'In Stock' : 'Sold Out'}</span>
          </div>
          <div class="spec-row">
            <span class="spec-label">SKU ID</span>
            <span class="spec-val">#${device.id}</span>
          </div>
        </div>

        <button class="details-buy-btn" onclick="openWA()" ${!device.instock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
          💬 Inquire on WhatsApp
        </button>
      </div>
    </div>
  `;
}

// ==================== IMAGE RESIZER ====================
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 500; 
      const MAX_HEIGHT = 500; 
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
      } else {
        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8); 
      document.getElementById('m-image-base64').value = resizedBase64;
      
      const preview = document.getElementById('m-image-preview');
      preview.style.backgroundImage = `url(${resizedBase64})`;
      preview.style.display = 'block';
    }
    img.src = e.target.result;
  }
  reader.readAsDataURL(file);
}

// ==================== PRE-OWNED GRID ====================
function renderPreOwnedGrid() {
  const grid = document.getElementById('po-grid');
  const brandFilter = document.getElementById('filter-brand').value;
  const maxPrice = parseInt(document.getElementById('filter-price').value);
  
  let filtered = invData.filter(item => item.instock);
  
  if(brandFilter !== 'All') {
    filtered = filtered.filter(item => item.brand.toLowerCase() === brandFilter.toLowerCase());
  }
  filtered = filtered.filter(item => item.price <= maxPrice);
  
  if(filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state"><span>🔍</span>No devices match your criteria.</div>`;
    document.getElementById('po-count-title').innerText = "0 devices found";
    return;
  }
  
  document.getElementById('po-count-title').innerText = `Showing ${filtered.length} device${filtered.length > 1 ? 's' : ''}`;
  
  grid.innerHTML = filtered.map(item => {
    const bgStyle = item.image ? `style="background-image: url('${item.image}')"` : '';
    const imgContent = item.image ? '' : '📱';

    return `
      <div class="phone-card" onclick="viewDevice(${item.id})">
        <div class="phone-card-img" ${bgStyle}>
          <div class="grade-tag ${item.grade.charAt(0).toLowerCase()}">Grade ${item.grade}</div>
          ${imgContent}
        </div>
        <div class="phone-card-body">
          <div class="phone-card-brand">${item.brand}</div>
          <div class="phone-card-name">${item.model}</div>
          <div class="phone-card-specs">${item.specs}</div>
          <div class="phone-card-price">₹${item.price.toLocaleString('en-IN')}</div>
          <div class="card-actions">
            <button class="btn-primary" style="width:100%;" onclick="event.stopPropagation(); openWA()">Buy Now</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ==================== ADMIN DASHBOARD ====================
function showAdminView(id){
  document.querySelectorAll('.admin-view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.admin-menu-item').forEach(m=>m.classList.remove('active'));
  document.getElementById('view-'+id).classList.add('active');
  document.getElementById('menu-'+id).classList.add('active');
  if(id==='dashboard') renderDash();
}

function renderDash(){
  document.getElementById('st-total').innerText = invData.length;
  document.getElementById('st-stock').innerText = invData.filter(i=>i.instock).length;
  document.getElementById('st-sold').innerText = invData.filter(i=>!i.instock).length;
  document.getElementById('st-leads').innerText = leadsData.filter(l=>l.status!=='closed').length;
  
  const tbody = document.getElementById('dash-leads-tbody');
  tbody.innerHTML = leadsData.slice(0,4).map(l=>`
    <tr>
      <td><strong>${l.name}</strong></td>
      <td>${l.phone}</td>
      <td><span class="status-badge ${l.status}">${l.status}</span></td>
    </tr>
  `).join('');
}

// ==================== ADMIN INVENTORY ====================
function renderInv(){
  const q = document.getElementById('inv-q').value.toLowerCase();
  const f = document.getElementById('inv-filter').value;
  const tbody = document.getElementById('inv-tbody');
  
  let list = invData.filter(item => item.model.toLowerCase().includes(q) || item.brand.toLowerCase().includes(q));
  if(f==='instock') list = list.filter(i=>i.instock);
  if(f==='sold') list = list.filter(i=>!i.instock);
  
  if(list.length===0){
    tbody.innerHTML=`<tr><td colspan="9" style="text-align:center; padding:2rem; color:var(--text2);">No devices found.</td></tr>`; return;
  }
  
  tbody.innerHTML = list.map(item=> {
    const thumb = item.image ? `<img src="${item.image}" style="width:40px;height:40px;object-fit:cover;border-radius:6px; border:1px solid var(--border);">` : '<div style="font-size:1.5rem;">📱</div>';
    return `
      <tr class="${!item.instock ? 'sold-row':''}">
        <td>${thumb}</td>
        <td>#${item.id}</td>
        <td>${item.brand}</td>
        <td><strong>${item.model}</strong></td>
        <td>${item.specs}</td>
        <td>${item.grade}</td>
        <td>₹${item.price.toLocaleString('en-IN')}</td>
        <td><span class="status-badge ${item.instock?'in':'out'}">${item.instock?'IN STOCK':'SOLD'}</span></td>
        <td>
          <div class="action-btns">
            <button class="act-btn" onclick="editDevice(${item.id})">Edit</button>
            <button class="act-btn" onclick="toggleStock(${item.id})">${item.instock?'Mark Sold':'Restock'}</button>
            <button class="act-btn del" onclick="deleteDevice(${item.id})">Delete</button>
          </div>
        </td>
      </tr>
    `
  }).join('');
}

function deleteDevice(id){
  if(confirm('Are you sure you want to delete device #'+id+'?')){
    invData = invData.filter(i=>i.id!==id);
    saveToStorage(); renderInv(); toast('Device deleted','success');
  }
}
function toggleStock(id){
  let item = invData.find(i=>i.id===id);
  if(item){ item.instock = !item.instock; saveToStorage(); renderInv(); toast('Stock status updated', 'success'); }
}

// ==================== ADMIN LEADS ====================
function renderLeads(){
  const q = document.getElementById('lead-q').value.toLowerCase();
  const tbody = document.getElementById('leads-tbody');
  let list = leadsData.filter(l=>l.name.toLowerCase().includes(q) || l.phone.includes(q));
  
  if(list.length===0){
    tbody.innerHTML=`<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text2);">No leads found.</td></tr>`; return;
  }
  
  tbody.innerHTML = list.map(l=>`
    <tr>
      <td><strong>${l.name}</strong></td>
      <td>${l.phone}</td>
      <td>${l.model} (${l.grade})</td>
      <td>${l.time}</td>
      <td><span class="status-badge ${l.status}">${l.status}</span></td>
      <td>
        <div class="action-btns">
          <button class="act-btn" onclick="updateLeadStatus(${l.id}, 'contacted')">Contacted</button>
          <button class="act-btn" onclick="updateLeadStatus(${l.id}, 'closed')">Close</button>
          <button class="act-btn del" onclick="deleteLead(${l.id})">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function deleteLead(id){
  if(confirm('Delete this lead?')){
    leadsData = leadsData.filter(l=>l.id!==id);
    saveToStorage(); renderLeads(); toast('Lead deleted','success');
  }
}
function updateLeadStatus(id, status){
  let l = leadsData.find(x=>x.id===id);
  if(l){ l.status = status; saveToStorage(); renderLeads(); toast('Lead status updated','success'); }
}

// ==================== MODALS ====================
const overlay = document.getElementById('modal-overlay');
const mbox = document.getElementById('modal-box');

function openModal(html){
  mbox.innerHTML = html;
  overlay.classList.add('open');
}
function closeModal(){ overlay.classList.remove('open'); activeEditId=null; }
function maybeCloseModal(e){ if(e.target===overlay) closeModal(); }

function openDeviceModal(){
  activeEditId = null;
  openModal(`
    <div class="modal-header"><h2 class="modal-title">Add New Device</h2><button class="modal-close" onclick="closeModal()">×</button></div>
    
    <div class="form-group">
      <label class="form-label">Upload Device Image</label>
      <input type="file" accept="image/*" class="form-control" onchange="handleImageUpload(event)" style="padding: 8px;">
      <input type="hidden" id="m-image-base64" value="">
      <div id="m-image-preview" class="img-preview-box"></div>
    </div>

    <div class="modal-row">
      <div class="form-group"><label class="form-label">Brand</label><input type="text" class="form-control" id="m-brand" placeholder="e.g. Apple"></div>
      <div class="form-group"><label class="form-label">Model</label><input type="text" class="form-control" id="m-model" placeholder="e.g. iPhone 13"></div>
    </div>
    <div class="form-group"><label class="form-label">Specifications / Color</label><input type="text" class="form-control" id="m-specs" placeholder="e.g. 128GB, Midnight Blue"></div>
    <div class="modal-row">
      <div class="form-group"><label class="form-label">Condition Grade</label><select class="form-control" id="m-grade"><option>A+</option><option>A</option><option>B</option><option>C</option></select></div>
      <div class="form-group"><label class="form-label">Price (₹)</label><input type="number" class="form-control" id="m-price" placeholder="0"></div>
    </div>
    <div class="form-group"><label class="form-label">Status</label><select class="form-control" id="m-status"><option value="true">In Stock</option><option value="false">Sold Out</option></select></div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveDevice()">Save Device</button>
    </div>
  `);
}

function editDevice(id){
  let item = invData.find(i=>i.id===id);
  if(!item) return;
  activeEditId = id;

  const bgStyle = item.image ? `style="background-image: url('${item.image}'); display:block;"` : '';

  openModal(`
    <div class="modal-header"><h2 class="modal-title">Edit Device #${id}</h2><button class="modal-close" onclick="closeModal()">×</button></div>
    
    <div class="form-group">
      <label class="form-label">Upload New Image (Optional)</label>
      <input type="file" accept="image/*" class="form-control" onchange="handleImageUpload(event)" style="padding: 8px;">
      <input type="hidden" id="m-image-base64" value="${item.image || ''}">
      <div id="m-image-preview" class="img-preview-box" ${bgStyle}></div>
    </div>

    <div class="modal-row">
      <div class="form-group"><label class="form-label">Brand</label><input type="text" class="form-control" id="m-brand" value="${item.brand}"></div>
      <div class="form-group"><label class="form-label">Model</label><input type="text" class="form-control" id="m-model" value="${item.model}"></div>
    </div>
    <div class="form-group"><label class="form-label">Specifications / Color</label><input type="text" class="form-control" id="m-specs" value="${item.specs}"></div>
    <div class="modal-row">
      <div class="form-group"><label class="form-label">Condition Grade</label><input type="text" class="form-control" id="m-grade" value="${item.grade}"></div>
      <div class="form-group"><label class="form-label">Price (₹)</label><input type="number" class="form-control" id="m-price" value="${item.price}"></div>
    </div>
    <div class="form-group"><label class="form-label">Status</label><select class="form-control" id="m-status"><option value="true" ${item.instock?'selected':''}>In Stock</option><option value="false" ${!item.instock?'selected':''}>Sold Out</option></select></div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveDevice()">Update Device</button>
    </div>
  `);
}

function saveDevice(){
  const brand=document.getElementById('m-brand').value.trim()||'Unknown';
  const model=document.getElementById('m-model').value.trim();
  const specs=document.getElementById('m-specs').value.trim();
  const grade=document.getElementById('m-grade').value;
  const price=parseInt(document.getElementById('m-price').value)||0;
  const instock=document.getElementById('m-status').value === 'true';
  const image=document.getElementById('m-image-base64').value; 
  
  if(!model){ toast('Model name is required','error'); return; }
  
  if(activeEditId){
    let item = invData.find(i=>i.id===activeEditId);
    item.brand=brand; item.model=model; item.specs=specs; item.grade=grade; item.price=price; item.instock=instock; item.image=image;
    toast('Device updated successfully','success');
  } else {
    invData.unshift({id:nextInvId++, brand, model, specs, grade, price, instock, image});
    toast('New device added','success');
  }
  saveToStorage();
  closeModal(); 
  renderInv(); 
}

function openLeadModal(){
  openModal(`
    <div class="modal-header"><h2 class="modal-title">Add Trade-in Lead</h2><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-row">
      <div class="form-group"><label class="form-label">Customer Name</label><input type="text" class="form-control" id="l-name"></div>
      <div class="form-group"><label class="form-label">Phone Number</label><input type="text" class="form-control" id="l-phone"></div>
    </div>
    <div class="modal-row">
      <div class="form-group"><label class="form-label">Device to Trade</label><input type="text" class="form-control" id="l-model" placeholder="e.g. iPhone 12"></div>
      <div class="form-group"><label class="form-label">Condition</label><select class="form-control" id="l-grade"><option>Flawless</option><option>Good</option><option>Average</option><option>Broken</option></select></div>
    </div>
    <div class="form-group"><label class="form-label">Status</label><select class="form-control" id="l-status"><option value="pending">Pending</option><option value="contacted">Contacted</option><option value="closed">Closed</option></select></div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="saveLead()">Save Lead</button>
    </div>
  `);
}

function saveLead(){
  const name=document.getElementById('l-name').value.trim();
  const phone=document.getElementById('l-phone').value.trim();
  const model=document.getElementById('l-model').value.trim();
  const grade=document.getElementById('l-grade').value;
  const status=document.getElementById('l-status').value;
  if(!name||!phone){ toast('Name and phone are required','error'); return; }
  leadsData.unshift({id:nextLeadId++,name,phone,model:model||'Unknown',grade,time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}),status});
  saveToStorage(); closeModal(); renderLeads(); toast('Lead saved','success');
}