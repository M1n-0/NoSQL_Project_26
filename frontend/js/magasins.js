/* ===========================================================
   FabLab Manager — logique de la page magasins (client)
   =========================================================== */

let currentShopId = null;

document.addEventListener("DOMContentLoaded", async () => {
  // TODO : réactiver quand le backend auth sera branché
  // const token = localStorage.getItem("fablab_token");
  // if (!token) { window.location.href = "login.html"; return; }
  const token = "dev";

  await loadShops();

  document.getElementById("btn-modal-cancel").addEventListener("click", () => {
    document.getElementById("modal-online").classList.add("hidden");
  });
  document.getElementById("btn-modal-confirm").addEventListener("click", submitOnlineResa);
});

async function loadShops() {
  const zone = document.getElementById("shops-zone");
  try {
    // TODO (backend) : GET /api/shops/mine — magasins associés au compte client
    const shops = await api.getMyLinkedShops();
    if (!shops || shops.length === 0) {
      zone.innerHTML = `<div class="empty-state"><div class="ic">🏭</div>Aucun magasin associé à votre compte.</div>`;
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
            ${shop.isOpen && !full
              ? `<div class="sub" style="margin-bottom:8px;font-weight:700;color:var(--ink);">${shop.seatsTaken} / ${shop.seatsMax} places</div>
                 <a href="commande.html" class="btn btn-soft btn-sm">Réserver</a>`
              : `<button class="btn btn-ghost btn-sm" onclick="openOnlineModal('${shop.id}','${shop.name}')">Réserver en ligne</button>`
            }
          </div>
        </div>`;
    }).join("");
  } catch {
    zone.innerHTML = `<div class="empty-state">Impossible de charger les magasins.</div>`;
  }
}

function openOnlineModal(shopId, shopName) {
  currentShopId = shopId;
  document.getElementById("modal-shop-name").textContent = shopName;
  document.getElementById("online-feedback").style.display = "none";
  document.getElementById("online-error").style.display = "none";
  document.getElementById("btn-modal-confirm").style.display = "";
  document.getElementById("modal-online").classList.remove("hidden");
}

async function submitOnlineResa() {
  const feedback = document.getElementById("online-feedback");
  const error = document.getElementById("online-error");
  feedback.style.display = "none";
  error.style.display = "none";
  const start = document.getElementById("resa-start").value;
  const end = document.getElementById("resa-end").value;
  const material = document.getElementById("resa-material").value;
  if (!start || !end) {
    error.textContent = "Veuillez choisir une période.";
    error.style.display = "block";
    return;
  }
  try {
    // TODO (backend) : POST /api/shops/:id/reserve-online
    await api.reserveOnline(currentShopId, { start, end, material });
    feedback.style.display = "block";
    document.getElementById("btn-modal-confirm").style.display = "none";
  } catch (err) {
    error.textContent = err.message || "Une erreur est survenue.";
    error.style.display = "block";
  }
}
