/* ===========================================================
   FabLab Manager — historique des réservations (commerçant)
   =========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  if (!localStorage.getItem("fablab_token")) {
    window.location.href = "login.html";
    return;
  }

  await loadShopInfo();
  await loadHistory();
});

async function loadShopInfo() {
  try {
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
          <th></th>
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
            <td>${formatDate(r.date)}</td>
            <td>${r.duration || "—"}</td>
            <td><span class="pill ${r.statusClass || "pill-muted"}">${r.status}</span></td>
            <td>
              ${r.rawStatus === "en_attente" ? `
                <div style="display:flex;gap:6px;">
                  <button class="btn btn-soft btn-sm" onclick="setReservationStatus('${r.id}','confirmee')">Valider</button>
                  <button class="btn btn-ghost btn-sm" onclick="setReservationStatus('${r.id}','annulee')">Annuler</button>
                </div>` : ""}
            </td>
          </tr>`).join("")}
      </table>`;
  } catch {
    zone.innerHTML = `<div class="empty-state">Impossible de charger l'historique.</div>`;
  }
}

async function setReservationStatus(reservationId, status) {
  try {
    await api.updateReservationStatus(reservationId, status);
    await loadHistory();
  } catch (err) {
    alert("Impossible de mettre à jour la réservation : " + err.message);
  }
}
