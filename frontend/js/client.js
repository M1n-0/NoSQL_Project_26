/* ===========================================================
   FabLab Manager — logique de la page client
   =========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  if (!localStorage.getItem("fablab_token")) {
    window.location.href = "login.html";
    return;
  }

  await loadCurrentReservation();
  await loadShops();
  await loadHistory();
});

async function loadCurrentReservation() {
  const zone = document.getElementById("current-reservation-zone");
  try {
    const data = await api.getMyReservations();

    if (!data || !data.hasActive) {
      zone.innerHTML = `
        <div class="empty-state card">
          <div class="ic">📦</div>
          Aucune réservation en cours.
        </div>`;
      return;
    }

    zone.innerHTML = `
      <div class="card wine order-recap">
        <div class="label">RÉSERVATION EN COURS</div>
        <div class="item-name">${data.itemName}</div>
        <span class="pill pill-warn">${data.status}</span>
        <div class="meta">
          ${data.daysLeft ? `<div><b>${data.daysLeft}</b> avant restitution</div>` : ""}
          <div><b>${data.shopName}</b> magasin</div>
        </div>
        ${data.rawStatus === "en_attente" ? `
          <div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,.2);">
            <div class="label">DURÉE D'IMPRESSION PRÉVUE</div>
            <div style="display:flex;gap:8px;margin-top:8px;">
              <input type="number" id="duration-input" min="1" placeholder="Minutes"
                style="flex:1;padding:10px 12px;border-radius:8px;border:none;background:rgba(255,255,255,.15);color:#fff;font-family:'Work Sans',sans-serif;font-size:14px;">
              <button class="btn btn-soft btn-sm" onclick="submitPrintDuration('${data.id}')">Valider</button>
            </div>
          </div>` : ""}
      </div>`;
  } catch (err) {
    zone.innerHTML = `<div class="empty-state card">Impossible de charger vos réservations.</div>`;
    console.error(err);
  }
}

async function loadShops() {
  const zone = document.getElementById("shops-zone");
  try {
    const shops = await api.getShops();

    if (!shops || shops.length === 0) {
      zone.innerHTML = `<div class="empty-state"><div class="ic">🏭</div>Aucun magasin disponible pour le moment.</div>`;
      return;
    }

    zone.innerHTML = shops.map(shop => {
      const pct = Math.round((shop.seatsTaken / shop.seatsMax) * 100);
      const full = shop.seatsTaken >= shop.seatsMax;
      return `
        <div class="shop-row">
          <div class="shop-info">
            <div class="shop-icon">🏭</div>
            <div>
              <div class="shop-name">${shop.name}</div>
              <div class="shop-meta">${shop.isOpen ? `Ouvert · ferme à ${shop.closesAt}` : "Fermé"}</div>
              ${shop.isOpen ? `<div class="occ-bar ${full ? "full" : ""}"><span style="width:${pct}%"></span></div>` : ""}
            </div>
          </div>
          <div class="shop-actions">
            ${shop.isOpen
              ? `<div class="sub" style="margin-bottom:8px; font-weight:700; color:var(--ink);">${shop.seatsTaken} / ${shop.seatsMax} places</div>
                 <button class="btn ${full ? "btn-ghost" : "btn-soft"} btn-sm" ${full ? "disabled" : ""} onclick="reserveSeat('${shop.id}')">
                   ${full ? "Complet" : "Réserver"}
                 </button>`
              : `<button class="btn btn-ghost btn-sm">Louer en ligne</button>`}
          </div>
        </div>`;
    }).join("");
  } catch (err) {
    zone.innerHTML = `<div class="empty-state">Impossible de charger les magasins.</div>`;
    console.error(err);
  }
}

async function loadHistory() {
  const zone = document.getElementById("history-zone");
  try {
    const history = await api.getMyFullHistory();
    if (!history || history.length === 0) {
      zone.innerHTML = `<div class="empty-state"><div class="ic">▤</div>Aucun historique pour le moment.</div>`;
      return;
    }
    zone.innerHTML = `
      <table class="occ-table">
        <tr>
          <th>Machine / Matériel</th>
          <th>Magasin</th>
          <th>Date</th>
          <th>Durée</th>
          <th>Statut</th>
        </tr>
        ${history.slice(0, 5).map(r => `
          <tr>
            <td style="font-weight:600;">${r.itemName}</td>
            <td>${r.shopName}</td>
            <td>${formatDate(r.date)}</td>
            <td>${r.duration || "—"}</td>
            <td><span class="pill ${r.statusClass || "pill-muted"}">${r.status}</span></td>
          </tr>`).join("")}
      </table>`;
  } catch {
    zone.innerHTML = `<div class="empty-state">Impossible de charger l'historique.</div>`;
  }
}

async function submitPrintDuration(reservationId) {
  const input = document.getElementById("duration-input");
  const minutes = parseInt(input.value, 10);
  if (!minutes || minutes <= 0) {
    alert("Merci d'indiquer une durée valide.");
    return;
  }
  try {
    await api.setPrintDuration(reservationId, minutes);
    await loadCurrentReservation();
  } catch (err) {
    alert("Impossible d'enregistrer la durée : " + err.message);
  }
}

async function reserveSeat(shopId) {
  try {
    await api.takeShopSeat(shopId);
    await loadShops();
  } catch (err) {
    alert("Impossible de réserver une place : " + err.message);
  }
}
