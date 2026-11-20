# Xpress Auto Enterprise — Digital Showroom & Real-Time Inventory Platform

A serverless, cloud-native automotive showroom and inventory management platform built for **Xpress Auto Enterprise** (Auto City Seksyen 15, Shah Alam, Selangor).

🌐 **Live Site:** [https://xpress-auto.pages.dev](https://xpress-auto.pages.dev)

---

## 🏗️ System Architecture

This application uses a decoupled, zero-server-maintenance architecture optimized for sub-second edge delivery and real-time database synchronization:

* **Frontend Layer:** Semantic HTML5, responsive CSS Grid/Flexbox, and modular Vanilla JavaScript (`app.js`, `careers.js`) with zero heavy framework overhead.
* **Cloud Database:** **Google Firebase Firestore** (NoSQL document store) using real-time `onSnapshot` listeners for instant state propagation across desktop and mobile clients, backed by static local fallback modules (`cars.js`, `plates.js`, `careers.js`).
* **Authentication & Authorization:** **Firebase Authentication** (Email/Password JWT sessions) paired with granular **Firestore Security Rules** enforcing public read-only access for buyers and authenticated write-only privileges for administrators.
* **Edge Hosting & CI/CD:** **Cloudflare Pages** connected to GitHub for automated Git-triggered builds and global CDN distribution.

---

## ✨ Key Features

### Public Showroom (`index.html`)
* **Real-Time Vehicle & VIP Plate Catalog:** Multi-variable filtering by keyword, dynamically populated brand list, body type, availability status (`Available` / `Sold`), and budget slider.
* **Interactive Lightbox Gallery:** Multi-photo vehicle viewer with keyboard navigation (`←` / `→` / `Esc`), thumbnail strip, key upgrade chips, and hover video previews.
* **Structured WhatsApp Booking Engine:** Guided appointment modal capturing visit purpose (*Test Drive*, *Car Viewing*, *Trade-In Valuation*, *VIP Plate*, or *Loan Consultation*), date, and time slot before generating a pre-formatted WhatsApp inquiry.
* **Hire Purchase Loan Calculator & Trade-In Appraisal:** Instant monthly installment estimator with document checklists and direct WhatsApp valuation submission.
* **Live Careers Portal:** Dynamic *Jawatan Kosong* modal synchronized with Firestore.

### Admin Dashboard (`admin.html`)
* **Firebase Auth Gate:** Protected administrative dashboard with session persistence and sign-out controls.
* **3-Tab Inventory Control:** Full CRUD management for **Showroom Cars**, **VIP Number Plates**, and **Career Vacancies**.
* **Dual-Mode Vehicle Entry:** Standard guided form for non-technical staff alongside a **Quick JSON Paste** importer for rapid bulk/single listing ingestion.
* **Atomic Ordering & Backup Engine:** Batch-updated `orderIndex` positioning (`▲`, `▼`, `🔝 Top`, `🔻 Bottom`) and one-click `.js` backup exports (`cars.js`, `plates.js`, `careers.js`) for version-controlled disaster recovery.

---

## 📂 Project Structure

```text
├── index.html      # Main customer-facing showroom & booking interface
├── admin.html      # Firebase Auth-protected 3-tab inventory & CMS dashboard
├── app.js          # Core controller: Firestore listeners, filtering, pagination & modals
├── careers.js      # Live careers modal controller & fallback job data
├── cars.js         # Local fallback vehicle database & backup export target
├── plates.js       # Local fallback VIP registration plates & backup export target
├── style.css       # Responsive design tokens, grid layouts & mobile UI rules
└── assets/         # Brand logos and static media assets
