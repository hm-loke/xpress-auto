// =======================================================
// XPRESS AUTO ENTERPRISE - CAREERS & JOB VACANCIES
// =======================================================

const careersData = [
  {
    id: "job-sales",
    title: "Used Car Sales Executive (Salesman / Salesgirl)",
    salary: "RM 2,000 - RM 10,000+ / month (Basic + Commission + Incentives)",
    type: "Full-Time (Sepenuh Masa)",
    status: "Hiring",
    benefits: [
      "Gaji Pokok RM2,000 + Komisen Jualan Lumayan + Insentif Bulanan (RM3,000++ hingga RM10,000++)",
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
    status: "Hiring",
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

let liveCareersList = [...careersData];

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    if (typeof db !== "undefined" && db) {
      db.collection("careers").onSnapshot((snapshot) => {
        if (!snapshot.empty) {
          liveCareersList = [];
          snapshot.forEach((doc) => {
            liveCareersList.push({ docId: doc.id, ...doc.data() });
          });
          liveCareersList.sort((a, b) => {
            const orderA = a.orderIndex !== undefined ? a.orderIndex : 9999;
            const orderB = b.orderIndex !== undefined ? b.orderIndex : 9999;
            return orderA - orderB;
          });
        }
      });
    }
  }, 600);
});

function openCareerModal() {
  const modal = document.getElementById("careerModal");
  const content = document.getElementById("careerModalContent");
  if (!modal || !content) return;

  const salesPhone = (typeof CONFIG !== "undefined" && CONFIG.salesPhone1) ? CONFIG.salesPhone1 : "60163360198";
  const activeJobs = liveCareersList.filter(j => !j.status || j.status.toLowerCase() !== "closed");

  const jobsHTML = activeJobs.length === 0
    ? `<p style="color: var(--text-muted); text-align: center; padding: 1.5rem 0;">Tiada kekosongan jawatan buat masa ini. Sila hubungi kami melalui WhatsApp untuk pertanyaan lanjut.</p>`
    : activeJobs.map((job) => {
        const waLink = `https://wa.me/${salesPhone}?text=${encodeURIComponent(job.waMessage || `Halo Xpress Auto, saya berminat memohon jawatan ${job.title}.`)}`;
        return `
          <div class="job-listing-card">
            <span class="badge-career">💼 ${job.type || "Full-Time"}</span>
            <h3 style="color: var(--accent); font-size: 1.15rem; margin-top: 0.2rem;">${job.title}</h3>
            <div class="career-salary-box">💰 ${job.salary}</div>

            <div class="career-section">
              <h4>✨ Keistimewaan & Faedah:</h4>
              <ul>
                ${(job.benefits || []).map(b => `<li>${b}</li>`).join("")}
              </ul>
            </div>

            <div class="career-section">
              <h4>📋 Skop Kerja:</h4>
              <ul>
                ${(job.responsibilities || []).map(r => `<li>${r}</li>`).join("")}
              </ul>
            </div>

            <div class="career-section">
              <h4>🎯 Syarat Kelayakan:</h4>
              <ul>
                ${(job.requirements || []).map(req => `<li>${req}</li>`).join("")}
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
