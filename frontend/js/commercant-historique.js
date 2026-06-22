/* ===========================================================
   FabLab Manager — historique des réservations (commerçant)
   =========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  // TODO : réactiver quand le backend auth sera branché
  // const token = localStorage.getItem("fablab_token");
  // if (!token) { window.location.href = "login.html"; return; }
  const token = "dev";

  await loadShopInfo();
  await loadHistory();
});

async function loadShopInfo() {
  try {
    // TODO (backend) : GET /api/shops/me
    const shop = await api.getMyShop();
    document.getElementById("shop-subtitle").textContent = `${shop.name} · ${shop.hours}`;
    document.getElementById("shop-name-sidebar").textContent = shop.name;
    const initials = shop.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    document.getElementById("shop-initials").textContent = initials;
    document.getElementById("shop-initials-mobile").textContent = initials;
  } catch {
    document.getElementById("shop-subtitle").textContent = "Impossible de charger les informations du magasin.";
  }
}

async function loadHistory() {
  const zone = document.getElementById("history-zone");
  try {
    // TODO (backend) : GET /api/reservations/shop/history
    const history = await api.getMerchantHistory();
    if (!history || history.length === 0) {
      zone.innerHTML = `<div class="empty-state"><div class="ic">▤</div>Aucun historique pour le moment.</div>`;
      return;
    }
    zone.innerHTML = `
      <table class="occ-table">
        <tr>
          <th>Client</th>
          <th>Machine</th>
          <th>Date</th>
          <th>Durée</th>
          <th>Statut</th>
        </tr>
        ${history.map(r => `
          <tr>
            <td>
              <div class="name-cell">
                <span class="mini-avatar">${r.clientName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}</span>
                ${r.clientName}
              </div>
            </td>
            <td style="font-weight:600;">${r.machineName}</td>
            <td>${r.date}</td>
            <td>${r.duration || "—"}</td>
            <td><span class="pill ${r.statusClass || "pill-muted"}">${r.status}</span></td>
          </tr>`).join("")}
      </table>`;
  } catch {
    zone.innerHTML = `<div class="empty-state">Impossible de charger l'historique.</div>`;
  }
}
