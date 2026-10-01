// =======================================================
// XPRESS AUTO & GOLDEN HOUSE - CAREERS & JOB VACANCIES
// =======================================================

const careersData = [
  {
    id: "runner-ops-2026",
    title: "Pembantu Operasi / Runner",
    department: "Logistics & Operations",
    location: "Bandar Bukit Raja / Shah Alam, Selangor",
    type: "Full-Time (Non-Executive)",
    salary: "RM 1,800 - RM 2,000 / month",
    allowance: "+ RM50 Elaun Katering/Acara + OT",
    workingHours: "Isnin – Sabtu (8:00 AM – 5:30 PM)",
    minEducation: "SPM",
    license: "Lesen Memandu Kelas D Sah",
    experience: "< 1 Tahun / Pengalaman Pemandu/Runner Dialu-alukan",
    badge: "Hiring Immediately",
    summary: "Membantu operasi harian penghantaran kenderaan terpakai, pembelian barang syarikat, serta penghantaran & persediaan katering.",
    responsibilities: [
      "Membeli bahan mentah, barangan runcit dan keperluan operasi syarikat.",
      "Menghantar dan mengambil kenderaan bagi urusan jual beli kereta terpakai.",
      "Membantu penghantaran makanan katering, penyediaan buffet & pemasangan peralatan di lokasi pelanggan.",
      "Mengutip semula peralatan katering selepas majlis selesai dan membantu pembungkusan.",
      "Menghantar atau mengambil kakitangan syarikat, pelanggan atau Pengarah apabila diperlukan.",
      "Memastikan kenderaan syarikat sentiasa bersih, selamat dan dalam keadaan baik.",
      "Membantu menyusun stok, menjaga kebersihan stor dan kawasan kerja operasi."
    ],
    requirements: [
      "Warganegara Malaysia (Lelaki, berumur 21–40 tahun).",
      "Mempunyai Lesen Memandu Malaysia (Kelas D) yang sah.",
      "Rajin, jujur, bertanggungjawab, berdisiplin dan menepati masa.",
      "Sihat tubuh badan serta berkemampuan mengangkat barang & peralatan katering.",
      "Boleh bekerja lebih masa (OT) atau hujung minggu sekiranya diperlukan.",
      "Pengalaman sebagai pemandu, runner atau dalam bidang katering adalah satu kelebihan."
    ],
    benefits: [
      "Gaji Asas: RM 1,800 - RM 2,000",
      "Elaun Katering RM50 bagi setiap acara",
      "Bayaran Kerja Lebih Masa (OT)",
      "Caruman wajib KWSP (EPF), PERKESO (SOCSO) & EIS",
      "Cuti Tahunan & Cuti Sakit bergaji",
      "Bonus tahunan berdasarkan prestasi syarikat"
    ],
    applyWhatsapp: "60163360198",
    applyMessage: "Halo Xpress Auto / Golden House, saya berminat untuk memohon jawatan Pembantu Operasi / Runner (Bandar Bukit Raja / Shah Alam)."
  }
];

const hiringJobsData = [
  {
    id: "job-sales",
    title: "Used Car Sales Executive (Salesman / Salesgirl)",
    salary: "RM 1,700 - RM 10,000+ / month (Basic + Commission + Incentives)",
    type: "Full-Time (Sepenuh Masa)",
    benefits: [
      "Gaji Pokok RM1,700 + Komisen Jualan Lumayan + Insentif Bulanan (RM3,000++ hingga RM10,000++)",
      "Caruman lengkap: KWSP (EPF), PERKESO (SOCSO) & EIS",
      "Latihan intensif disediakan (Tiada pengalaman dialu-alukan)"
    ],
    responsibilities: [
      "Menjual pelbagai jenis kereta terpakai secara online & offline",
      "Membuat content video & siaran Live di TikTok / Facebook",
      "Melayan prospek pelanggan melalui panggilan telefon dan WhatsApp"
    ],
    requirements: [
      "Lelaki / Perempuan berumur 22 hingga 45 tahun",
      "Mempunyai lesen memandu yang sah (Kelas D / DA)",
      "Berkeyakinan bercakap di depan kamera (Host TikTok/FB)",
      "Punctual, jujur, beretika, dan komited bekerja"
    ],
    waMessage: "Halo Xpress Auto, saya berminat memohon jawatan Sales Executive (Salesman/Salesgirl)."
  },
  {
    id: "job-runner",
    title: "Pembantu Operasi / Showroom Runner",
    salary: "RM 1,800 - RM 2,000 / month",
    type: "Full-Time (Sepenuh Masa)",
    benefits: [
      "Gaji Bulanan Tetap RM1,800 - RM2,000",
      "Caruman KWSP (EPF), PERKESO (SOCSO) & EIS",
      "Elaun perjalanan / petrol disediakan"
    ],
    responsibilities: [
      "Urusan penghantaran dan pemeriksaan kereta di Puspakom & JPJ",
      "Menghantar dokumen pembiayaan ke panel bank",
      "Memastikan kereta di bilik pameran bersih dan sedia untuk pandu uji"
    ],
    requirements: [
      "Mempunyai motosikal sendiri dan lesen memandu sah (B2 & D)",
      "Mempunyai disiplin masa dan amanah tinggi",
      "Biasa dengan jalan sekitar Shah Alam, Klang, dan Petaling Jaya"
    ],
    waMessage: "Halo Xpress Auto, saya berminat memohon jawatan Pembantu Operasi / Runner."
  }
];

function openCareerModal() {
  const modal = document.getElementById("careerModal");
  const content = document.getElementById("careerModalContent");
  if (!modal || !content) return;

  const jobsHTML = hiringJobsData.map((job) => {
    const waLink = `https://wa.me/60163360198?text=${encodeURIComponent(job.waMessage)}`;
    return `
      <div class="job-listing-card">
        <span class="badge-career">💼 ${job.type}</span>
        <h3 style="color: var(--accent); font-size: 1.15rem; margin-top: 0.2rem;">${job.title}</h3>
        <div class="career-salary-box">💰 ${job.salary}</div>

        <div class="career-section">
          <h4>✨ Keistimewaan & Faedah:</h4>
          <ul>
            ${job.benefits.map(b => `<li>${b}</li>`).join("")}
          </ul>
        </div>

        <div class="career-section">
          <h4>📋 Skop Kerja:</h4>
          <ul>
            ${job.responsibilities.map(r => `<li>${r}</li>`).join("")}
          </ul>
        </div>

        <div class="career-section">
          <h4>🎯 Syarat Kelayakan:</h4>
          <ul>
            ${job.requirements.map(req => `<li>${req}</li>`).join("")}
          </ul>
        </div>

        <a href="${waLink}" target="_blank" rel="noopener" class="btn-career-apply">
          💬 Mohon Jawatan Ini via WhatsApp
        </a>
      </div>
    `;
  }).join("");

  content.innerHTML = `
    <h2 style="color: var(--accent); font-size: 1.35rem; margin-bottom: 0.4rem;">Jawatan Kosong / We Are Hiring!</h2>
    <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.2rem;">
      Sertai pasukan <strong>Xpress Auto Enterprise</strong> di Auto City Seksyen 15, Shah Alam.
    </p>
    ${jobsHTML}
  `;

  modal.style.display = "flex";
}

function closeCareerModal() {
  const modal = document.getElementById("careerModal");
  if (modal) modal.style.display = "none";
}