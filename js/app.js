// =======================================================
// XPRESS AUTO SDN BHD - MAIN CONTROLLER ENGINE
// =======================================================

const CONFIG = {
  salesPhone1: "60163360198",
  salesPhone2: "60162300198",
  salesEmail: "xpressusedcar600198@gmail.com",
  businessName: "Xpress Auto Sdn Bhd",
  incorporationDate: "2022-04-15",
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
let deepLinkHandled = false;

// Lightbox state
let activeModalCar = null;
let activeGalleryIndex = 0;

// ==========================================
// 1. DATA INITIALIZATION & REAL-TIME LISTENER
// ==========================================
function updateDynamicYearsInBusiness() {
  const start = new Date(CONFIG.incorporationDate);
  const now = new Date();
  const diffYears = Math.max(1, Math.floor((now - start) / (365.25 * 24 * 60 * 60 * 1000)));
  const yearsEl = document.getElementById("heroYearsCount");
  if (yearsEl) {
    yearsEl.innerText = `${diffYears}+`;
  }
}

function getAvailableCarsOnly() {
  return allCars.filter((car) => !car.status || car.status.toLowerCase() !== "sold");
}

function createSlugFromTitle(title) {
  return (title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function initializeData() {
  updateDynamicYearsInBusiness();

  if (typeof numberPlatesData !== "undefined" && Array.isArray(numberPlatesData)) {
    allPlates = [...numberPlatesData];
    updatePlateCounters();
  }

  if (typeof firebase !== "undefined" && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.firestore();

      // 1. Live Showroom Phone & Email Settings
      db.collection("settings").doc("general").onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data();
          if (data.salesPhone1) CONFIG.salesPhone1 = data.salesPhone1;
          if (data.salesPhone2) CONFIG.salesPhone2 = data.salesPhone2;
          if (data.salesEmail) CONFIG.salesEmail = data.salesEmail;
          applyDynamicContacts();
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
          checkDeepLinkCar();
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

function applyDynamicContacts() {
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
  document.querySelectorAll("[data-sales-email]").forEach(el => {
    if (el.href && el.href.includes("?")) {
      const queryPart = el.href.split("?")[1];
      el.href = `mailto:${CONFIG.salesEmail}?${queryPart}`;
    } else {
      el.href = `mailto:${CONFIG.salesEmail}`;
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
  currentFilteredCars = getAvailableCarsOnly();
  renderInventoryPage(1);
  checkDeepLinkCar();
}

function checkDeepLinkCar() {
  if (deepLinkHandled) return;
  const params = new URLSearchParams(window.location.search);
  const carSlug = params.get("car");
  if (!carSlug) return;

  const available = getAvailableCarsOnly();
  const matched = available.find(c => createSlugFromTitle(c.title) === carSlug);
  if (matched) {
    deepLinkHandled = true;
    openCarModal(matched.id);
  }
}

function populateBrandDropdown() {
  const brandSelect = document.getElementById("brandFilter");
  if (!brandSelect) return;
  const previousVal = brandSelect.value || "All";

  const available = getAvailableCarsOnly();
  const brands = [...new Set(available.map(c => c.brand).filter(Boolean))].sort();
  brandSelect.innerHTML = `<option value="All">All Brands</option>` +
    brands.map(b => `<option value="${b}">${b}</option>`).join("");

  if (brands.includes(previousVal)) {
    brandSelect.value = previousVal;
  }
}

function updateCarCounters() {
  const availableCars = getAvailableCarsOnly();

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
  const shareURL = window.location.origin + window.location.pathname;
  const shareText = "Check out quality 100% flood-free used cars & VIP number plates at Xpress Auto Sdn Bhd (Auto City Seksyen 15, Shah Alam):";

  switch (platform) {
    case "whatsapp":
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareURL)}`, "_blank");
      break;
    case "facebook":
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareURL)}`, "_blank");
      break;
  }
}

function showToastMessage(msg) {
  const toast = document.getElementById("copyToast");
  if (toast) {
    toast.innerText = msg;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 2200);
  }
}

function copyShowroomLink() {
  const shareURL = window.location.origin + window.location.pathname;
  navigator.clipboard.writeText(shareURL).then(() => {
    showToastMessage("Showroom link copied to clipboard!");
  });
}

function copySpecificCarLink(carTitle) {
  const slug = createSlugFromTitle(carTitle);
  const deepUrl = `${window.location.origin}${window.location.pathname}?car=${encodeURIComponent(slug)}`;
  navigator.clipboard.writeText(deepUrl).then(() => {
    showToastMessage(`Direct link copied for ${carTitle}!`);
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
// 4. CAR INVENTORY RENDERING (AVAILABLE ONLY)
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
    countDisplay.innerText = `Showing ${totalResults} available vehicles in stock (Page ${currentPage} of ${totalPages})`;
  }

  if (totalResults === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 3rem 1rem;">
        <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">No available vehicles found matching your selected criteria.</p>
        <button class="btn-reset-filters" onclick="resetAllFilters()">Reset All Filters</button>
      </div>
    `;
    renderPaginationControls(0);
    return;
  }

  const startIndex = (currentPage - 1) * CONFIG.itemsPerPage;
  const pageItems = currentFilteredCars.slice(startIndex, startIndex + CONFIG.itemsPerPage);

  pageItems.forEach((car) => {
    const hasVideo = Boolean(car.videoPreview);
    const badgeClass = getDynamicBadgeClass(car.badge);
    const carPhone = car.salesPhone || CONFIG.salesPhone1;
    const priceFormatted = Number(car.price || 0).toLocaleString();

    const waText = encodeURIComponent(
      `Hi Xpress Auto Sdn Bhd Sales Team, I saw the ${car.title} (RM ${priceFormatted}) on your website. Is it available for a viewing/test drive?`
    );
    const emailSubject = encodeURIComponent(`Vehicle Inquiry: ${car.title}`);
    const emailBody = encodeURIComponent(
      `Hi Xpress Auto Sdn Bhd Sales Admin,\n\nI saw the ${car.title} (RM ${priceFormatted}) on your website and would like to inquire about availability, loan options, and viewing.\n\nThank you.`
    );

    const card = document.createElement("div");
    card.className = "car-card";
    card.innerHTML = `
      <div class="card-img-wrapper">
        <span class="badge-tag">${car.bodyType || 'Sedan'}</span>
        ${car.badge ? `<span class="badge-promo ${badgeClass}">${car.badge}</span>` : ""}
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
        <div class="car-card-price">RM ${priceFormatted}</div>
        <div class="car-card-meta">
          <span>📅 ${car.year || 'N/A'}</span>
          <span>🛣️ ${car.mileage || 'N/A'}</span>
          <span>⚙️ ${car.engine || 'Standard'}</span>
        </div>
        <div class="card-btns">
          <button class="btn-card-details" onclick="openCarModal(${car.id})">Full Specs</button>
          <a href="mailto:${CONFIG.salesEmail}?subject=${emailSubject}&body=${emailBody}" class="btn-card-email" title="Inquire via Email">✉️</a>
          <a href="https://wa.me/${carPhone}?text=${waText}" target="_blank" rel="noopener" class="btn-card-wa">💬 WhatsApp</a>
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
// 5. VIP NUMBER PLATES RENDERING (AVAILABLE ONLY)
// ==========================================
function renderPlatesGrid() {
  const grid = document.getElementById("platesGrid");
  if (!grid) return;

  grid.innerHTML = "";
  const availablePlates = allPlates.filter((p) => !p.status || p.status.toLowerCase() !== "sold");

  availablePlates.forEach((p) => {
    const priceFormatted = Number(p.price || 0).toLocaleString();
    const waText = encodeURIComponent(
      `Hi Xpress Auto Sdn Bhd Sales Team, I am interested in purchasing the VIP Number Plate ${p.plate} (RM ${priceFormatted}). Please advise on JPJ interchange transfer.`
    );
    const emailSubject = encodeURIComponent(`VIP Plate Inquiry: ${p.plate}`);
    const emailBody = encodeURIComponent(
      `Hi Xpress Auto Sdn Bhd Sales Admin,\n\nI am interested in the VIP Number Plate ${p.plate} (RM ${priceFormatted}). Please advise on availability and JPJ interchange transfer procedure.\n\nThank you.`
    );

    const card = document.createElement("div");
    card.className = "plate-card";
    card.innerHTML = `
      <div>
        <div class="plate-type">${p.type || "VIP Number Plate"}</div>
        <div class="plate-badge-box">
          <div class="plate-text">${p.plate}</div>
        </div>
        <div class="plate-package">${p.package || "Plate Number Only"}</div>
        <div class="plate-price">RM ${priceFormatted}</div>
        <div class="plate-desc">${p.description || ""}</div>
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <a href="https://wa.me/${CONFIG.salesPhone1}?text=${waText}" target="_blank" rel="noopener" class="btn-plate-wa" style="flex: 2;">
          💬 WhatsApp
        </a>
        <a href="mailto:${CONFIG.salesEmail}?subject=${emailSubject}&body=${emailBody}" class="btn-plate-email" style="flex: 1;">
          ✉️ Email
        </a>
      </div>
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

  const activeBtn = container.querySelector(".page-btn.active");
  if (activeBtn) activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
}

// ==========================================
// 7. MULTI-VARIABLE SEARCH & FILTER ENGINE
// ==========================================
function handleFilterChange() {
  const searchInput = document.getElementById("searchInput");
  const brandInput = document.getElementById("brandFilter");
  const bodyInput = document.getElementById("bodyFilter");
  const budgetInput = document.getElementById("budgetFilter");

  const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const brandVal = brandInput ? brandInput.value : "All";
  const bodyVal = bodyInput ? bodyInput.value : "All";
  const maxPrice = budgetInput ? parseInt(budgetInput.value) : 180000;

  const budgetDisplay = document.getElementById("budgetValue");
  if (budgetDisplay) budgetDisplay.innerText = maxPrice.toLocaleString();

  // Always exclude sold vehicles from customer-facing results
  currentFilteredCars = getAvailableCarsOnly().filter((car) => {
    const matchesSearch =
      (car.title && car.title.toLowerCase().includes(searchVal)) ||
      (car.description && car.description.toLowerCase().includes(searchVal)) ||
      (car.highlights && car.highlights.some((h) => h.toLowerCase().includes(searchVal)));
    
    const matchesBrand = brandVal === "All" || car.brand === brandVal;
    const matchesBody = bodyVal === "All" || car.bodyType === bodyVal;
    const matchesPrice = Number(car.price || 0) <= maxPrice;

    return matchesSearch && matchesBrand && matchesBody && matchesPrice;
  });

  renderInventoryPage(1);
}

function resetAllFilters() {
  if (document.getElementById("searchInput")) document.getElementById("searchInput").value = "";
  if (document.getElementById("brandFilter")) document.getElementById("brandFilter").value = "All";
  if (document.getElementById("bodyFilter")) document.getElementById("bodyFilter").value = "All";
  if (document.getElementById("budgetFilter")) document.getElementById("budgetFilter").value = 180000;
  handleFilterChange();
}

// ==========================================
// 8. LIGHTBOX DETAIL MODAL (WITH EMAIL & SHARE)
// ==========================================
function openCarModal(id) {
  const car = getAvailableCarsOnly().find((c) => c.id === id);
  if (!car) return;

  activeModalCar = car;
  activeGalleryIndex = 0;
  const carPhone = car.salesPhone || CONFIG.salesPhone1;
  const priceFormatted = Number(car.price || 0).toLocaleString();
  const galleryList = Array.isArray(car.gallery) && car.gallery.length > 0 ? car.gallery : [car.mainImage || "assets/brand/logo.png"];
  const safeVehicleTitle = `${car.title} (RM ${priceFormatted})`.replace(/'/g, "\\'");
  const safeRawTitle = (car.title || "").replace(/'/g, "\\'");

  const waText = encodeURIComponent(
    `Hi Xpress Auto Sdn Bhd Sales Team, I would like to inquire about the ${car.title} (RM ${priceFormatted}).`
  );
  const emailSubject = encodeURIComponent(`Vehicle Inquiry: ${car.title}`);
  const emailBody = encodeURIComponent(
    `Hi Xpress Auto Sdn Bhd Sales Admin,\n\nI would like to inquire about the following vehicle:\n• Model: ${car.title}\n• Price: RM ${priceFormatted}\n• Year: ${car.year || 'N/A'}\n• Mileage: ${car.mileage || 'N/A'}\n\nPlease advise on availability and loan options.\n\nThank you.`
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
    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.8rem; padding-right: 1.8rem;">
      <div>
        <h2 style="color: var(--accent); font-size: 1.35rem; margin-bottom: 0.3rem;">${car.title}</h2>
        <h3 style="color: var(--gold); font-size: 1.5rem; margin-bottom: 0.8rem;">RM ${priceFormatted}</h3>
      </div>
      <button type="button" onclick="copySpecificCarLink('${safeRawTitle}')" class="btn-share-car-link" title="Copy direct link to this car">
        🔗 Share Car
      </button>
    </div>
    
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
      <div><strong>Status:</strong> <span style="font-weight: 800; color: #16a34a;">AVAILABLE</span></div>
    </div>

    <div class="modal-action-buttons">
      <button type="button" onclick="closeCarModal(); openBookingModal('${safeVehicleTitle}');" class="btn-modal-book">
        📅 Book Test Drive
      </button>
      <a href="https://wa.me/${carPhone}?text=${waText}" target="_blank" rel="noopener" class="btn-modal-wa">
        💬 WhatsApp
      </a>
      <a href="mailto:${CONFIG.salesEmail}?subject=${emailSubject}&body=${emailBody}" class="btn-modal-email">
        ✉️ Email Admin
      </a>
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
function populateBookingVehicleDropdown(filterQuery = "", preselectValue = "") {
  const selectEl = document.getElementById("bookVehicle");
  if (!selectEl) return;

  const q = filterQuery.toLowerCase().trim();
  const availableCars = getAvailableCarsOnly();
  const availablePlates = allPlates.filter(p => !p.status || p.status.toLowerCase() !== "sold");

  const filteredCars = availableCars.filter(c =>
    !q ||
    (c.title && c.title.toLowerCase().includes(q)) ||
    (c.brand && c.brand.toLowerCase().includes(q)) ||
    (c.year && c.year.toString().includes(q))
  );

  const filteredPlates = availablePlates.filter(p =>
    !q ||
    (p.plate && p.plate.toLowerCase().includes(q)) ||
    (p.type && p.type.toLowerCase().includes(q))
  );

  let html = `<option value="General Showroom Visit / Browse All Stock">General Showroom Visit / Browse All Stock</option>`;

  if (filteredCars.length > 0) {
    html += `<optgroup label="🚗 Available Showroom Cars (${filteredCars.length})">`;
    filteredCars.forEach(c => {
      const label = `${c.title} (RM ${Number(c.price || 0).toLocaleString()})`;
      html += `<option value="${label}">${label}</option>`;
    });
    html += `</optgroup>`;
  }

  if (filteredPlates.length > 0) {
    html += `<optgroup label="🔢 Available VIP Number Plates (${filteredPlates.length})">`;
    filteredPlates.forEach(p => {
      const label = `VIP Plate: ${p.plate} (RM ${Number(p.price || 0).toLocaleString()})`;
      html += `<option value="${label}">${label}</option>`;
    });
    html += `</optgroup>`;
  }

  selectEl.innerHTML = html;

  if (preselectValue) {
    const matchOption = Array.from(selectEl.options).find(opt => opt.value === preselectValue);
    if (matchOption) {
      selectEl.value = preselectValue;
    }
  } else if (q && filteredCars.length > 0) {
    selectEl.selectedIndex = 1;
  }
}

function filterBookingVehicleOptions(query) {
  populateBookingVehicleDropdown(query);
}

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

  const searchInput = document.getElementById("bookVehicleSearch");
  if (searchInput) searchInput.value = "";

  populateBookingVehicleDropdown("", prefillVehicle);
  modal.style.display = "flex";
}

function closeBookingModal() {
  const modal = document.getElementById("bookingModal");
  if (modal) modal.style.display = "none";
}

function buildBookingDetails() {
  const purpose = document.getElementById("bookPurpose").value;
  const vehicle = document.getElementById("bookVehicle").value || "General Showroom Visit";
  const rawDate = document.getElementById("bookDate").value;
  const time = document.getElementById("bookTime").value;
  const name = document.getElementById("bookName").value.trim();

  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
    : rawDate;

  return { purpose, vehicle, formattedDate, time, name };
}

function submitBooking(e) {
  e.preventDefault();
  const { purpose, vehicle, formattedDate, time, name } = buildBookingDetails();

  const message =
    `Hi Xpress Auto Sdn Bhd Sales Team, I would like to book an appointment:\n\n` +
    `• *Name:* ${name}\n` +
    `• *Purpose:* ${purpose}\n` +
    `• *Vehicle / Plate:* ${vehicle}\n` +
    `• *Date:* ${formattedDate}\n` +
    `• *Time:* ${time}\n\n` +
    `Please confirm if this slot is available. Thank you!`;

  closeBookingModal();
  window.open(`https://wa.me/${CONFIG.salesPhone1}?text=${encodeURIComponent(message)}`, "_blank");
}

function submitBookingEmail() {
  const form = document.querySelector("#bookingModal form");
  if (form && !form.reportValidity()) return;

  const { purpose, vehicle, formattedDate, time, name } = buildBookingDetails();
  const subject = `Appointment Booking: ${purpose} (${name})`;
  const body =
    `Hi Xpress Auto Sdn Bhd Sales Admin,\n\n` +
    `I would like to book a showroom appointment:\n\n` +
    `• Name: ${name}\n` +
    `• Purpose: ${purpose}\n` +
    `• Vehicle / Plate: ${vehicle}\n` +
    `• Preferred Date: ${formattedDate}\n` +
    `• Preferred Time: ${time}\n\n` +
    `Please confirm if this slot is available.\n\nThank you!`;

  closeBookingModal();
  window.location.href = `mailto:${CONFIG.salesEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
// 10. TRADE-IN LEAD FORM (WHATSAPP & EMAIL)
// ==========================================
function submitTradeIn(e) {
  e.preventDefault();
  const name = document.getElementById("custName").value;
  const phone = document.getElementById("custPhone").value;
  const model = document.getElementById("tradeModel").value;
  const income = document.getElementById("monthlyIncome").value;

  const msg = encodeURIComponent(
    `Hi Xpress Auto Sdn Bhd Sales Team, my name is ${name} (${phone}). I would like to get a trade-in quote for my ${model}. My salary bracket is ${income}.`
  );
  window.open(`https://wa.me/${CONFIG.salesPhone1}?text=${msg}`, "_blank");
}

function submitTradeInEmail() {
  const form = document.querySelector("#tradein form");
  if (form && !form.reportValidity()) return;

  const name = document.getElementById("custName").value;
  const phone = document.getElementById("custPhone").value;
  const model = document.getElementById("tradeModel").value;
  const income = document.getElementById("monthlyIncome").value;

  const subject = `Trade-In Valuation Request: ${model} (${name})`;
  const body =
    `Hi Xpress Auto Sdn Bhd Sales Admin,\n\n` +
    `I would like to request a trade-in appraisal & loan pre-check:\n\n` +
    `• Name: ${name}\n` +
    `• Contact Number: ${phone}\n` +
    `• Current Car Model: ${model}\n` +
    `• Monthly Salary Bracket: ${income}\n\n` +
    `Thank you!`;

  window.location.href = `mailto:${CONFIG.salesEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ==========================================
// 11. BOOTSTRAP
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  initializeData();
  runLoanCalculation();
});
