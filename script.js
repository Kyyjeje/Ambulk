// ============================================================
//  KONFIGURASI API
// ============================================================
const API_BASE   = "https://am.dapjisync.my.id";
const BYPASS_KEY = "amfree_key";
// ============================================================

// ── Activation Page ───────────────────────────────────────────
const emailInput  = document.getElementById("emailInput");
const magicInput  = document.getElementById("magicInput");
const sendBtn     = document.getElementById("sendBtn");
const activateBtn = document.getElementById("activateBtn");
const btnText     = document.getElementById("btnText");
const msgBox      = document.getElementById("msgBox");

let cachedEmail = "";

function showMsg(box, text, type = "error") {
  const icon = type === "success"
    ? '<i class="fas fa-circle-check"></i>'
    : '<i class="fas fa-circle-exclamation"></i>';
  box.innerHTML = icon + "<span>" + text + "</span>";
  box.className = "msg-box show " + type;
}

function hideMsg(box) {
  box.className = "msg-box";
  box.innerHTML = "";
}

function parseApiError(data) {
  if (!data) return "Terjadi kesalahan tidak diketahui.";
  if (typeof data.error === "object" && data.error !== null) {
    return data.error.message || "Gagal memproses permintaan.";
  }
  if (typeof data.error === "string") return data.error;
  if (data.message) return data.message;
  return "Gagal memproses permintaan.";
}

// Step 1: Kirim Magic Link
sendBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  if (!email || !email.includes("@")) {
    showMsg(msgBox, "Masukkan alamat email yang valid.", "error");
    emailInput.focus();
    return;
  }

  const oldHtml = sendBtn.innerHTML;
  sendBtn.innerHTML = '<div class="loader"></div>';
  sendBtn.disabled = true;
  activateBtn.disabled = true;
  cachedEmail = "";
  hideMsg(msgBox);

  try {
    const res  = await fetch(`${API_BASE}/api/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Bypass-Key": BYPASS_KEY },
      body: JSON.stringify({ gmail: email })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      cachedEmail = email;
      showMsg(msgBox, "Magic Link terkirim! Cek inbox email → salin URL-nya → tempel di bawah.", "success");
      magicInput.focus();
      sendBtn.classList.add("sent");
      sendBtn.innerHTML = '<i class="fas fa-check"></i><span>Terkirim</span>';
      activateBtn.disabled = false;
      setTimeout(() => {
        sendBtn.innerHTML = oldHtml;
        sendBtn.classList.remove("sent");
        sendBtn.disabled = false;
      }, 3000);
    } else {
      showMsg(msgBox, parseApiError(data) || "Gagal mengirim Magic Link. Coba lagi.", "error");
      sendBtn.innerHTML = oldHtml;
      sendBtn.disabled = false;
      activateBtn.disabled = false;
    }
  } catch (err) {
    showMsg(msgBox, "Koneksi gagal. Periksa internet kamu lalu coba lagi.", "error");
    sendBtn.innerHTML = oldHtml;
    sendBtn.disabled = false;
    activateBtn.disabled = false;
  }
});

// Step 2: Verifikasi
activateBtn.addEventListener("click", async () => {
  const magic = magicInput.value.trim();

  if (!cachedEmail) {
    showMsg(msgBox, "Kamu harus tekan Kirim dulu untuk mendapatkan Magic Link ke email.", "error");
    emailInput.focus();
    return;
  }
  if (!magic || !magic.startsWith("http")) {
    showMsg(msgBox, "Tempel URL Magic Link dari email kamu.", "error");
    magicInput.focus();
    return;
  }

  btnText.innerHTML = '<div class="loader"></div> Menghubungkan...';
  activateBtn.disabled = true;
  hideMsg(msgBox);

  try {
    const res  = await fetch(`${API_BASE}/api/verif`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Bypass-Key": BYPASS_KEY },
      body: JSON.stringify({ gmail: cachedEmail, link: magic })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      activateBtn.classList.add("success-state");
      btnText.innerHTML = '<i class="fas fa-circle-check"></i> Berhasil Diaktifkan!';
      showMsg(msgBox, "Lisensi Premium berhasil diaktifkan! Buka Alight Motion sekarang.", "success");
      cachedEmail = "";
    } else {
      showMsg(msgBox, parseApiError(data), "error");
      btnText.innerHTML = '<i class="fas fa-shield-halved"></i> Verifikasi & Aktifkan';
      activateBtn.disabled = false;
    }
  } catch (err) {
    showMsg(msgBox, "Koneksi gagal. Periksa internet kamu lalu coba lagi.", "error");
    btnText.innerHTML = '<i class="fas fa-shield-halved"></i> Verifikasi & Aktifkan';
    activateBtn.disabled = false;
  }
});

emailInput.addEventListener("keydown", e => { if (e.key === "Enter") sendBtn.click(); });
magicInput.addEventListener("keydown", e => { if (e.key === "Enter") activateBtn.click(); });

// ── Bulk Page ─────────────────────────────────────────────────
let bulkData = [];

async function doBulk() {
  const bulkMsgBox = document.getElementById("bulkMsgBox");
  const bulkBtn    = document.getElementById("bulkBtn");
  const bulkBtnText = document.getElementById("bulkBtnText");
  const bulkResult = document.getElementById("bulkResult");

  bulkBtnText.innerHTML = '<div class="loader"></div> Generating...';
  bulkBtn.disabled = true;
  bulkResult.style.display = "none";
  bulkData = [];
  hideMsg(bulkMsgBox);

  try {
    const res  = await fetch(`${API_BASE}/api/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Bypass-Key": BYPASS_KEY },
      body: JSON.stringify({ total: bulkCount })
    });
    const data = await res.json();

    if (res.ok && data.success && data.batch && data.batch.length > 0) {
      bulkData = data.batch;
      renderBulkResult(data);
      showMsg(bulkMsgBox, `${data.successCount} akun berhasil dibuat!`, "success");
    } else {
      showMsg(bulkMsgBox, parseApiError(data) || "Gagal generate akun. Coba lagi.", "error");
    }
  } catch (err) {
    showMsg(bulkMsgBox, "Koneksi gagal. Periksa internet kamu lalu coba lagi.", "error");
  } finally {
    bulkBtnText.innerHTML = '<i class="fas fa-layer-group"></i> Generate Akun Sekarang';
    bulkBtn.disabled = false;
  }
}

function renderBulkResult(data) {
  const bulkResult = document.getElementById("bulkResult");
  const bulkList   = document.getElementById("bulkList");
  const label      = document.getElementById("bulkResultLabel");

  label.textContent = `${data.successCount} dari ${data.total} akun berhasil`;

  bulkList.innerHTML = data.batch.map((item, i) => `
    <div class="bulk-item">
      <div class="bulk-item-num">${i + 1}</div>
      <div class="bulk-item-info">
        <div class="bulk-item-email">${item.email}</div>
        <a class="bulk-item-link" href="${item.access_link}" target="_blank" rel="noopener">
          <i class="fas fa-inbox"></i> Buka Inbox
        </a>
      </div>
      <div class="bulk-item-status ${item.premiumApplied ? 'ok' : 'fail'}">
        <i class="fas fa-${item.premiumApplied ? 'circle-check' : 'circle-xmark'}"></i>
      </div>
    </div>
  `).join("");

  bulkResult.style.display = "block";
}

function copyBulk() {
  if (!bulkData.length) return;
  const text = bulkData.map((item, i) =>
    `[${i+1}] Email   : ${item.email}\n     Inbox   : ${item.access_link}\n     Order ID: ${item.orderId || '-'}\n     Premium : ${item.premiumApplied ? 'Ya' : 'Tidak'}`
  ).join("\n\n");
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('.btn-icon[onclick="copyBulk()"]');
    btn.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => btn.innerHTML = '<i class="fas fa-copy"></i>', 2000);
  });
}

function downloadBulk() {
  if (!bulkData.length) return;
  const now  = new Date().toLocaleString("id-ID");
  const text = `AM Generator Premium — Hasil Bulk\nDibuat: ${now}\n${"=".repeat(40)}\n\n` +
    bulkData.map((item, i) =>
      `[${i+1}] Email   : ${item.email}\n     Inbox   : ${item.access_link}\n     Order ID: ${item.orderId || '-'}\n     Premium : ${item.premiumApplied ? 'Ya' : 'Tidak'}`
    ).join("\n\n") +
    `\n\n${"=".repeat(40)}\nPowered by DapjiSync — am.dapjisync.my.id`;

  const blob = new Blob([text], { type: "text/plain" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `amgen-bulk-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
