/* ===========================================================
   FabLab Manager — logique de la page réservations (client)
   =========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  // TODO : réactiver quand le backend auth sera branché
  // const token = localStorage.getItem("fablab_token");
  // if (!token) { window.location.href = "login.html"; return; }
  const token = "dev";

  await loadActiveReservation();
  await loadHistory();
});

async function loadActiveReservation() {
  const zone = document.getElementById("active-resa-zone");
  try {
    // TODO (backend) : GET /api/reservations/me
    const data = await api.getMyReservations();
    if (!data || !data.hasActive) {
      zone.innerHTML = `<div class="empty-state card"><div class="ic">📦</div>Aucune réservation en cours.</div>`;
      return;
    }
    zone.innerHTML = `
      <div class="card wine order-recap">
        <div class="label">RÉSERVATION EN COURS</div>
        <div class="item-name">${data.itemName}</div>
        <span class="pill pill-warn">${data.status}</span>
        <div class="meta">
          <div><b>${data.daysLeft}</b> avant restitution</div>
          <div><b>${data.shopName}</b> magasin</div>
        </div>
      </div>`;
  } catch {
    zone.innerHTML = `<div class="empty-state card">Impossible de charger la réservation active.</div>`;
  }
}

async function loadHistory() {
  const zone = document.getElementById("history-zone");
  try {
    // TODO (backend) : GET /api/reservations/me/history
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
        ${history.map(r => `
          <tr>
            <td style="font-weight:600;">${r.itemName}</td>
            <td>${r.shopName}</td>
            <td>${r.date}</td>
            <td>${r.duration || "—"}</td>
            <td><span class="pill ${r.statusClass || "pill-muted"}">${r.status}</span></td>
          </tr>`).join("")}
      </table>`;
  } catch {
    zone.innerHTML = `<div class="empty-state">Impossible de charger l'historique.</div>`;
  }
}
