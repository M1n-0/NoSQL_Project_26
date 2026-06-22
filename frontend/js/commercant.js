/* ===========================================================
   FabLab Manager — logique de la page commerçant
   =========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  // TODO : réactiver quand le backend auth sera branché
  // const token = localStorage.getItem("fablab_token");
  // if (!token) { window.location.href = "login.html"; return; }
  const token = "dev";

  await loadShopInfo();
  await loadOccupancy();
  await loadMachines();

  document.getElementById("shop-settings-form").addEventListener("submit", saveShopSettings);
  document.getElementById("btn-add-machine").addEventListener("click", () => {
    // TODO : ouvrir une modale d'ajout de machine (nom, fonction, statut)
    alert("Formulaire d'ajout de machine à implémenter.");
  });
});

async function loadShopInfo() {
  try {
    // TODO (backend) : GET /api/shops/me
    // Réponse attendue : { name, hours, capacity, contact }
    const shop = await api.getMyShop();

    document.getElementById("shop-subtitle").textContent = `${shop.name} · ${shop.hours}`;
    document.getElementById("shop-name-sidebar").textContent = shop.name;
    document.getElementById("setting-capacity").value = shop.capacity;
    document.getElementById("setting-hours").value = shop.hours;
    document.getElementById("setting-contact").value = shop.contact;
  } catch (err) {
    document.getElementById("shop-subtitle").textContent = "Impossible de charger les informations.";
    console.error(err);
  }
}

async function loadOccupancy() {
  const zone = document.getElementById("occupancy-zone");
  try {
    // TODO (backend) : GET /api/shops/me/occupancy
    // Réponse attendue : { current, max, people: [{ name, reserving }] }
    const occ = await api.getCurrentOccupancy();

    if (!occ || occ.people.length === 0) {
      zone.innerHTML = `
        <div style="font-family:'Fraunces',serif; font-size:34px; font-weight:700; color:var(--wine);">${occ?.current ?? 0}
          <span style="font-family:'Work Sans'; font-size:16px; color:var(--ink-soft); font-weight:400;"> / ${occ?.max ?? "-"} personnes présentes</span>
        </div>
        <div class="empty-state" style="margin-top:14px;">Personne sur place actuellement.</div>`;
      return;
    }

    zone.innerHTML = `
      <div style="display:flex; align-items:baseline; gap:8px; margin-bottom:14px;">
        <span style="font-family:'Fraunces',serif; font-size:34px; font-weight:700; color:var(--wine);">${occ.current}</span>
        <span style="color:var(--ink-soft); font-size:16px;">/ ${occ.max} personnes présentes</span>
      </div>
      <table class="occ-table">
        <tr><th>Personne</th><th>Réserve</th></tr>
        ${occ.people.map(p => `
          <tr>
            <td><div class="name-cell"><span class="mini-avatar">${initials(p.name)}</span> ${p.name}</div></td>
            <td>${p.reserving}</td>
          </tr>`).join("")}
      </table>`;
  } catch (err) {
    zone.innerHTML = `<div class="empty-state">Impossible de charger l'occupation.</div>`;
    console.error(err);
  }
}

async function loadMachines() {
  const zone = document.getElementById("machines-zone");
  try {
    // TODO (backend) : GET /api/machines/me
    // Réponse attendue : liste de { id, name, function, status: "available"|"busy"|"maintenance", statusLabel }
    const machines = await api.getMyMachines();

    if (!machines || machines.length === 0) {
      zone.innerHTML = `<div class="empty-state card"><div class="ic">🔧</div>Aucune machine enregistrée. Ajoutez-en une.</div>`;
      return;
    }

    const statusDot = { available: "ok", busy: "warn", maintenance: "maint" };
    const statusPill = { available: "pill-ok", busy: "pill-warn", maintenance: "pill-danger" };

    zone.innerHTML = machines.map(m => `
      <div class="machine-row">
        <div>
          <div class="machine-name"><span class="status-dot ${statusDot[m.status]}"></span>${m.name}</div>
          <div class="machine-fn">${m.function}</div>
        </div>
        <span class="pill ${statusPill[m.status]}">${m.statusLabel}</span>
      </div>`).join("");
  } catch (err) {
    zone.innerHTML = `<div class="empty-state card">Impossible de charger les machines.</div>`;
    console.error(err);
  }
}

async function saveShopSettings(e) {
  e.preventDefault();
  try {
    // TODO (backend) : PATCH /api/shops/me
    await api.updateMyShop({
      capacity: document.getElementById("setting-capacity").value,
      hours: document.getElementById("setting-hours").value,
      contact: document.getElementById("setting-contact").value,
    });
    await loadShopInfo();
  } catch (err) {
    alert("Impossible d'enregistrer : " + err.message);
  }
}

function initials(name) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}
