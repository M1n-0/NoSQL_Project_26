/* ===========================================================
   FabLab Manager — logique de la page client
   Ce fichier va chercher les données réelles une fois que le
   backend (et les bases) seront branchés. En attendant, il
   affiche un état vide / de chargement propre.
   =========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  // TODO : réactiver quand le backend auth sera branché
  // const token = localStorage.getItem("fablab_token");
  // if (!token) { window.location.href = "login.html"; return; }
  const token = "dev";

  await loadCurrentReservation();
  await loadShops();
  await loadHistory();

  document.getElementById("btn-new-order").addEventListener("click", () => {
    // TODO : ouvrir le flux "Passer commande"
    // (choix du magasin -> réservation -> sélection machine)
    alert("Flux de commande à implémenter (choix du magasin → réservation → sélection matériel).");
  });
});

async function loadCurrentReservation() {
  const zone = document.getElementById("current-reservation-zone");
  try {
    // TODO (backend) : GET /api/reservations/me
    // Réponse attendue : { hasActive: bool, itemName, shopName, status, daysLeft, ... } | null
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
          <div><b>${data.daysLeft}</b>avant restitution</div>
          <div><b>${data.shopName}</b>magasin</div>
        </div>
      </div>`;
  } catch (err) {
    zone.innerHTML = `<div class="empty-state card">Impossible de charger vos réservations.</div>`;
    console.error(err);
  }
}

async function loadShops() {
  const zone = document.getElementById("shops-zone");
  try {
    // TODO (backend) : GET /api/shops
    // Réponse attendue : liste de { id, name, isOpen, closesAt, seatsTaken, seatsMax }
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
  // TODO (backend) : GET /api/reservations/me/history
  zone.innerHTML = `<div class="empty-state"><div class="ic">▤</div>Aucun historique pour le moment.</div>`;
}

async function reserveSeat(shopId) {
  try {
    // TODO (backend) : POST /api/shops/:id/seat
    await api.takeShopSeat(shopId);
    await loadShops();
  } catch (err) {
    alert("Impossible de réserver une place : " + err.message);
  }
}
