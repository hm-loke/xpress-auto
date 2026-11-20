// =======================================================
// XPRESS AUTO ENTERPRISE - MAIN CONTROLLER ENGINE
// =======================================================

const CONFIG = {
  salesPhone1: "60163360198",
  salesPhone2: "60162300198",
  businessName: "Xpress Auto Enterprise",
  ssm: "001793213-V",
  itemsPerPage: 6
};

// Firebase Web Keys
const firebaseConfig = {
  apiKey: "AIzaSyBm8-nZfajStErxzDQpbABdrY4ivBLEETg",
  authDomain: "xpress-auto.firebaseapp.com",
  projectId: "xpress-auto",
  storageBucket: "xpress-auto.firebasestorage.app",
  messagingSenderId: "946329347755",
  appId: "1:946329347755:web:ba70ca8185b8e240ee39ee"
};

let allCars = [];
let allPlates = [];
let currentView = "cars";
let currentPage = 1;
let currentFilteredCars = [];
let db = null;

// Lightbox state
let activeModalCar = null;
let activeGalleryIndex = 0;

// ==========================================
// 1. DATA INITIALIZATION & REAL-TIME LISTENER
// ==========================================
function initializeData() {
  // Load fallback VIP Plates first
  if (typeof numberPlatesData !== "undefined" && Array.isArray(numberPlatesData)) {
    allPlates = [...numberPlatesData];
    updatePlateCounters();
  }

  // Initialize Firebase Real-Time Firestore
  if (typeof firebase !== "undefined" && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.firestore();

      // 1. Live Showroom Phone Settings
      db.collection("settings").doc("general").onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data();
          if (data.salesPhone1) CONFIG.salesPhone1 = data.salesPhone1;
          if (data.salesPhone2) CONFIG.salesPhone2 = data.salesPhone2;
          applyDynamicPhones();
        }
      });

      // 2. Live Cars Inventory
      db.collection("cars").onSnapshot((snapshot) => {
        if (!snapshot.empty) {
          allCars = [];
          snapshot.forEach((doc) => {
            allCars.push({ docId: doc.id, ...doc.data() });
          });

          allCars.sort((a, b) => {
            const orderA = a.orderIndex !== undefined ? a.orderIndex : 9999;
            const orderB = b.orderIndex !== undefined ? b.orderIndex : 9999;
            if (orderA !== orderB) return orderA - orderB;
            if (a.createdAt && b.createdAt) return b.createdAt.toMillis() - a.createdAt.toMillis();
            return 0;
          });

          allCars.forEach((car, i) => { car.id = i + 1; });

          populateBrandDropdown();
          updateCarCounters();
          handleFilterChange();
        } else {
          loadFallbackCars();
        }
      }, (err) => {
        console.warn("Firestore cars listener failed, using cars.js fallback:", err);
        loadFallbackCars();
      });

      // 3. Live VIP Number Plates
      db.collection("plates").onSnapshot((snapshot) => {
        if (!snapshot.empty) {
          allPlates = [];
          snapshot.forEach((doc) => {
            allPlates.push({ docId: doc.id, ...doc.data() });
          });

          allPlates.sort((a, b) => {
            const orderA = a.orderIndex !== undefined ? a.orderIndex : 9999;
            const orderB = b.orderIndex !== undefined ? b.orderIndex : 9999;
            if (orderA !== orderB) return orderA - orderB;
            return 0;
          });

          updatePlateCounters();
          if (currentView === "plates") renderPlatesGrid();
        }
      });

      return;
    } catch (e) {
      console.warn("Firebase init error, using local fallback:", e);
    }
  }

  loadFallbackCars();
}

function formatMalaysiaPhoneDisplay(raw) {
  if (!raw) return "";
  const local = raw.startsWith("60") ? "0" + raw.slice(2) : raw;
  return local.length >= 10 ? `${local.slice(0, 3)}-${local.slice(3, 6)} ${local.slice(6)}` : local;
}

function applyDynamicPhones() {
  document.querySelectorAll("[data-sales-wa]").forEach(el => {
    el.href = `https://wa.me/${CONFIG.salesPhone1}`;
  });
  document.querySelectorAll("[data-sales-tel]").forEach(el => {
    el.href = `tel:+${CONFIG.salesPhone1}`;
    if (el.innerText.includes("(Sales)")) {
      el.innerText = `📞 ${formatMalaysiaPhoneDisplay(CONFIG.salesPhone1)} (Sales)`;
    }
  });
  document.querySelectorAll("[data-office-tel]").forEach(el => {
    el.href = `tel:+${CONFIG.salesPhone2}`;
    if (el.innerText.includes("(Office)")) {
      el.innerText = `📞 ${formatMalaysiaPhoneDisplay(CONFIG.salesPhone2)} (Office)`;
    }
  });
}

function loadFallbackCars() {
  if (typeof carsData !== "undefined" && Array.isArray(carsData)) {
    allCars = carsData.map((car, index) => ({
      id: index + 1,
      ...car
    }));
  }
  populateBrandDropdown();
  updateCarCounters();
  currentFilteredCars = [...allCars];
  renderInventoryPage(1);
}

function populateBrandDropdown() {
  const brandSelect = document.getElementById("brandFilter");
  if (!brandSelect) return;
  const previousVal = brandSelect.value || "All";

  const brands = [...new Set(allCars.map(c => c.brand).filter(Boolean))].sort();
  brandSelect.innerHTML = `<option value="All">All Brands</option>` +
    brands.map(b => `<option value="${b}">${b}</option>`).join("");

  if (brands.includes(previousVal)) {
    brandSelect.value = previousVal;
  }
}

function updateCarCounters() {
  const availableCars = allCars.filter(
    (car) => !car.status || car.status.toLowerCase() !== "sold"
  );

  const carCountEl = document.getElementById("countCarsBadge");
  const heroCountEl = document.getElementById("heroCarCount");

  if (carCountEl) carCountEl.innerText = availableCars.length;
  if (heroCountEl) heroCountEl.innerText = `${availableCars.length}+`;
}

function updatePlateCounters() {
  const availablePlates = allPlates.filter(
    (p) => !p.status || p.status.toLowerCase() !== "sold"
  );
  const plateCountEl = document.getElementById("countPlatesBadge");
  if (plateCountEl) plateCountEl.innerText = availablePlates.length;
}

// ==========================================
// 2. SOCIAL SHARING HANDLER
// ==========================================
function shareShowroom(platform) {
  const shareURL = window.location.href;
  const shareText = "Check out quality 100% flood-free used cars & VIP number plates at Xpress Auto Enterprise (Auto City Seksyen 15, Shah Alam):";

  switch (platform) {
    case "whatsapp":
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareURL)}`, "_blank");
      break;
    case "facebook":
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareURL)}`, "_blank");
      break;
  }
}

function copyShowroomLink() {
  const shareURL = window.location.href;
  navigator.clipboard.writeText(shareURL).then(() => {
    const toast = document.getElementById("copyToast");
    if (toast) {
      toast.classList.remove("hidden");
      setTimeout(() => toast.classList.add("hidden"), 2000);
    }
  });
}

// ==========================================
// 3. CATEGORY SWITCHER (CARS vs PLATES)
// ==========================================
function switchViewCategory(category) {
  currentView = category;

  const tabCars = document.getElementById("tabCars");
  const tabPlates = document.getElementById("tabPlates");
  const filterWrapper = document.getElementById("carFilterWrapper");
  const carsView = document.getElementById("carsViewContainer");
  const platesView = document.getElementById("platesViewContainer");

  if (category === "cars") {
    if (tabCars) tabCars.classList.add("active");
    if (tabPlates) tabPlates.classList.remove("active");
    if (filterWrapper) filterWrapper.classList.remove("hidden");
    if (carsView) carsView.classList.remove("hidden");
    if (platesView) platesView.classList.add("hidden");
    renderInventoryPage(1);
  } else {
    if (tabPlates) tabPlates.classList.add("active");
    if (tabCars) tabCars.classList.remove("active");
    if (filterWrapper) filterWrapper.classList.add("hidden");
    if (carsView) carsView.classList.add("hidden");
    if (platesView) platesView.classList.remove("hidden");
    renderPlatesGrid();
  }

  const inventorySec = document.getElementById("inventory");
  if (inventorySec) {
    inventorySec.scrollIntoView({ behavior: "smooth" });
  }
}

// ==========================================
// 4. CAR INVENTORY RENDERING
// ==========================================
function getDynamicBadgeClass(badge) {
  if (!badge) return "badge-blue";
  const b = badge.toLowerCase();
  if (b.includes("mileage") || b.includes("warranty") || b.includes("saver") || b.includes("promo")) return "badge-green";
  if (b.includes("vip") || b.includes("sc") || b.includes("luxury") || b.includes("special") || b.includes("executive")) return "badge-gold";
  if (b.includes("amg") || b.includes("jdm") || b.includes("turbo") || b.includes("rs") || b.includes("performance") || b.includes("kit")) return "badge-red";
  return "badge-blue";
}

function renderInventoryPage(page = 1) {
  currentPage = page;
  const grid = document.getElementById("carGrid");
  if (!grid) return;

  grid.innerHTML = "";
  const totalResults = currentFilteredCars.length;
  const totalPages = Math.ceil(totalResults / CONFIG.itemsPerPage) || 1;

  const countDisplay = document.getElementById("resultsCount");
  if (countDisplay) {
    countDisplay.innerText = `Showing ${totalResults} vehicles in stock (Page ${currentPage} of ${totalPages})`;
  }

  if (totalResults === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 3rem 1rem;">
        <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">No vehicles found matching your selected criteria.</p>
        <button class="btn-reset-filters" onclick="resetAllFilters()">Reset All Filters</button>
      </div>
    `;
    renderPaginationControls(0);
    return;
  }

  const startIndex = (currentPage - 1) * CONFIG.itemsPerPage;
  const pageItems = currentFilteredCars.slice(startIndex, startIndex + CONFIG.itemsPerPage);

  pageItems.forEach((car) => {
    const isSold = car.status && car.status.toLowerCase() === "sold";
    const hasVideo = Boolean(car.videoPreview);
    const badgeClass = getDynamicBadgeClass(car.badge);
    const carPhone = car.salesPhone || CONFIG.salesPhone1;

    const waText = encodeURIComponent(
      isSold
        ? `Hi Xpress Auto Sales Team, I saw the ${car.title} was sold on your website. Do you have any other similar units available?`
        : `Hi Xpress Auto Sales Team, I saw the ${car.title} (RM ${Number(car.price || 0).toLocaleString()}) on your website. Is it available for a viewing/test drive?`
    );

    const card = document.createElement("div");
    card.className = `car-card ${isSold ? "is-sold" : ""}`;
    card.innerHTML = `
      <div class="card-img-wrapper">
        <span class="badge-tag">${car.bodyType || 'Sedan'}</span>
        ${
          isSold
            ? `<span class="badge-sold-ribbon">TELAH DIJUAL / SOLD</span>`
            : car.badge
            ? `<span class="badge-promo ${badgeClass}">${car.badge}</span>`
            : ""
        }
        <img src="${car.mainImage || 'assets/brand/logo.png'}" alt="${car.title}" class="car-card-img" onclick="openCarModal(${car.id})" loading="lazy" onerror="this.src='assets/brand/logo.png'">
        ${
          hasVideo
            ? `
              <video class="car-card-video" src="${car.videoPreview}" muted loop playsinline preload="none"></video>
              <span class="video-badge-indicator">▶ Video</span>
            `
            : ""
        }
      </div>
      <div class="car-card-body">
        <div class="car-card-title">${car.title}</div>
        <div class="car-card-price">
          ${
            isSold
              ? `<span style="text-decoration: line-through; color: #94a3b8; font-size: 1.05rem;">RM ${Number(car.price || 0).toLocaleString()}</span> <span style="color: #dc2626; font-size: 1.1rem; font-weight: 900;">[SOLD]</span>`
              : `RM ${Number(car.price || 0).toLocaleString()}`
          }
        </div>
        <div class="car-card-meta">
          <span>📅 ${car.year || 'N/A'}</span>
          <span>🛣️ ${car.mileage || 'N/A'}</span>
          <span>⚙️ ${car.engine || 'Standard'}</span>
        </div>
        <div class="card-btns">
          <button class="btn-card-details" onclick="openCarModal(${car.id})">Full Specs</button>
          ${
            isSold
              ? `<a href="https://wa.me/${carPhone}?text=${waText}" target="_blank" rel="noopener" class="btn-card-sold">🚫 Sold (Ask Similar)</a>`
              : `<a href="https://wa.me/${carPhone}?text=${waText}" target="_blank" rel="noopener" class="btn-card-wa">💬 WhatsApp</a>`
          }
        </div>
      </div>
    `;

    if (hasVideo) {
      const vid = card.querySelector(".car-card-video");
      card.addEventListener("mouseenter", () => { if (vid) vid.play().catch(() => {}); });
      card.addEventListener("mouseleave", () => { if (vid) { vid.pause(); vid.currentTime = 0; } });
    }

    grid.appendChild(card);
  });

  renderPaginationControls(totalResults);
}

// ==========================================
// 5. VIP NUMBER PLATES RENDERING
// ==========================================
function renderPlatesGrid() {
  const grid = document.getElementById("platesGrid");
  if (!grid) return;

  grid.innerHTML = "";

  allPlates.forEach((p) => {
    const isSold = p.status && p.status.toLowerCase() === "sold";
    const waText = encodeURIComponent(
      isSold
        ? `Hi Xpress Auto Sales Team, I saw VIP Plate ${p.plate} was sold on your website. Do you have other similar 2-digit plates?`
        : `Hi Xpress Auto Sales Team, I am interested in purchasing the VIP Number Plate ${p.plate} (RM ${Number(p.price || 0).toLocaleString()}). Please advise on JPJ interchange transfer.`
    );

    const card = document.createElement("div");
    card.className = `plate-card ${isSold ? "is-sold-plate" : ""}`;
    card.innerHTML = `
      <div>
        <div class="plate-type">${p.type || "VIP Number Plate"}</div>
        <div class="plate-badge-box">
          <div class="plate-text">${p.plate}</div>
        </div>
        <div class="plate-package">${p.package || "Plate Number Only"}</div>
        <div class="plate-price">
          ${
            isSold
              ? `<span style="text-decoration: line-through; color: #64748b; font-size: 1.1rem;">RM ${Number(p.price || 0).toLocaleString()}</span> <span style="color: #ef4444; font-size: 1.15rem;">[SOLD]</span>`
              : `RM ${Number(p.price || 0).toLocaleString()}`
          }
        </div>
        <div class="plate-desc">${p.description || ""}</div>
      </div>
      <a href="https://wa.me/${CONFIG.salesPhone1}?text=${waText}" target="_blank" rel="noopener" class="btn-plate-wa" style="${isSold ? 'background:#475569;' : ''}">
        ${isSold ? `🚫 Sold (Ask Similar Plates)` : `💬 WhatsApp for ${p.plate}`}
      </a>
    `;
    grid.appendChild(card);
  });
}

// ==========================================
// 6. PAGINATION CONTROLS
// ==========================================
function renderPaginationControls(totalItems) {
  const container = document.getElementById("paginationControls");
  if (!container) return;

  container.innerHTML = "";
  const totalPages = Math.ceil(totalItems / CONFIG.itemsPerPage);
  if (totalPages <= 1) return;

  const prevBtn = document.createElement("button");
  prevBtn.className = "page-btn";
  prevBtn.innerText = "← Previous";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    if (currentPage > 1) {
      renderInventoryPage(currentPage - 1);
      document.getElementById("inventory").scrollIntoView({ behavior: "smooth" });
    }
  };
  container.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const numBtn = document.createElement("button");
    numBtn.className = `page-btn ${i === currentPage ? "active" : ""}`;
    numBtn.innerText = i;
    numBtn.onclick = () => {
      renderInventoryPage(i);
      document.getElementById("inventory").scrollIntoView({ behavior: "smooth" });
    };
    container.appendChild(numBtn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.className = "page-btn";
  nextBtn.innerText = "Next →";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      renderInventoryPage(currentPage + 1);
      document.getElementById("inventory").scrollIntoView({ behavior: "smooth" });
    }
  };
  container.appendChild(nextBtn);
}

// ==========================================
// 7. MULTI-VARIABLE SEARCH & FILTER ENGINE
// ==========================================
function handleFilterChange() {
  const searchInput = document.getElementById("searchInput");
  const brandInput = document.getElementById("brandFilter");
  const bodyInput = document.getElementById("bodyFilter");
  const statusInput = document.getElementById("statusFilter");
  const budgetInput = document.getElementById("budgetFilter");

  const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const brandVal = brandInput ? brandInput.value : "All";
  const bodyVal = bodyInput ? bodyInput.value : "All";
  const statusVal = statusInput ? statusInput.value : "All";
  const maxPrice = budgetInput ? parseInt(budgetInput.value) : 180000;

  const budgetDisplay = document.getElementById("budgetValue");
  if (budgetDisplay) budgetDisplay.innerText = maxPrice.toLocaleString();

  currentFilteredCars = allCars.filter((car) => {
    const matchesSearch =
      (car.title && car.title.toLowerCase().includes(searchVal)) ||
      (car.description && car.description.toLowerCase().includes(searchVal)) ||
      (car.highlights && car.highlights.some((h) => h.toLowerCase().includes(searchVal)));
    
    const matchesBrand = brandVal === "All" || car.brand === brandVal;
    const matchesBody = bodyVal === "All" || car.bodyType === bodyVal;
    
    const isCarSold = car.status && car.status.toLowerCase() === "sold";
    let matchesStatus = true;
    if (statusVal === "Available") {
      matchesStatus = !isCarSold;
    } else if (statusVal === "Sold") {
      matchesStatus = isCarSold;
    }

    const matchesPrice = Number(car.price || 0) <= maxPrice;

    return matchesSearch && matchesBrand && matchesBody && matchesStatus && matchesPrice;
  });

  renderInventoryPage(1);
}

function resetAllFilters() {
  if (document.getElementById("searchInput")) document.getElementById("searchInput").value = "";
  if (document.getElementById("brandFilter")) document.getElementById("brandFilter").value = "All";
  if (document.getElementById("bodyFilter")) document.getElementById("bodyFilter").value = "All";
  if (document.getElementById("statusFilter")) document.getElementById("statusFilter").value = "All";
  if (document.getElementById("budgetFilter")) document.getElementById("budgetFilter").value = 180000;
  handleFilterChange();
}

// ==========================================
// 8. LIGHTBOX DETAIL MODAL (WITH BOOKING CTA)
// ==========================================
function openCarModal(id) {
  const car = allCars.find((c) => c.id === id);
  if (!car) return;

  activeModalCar = car;
  activeGalleryIndex = 0;
  const isSold = car.status && car.status.toLowerCase() === "sold";
  const carPhone = car.salesPhone || CONFIG.salesPhone1;
  const galleryList = Array.isArray(car.gallery) && car.gallery.length > 0 ? car.gallery : [car.mainImage || "assets/brand/logo.png"];
  const safeVehicleTitle = (car.title || "").replace(/'/g, "\\'");

  const waText = encodeURIComponent(
    isSold
      ? `Hi Xpress Auto Sales Team, I saw the ${car.title} was sold on your website. Do you have any similar cars in showroom stock?`
      : `Hi Xpress Auto Sales Team, I would like to inquire about the ${car.title} (RM ${Number(car.price || 0).toLocaleString()}).`
  );
  const content = document.getElementById("modalContent");

  const thumbsHTML = galleryList.map((img, index) =>
    `<img src="${img}" onclick="jumpModalGallery(${index})" alt="Thumbnail ${index + 1}" class="modal-thumb ${index === 0 ? "active-thumb" : ""}" onerror="this.src='assets/brand/logo.png'">`
  ).join("");

  const highlightsHTML = car.highlights && car.highlights.length > 0
    ? `
      <div class="modal-highlights-section">
        <strong>Key Highlights & Upgrades:</strong>
        <div class="highlights-grid">
          ${car.highlights.map((h) => `<span class="highlight-chip">✓ ${h}</span>`).join("")}
        </div>
      </div>
    `
    : "";

  content.innerHTML = `
    <h2 style="color: var(--accent); font-size: 1.35rem; margin-bottom: 0.3rem;">${car.title}</h2>
    <h3 style="color: ${isSold ? "#dc2626" : "var(--gold)"}; font-size: 1.5rem; margin-bottom: 0.8rem;">
      ${
        isSold
          ? `<span style="text-decoration: line-through; color: #94a3b8; font-size: 1.2rem;">RM ${Number(car.price || 0).toLocaleString()}</span> [TELAH DIJUAL / SOLD]`
          : `RM ${Number(car.price || 0).toLocaleString()}`
      }
    </h3>
    
    <div class="modal-main-img-wrapper">
      <img id="mainModalImg" src="${galleryList[0]}" class="modal-main-img" alt="${car.title}" onerror="this.src='assets/brand/logo.png'">
      ${galleryList.length > 1 ? `
        <button type="button" class="modal-nav-arrow modal-nav-prev" onclick="shiftModalGallery(-1)" aria-label="Previous image">‹</button>
        <button type="button" class="modal-nav-arrow modal-nav-next" onclick="shiftModalGallery(1)" aria-label="Next image">›</button>
      ` : ''}
    </div>
    
    <div class="modal-thumbnails-wrapper">
      ${thumbsHTML}
    </div>

    ${highlightsHTML}

    <div class="modal-desc-box">
      <strong>Showroom Notes:</strong><br>
      ${car.description || "Puspakom inspected, 100% flood-free guaranteed, and test-drive ready."}
    </div>
    
    <div class="modal-specs">
      <div><strong>Manufacture Year:</strong> ${car.year || 'N/A'}</div>
      <div><strong>Mileage:</strong> ${car.mileage || 'N/A'}</div>
      <div><strong>Engine Spec:</strong> ${car.engine || 'Standard'}</div>
      <div><strong>Transmission:</strong> ${car.transmission || 'Automatic'}</div>
      <div><strong>Fuel Type:</strong> ${car.fuel || "Petrol"}</div>
      <div><strong>Status:</strong> <span style="font-weight: 800; color: ${isSold ? "#dc2626" : "#16a34a"};">${isSold ? "SOLD" : "AVAILABLE"}</span></div>
    </div>

    <div class="modal-action-buttons">
      ${
        isSold
          ? `<a href="https://wa.me/${carPhone}?text=${waText}" target="_blank" rel="noopener" class="btn-modal-wa" style="background: #475569;">
               💬 WhatsApp Sales Team (Ask for Similar Cars)
             </a>`
          : `<button type="button" onclick="closeCarModal(); openBookingModal('${safeVehicleTitle}');" class="btn-modal-book">
               📅 Book Test Drive
             </button>
             <a href="https://wa.me/${carPhone}?text=${waText}" target="_blank" rel="noopener" class="btn-modal-wa">
               💬 Quick WhatsApp
             </a>`
      }
      <a href="#calculator" onclick="prefillCalculator(${car.price || 0})" class="btn-modal-calc">
        📊 Loan Calc
      </a>
    </div>
  `;

  document.getElementById("detailModal").style.display = "flex";
}

function jumpModalGallery(index) {
  if (!activeModalCar) return;
  const list = Array.isArray(activeModalCar.gallery) && activeModalCar.gallery.length > 0 ? activeModalCar.gallery : [activeModalCar.mainImage];
  if (index < 0 || index >= list.length) return;
  activeGalleryIndex = index;

  document.getElementById("mainModalImg").src = list[activeGalleryIndex];
  const allThumbs = document.querySelectorAll(".modal-thumb");
  allThumbs.forEach((t, i) => {
    t.classList.toggle("active-thumb", i === activeGalleryIndex);
    if (i === activeGalleryIndex) t.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  });
}

function shiftModalGallery(step) {
  if (!activeModalCar) return;
  const list = Array.isArray(activeModalCar.gallery) && activeModalCar.gallery.length > 0 ? activeModalCar.gallery : [activeModalCar.mainImage];
  let nextIndex = activeGalleryIndex + step;
  if (nextIndex < 0) nextIndex = list.length - 1;
  if (nextIndex >= list.length) nextIndex = 0;
  jumpModalGallery(nextIndex);
}

function closeCarModal() {
  document.getElementById("detailModal").style.display = "none";
}

// ==========================================
// 8B. TEST DRIVE & APPOINTMENT BOOKING MODAL
// ==========================================
function openBookingModal(prefillVehicle = "") {
  const modal = document.getElementById("bookingModal");
  if (!modal) return;

  const dateInput = document.getElementById("bookDate");
  if (dateInput && !dateInput.value) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.value = tomorrow.toISOString().split("T")[0];
    dateInput.min = new Date().toISOString().split("T")[0];
  }

  const vehicleInput = document.getElementById("bookVehicle");
  if (vehicleInput && prefillVehicle) {
    vehicleInput.value = prefillVehicle;
  }

  modal.style.display = "flex";
}

function closeBookingModal() {
  const modal = document.getElementById("bookingModal");
  if (modal) modal.style.display = "none";
}

function submitBooking(e) {
  e.preventDefault();
  const purpose = document.getElementById("bookPurpose").value;
  const vehicle = document.getElementById("bookVehicle").value.trim() || "General Showroom Visit";
  const rawDate = document.getElementById("bookDate").value;
  const time = document.getElementById("bookTime").value;
  const name = document.getElementById("bookName").value.trim();

  const formattedDate = rawDate ? new Date(rawDate).toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : rawDate;

  const message =
    `Hi Xpress Auto Sales Team, I would like to book an appointment:\n\n` +
    `• *Name:* ${name}\n` +
    `• *Purpose:* ${purpose}\n` +
    `• *Vehicle / Plate:* ${vehicle}\n` +
    `• *Date:* ${formattedDate}\n` +
    `• *Time:* ${time}\n\n` +
    `Please confirm if this slot is available. Thank you!`;

  closeBookingModal();
  window.open(`https://wa.me/${CONFIG.salesPhone1}?text=${encodeURIComponent(message)}`, "_blank");
}

window.onclick = function (e) {
  const detailModal = document.getElementById("detailModal");
  const careerModal = document.getElementById("careerModal");
  const bookingModal = document.getElementById("bookingModal");
  if (e.target === detailModal) closeCarModal();
  if (e.target === careerModal) closeCareerModal();
  if (e.target === bookingModal) closeBookingModal();
};

window.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeCarModal();
    closeCareerModal();
    closeBookingModal();
  }
  const detailModal = document.getElementById("detailModal");
  if (detailModal && detailModal.style.display === "flex") {
    if (e.key === "ArrowLeft") shiftModalGallery(-1);
    if (e.key === "ArrowRight") shiftModalGallery(1);
  }
});

// ==========================================
// 9. LOAN CALCULATOR
// ==========================================
function runLoanCalculation() {
  const price = parseFloat(document.getElementById("calcPrice").value) || 0;
  const down = parseFloat(document.getElementById("calcDown").value) || 0;
  const rate = parseFloat(document.getElementById("calcRate").value) || 3.5;
  const years = parseInt(document.getElementById("calcYears").value);

  const loanAmount = price - down;
  const resultDisplay = document.getElementById("calcResultDisplay");

  if (loanAmount <= 0) {
    resultDisplay.innerText = "Down payment exceeds selling price.";
    return;
  }

  const interestTotal = loanAmount * (rate / 100) * years;
  const totalPayable = loanAmount + interestTotal;
  const monthly = Math.round(totalPayable / (years * 12));

  resultDisplay.innerHTML = `Estimated Monthly Payment: <strong>RM ${monthly.toLocaleString()} / month</strong>`;
}

function prefillCalculator(price) {
  closeCarModal();
  const priceInput = document.getElementById("calcPrice");
  const downInput = document.getElementById("calcDown");

  if (priceInput && downInput) {
    priceInput.value = price;
    downInput.value = Math.round(price * 0.1);
    runLoanCalculation();
  }
}

// ==========================================
// 10. TRADE-IN LEAD FORM
// ==========================================
function submitTradeIn(e) {
  e.preventDefault();
  const name = document.getElementById("custName").value;
  const phone = document.getElementById("custPhone").value;
  const model = document.getElementById("tradeModel").value;
  const income = document.getElementById("monthlyIncome").value;

  const msg = encodeURIComponent(
    `Hi Xpress Auto Sales Team, my name is ${name} (${phone}). I would like to get a trade-in quote for my ${model}. My salary bracket is ${income}.`
  );
  window.open(`https://wa.me/${CONFIG.salesPhone1}?text=${msg}`, "_blank");
}

// ==========================================
// 11. BOOTSTRAP
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  initializeData();
  runLoanCalculation();
});
