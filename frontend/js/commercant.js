/* ===========================================================
   FabLab Manager — logique de la page commerçant
   =========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  if (!localStorage.getItem("fablab_token")) {
    window.location.href = "login.html";
    return;
  }

  await loadShopInfo();
  await loadOccupancy();
  await loadMachines();

  document.getElementById("shop-settings-form").addEventListener("submit", saveShopSettings);
  document.getElementById("btn-add-machine").addEventListener("click", openAddMachineModal);
  document.getElementById("btn-machine-cancel").addEventListener("click", () => {
    document.getElementById("modal-add-machine").classList.add("hidden");
  });
  document.getElementById("btn-machine-submit").addEventListener("click", submitAddMachine);
});

async function loadShopInfo() {
  try {
    const shop = await api.getMyShop();

    document.getElementById("shop-subtitle").textContent = `${shop.name} · ${shop.hours}`;
    document.getElementById("shop-name-sidebar").textContent = shop.name;
    document.getElementById("setting-capacity").value = shop.capacity;
    document.getElementById("setting-open-time").value = shop.openTime;
    document.getElementById("setting-close-time").value = shop.closeTime;
    document.getElementById("setting-contact").value = shop.contact;
  } catch (err) {
    document.getElementById("shop-subtitle").textContent = "Impossible de charger les informations.";
    console.error(err);
  }
}

async function loadOccupancy() {
  const zone = document.getElementById("occupancy-zone");
  try {
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
    await api.updateMyShop({
      capacity: document.getElementById("setting-capacity").value,
      openTime: document.getElementById("setting-open-time").value,
      closeTime: document.getElementById("setting-close-time").value,
      contact: document.getElementById("setting-contact").value,
    });
    await loadShopInfo();
  } catch (err) {
    alert("Impossible d'enregistrer : " + err.message);
  }
}

function openAddMachineModal() {
  document.getElementById("machine-name").value = "";
  document.getElementById("machine-function").value = "";
  document.getElementById("machine-reservation-type").value = "instantanee";
  document.getElementById("machine-error").style.display = "none";
  document.getElementById("modal-add-machine").classList.remove("hidden");
}

async function submitAddMachine() {
  const name = document.getElementById("machine-name").value;
  const fn = document.getElementById("machine-function").value;
  const reservationType = document.getElementById("machine-reservation-type").value;
  const errorEl = document.getElementById("machine-error");
  errorEl.style.display = "none";
  if (!name || !fn) {
    errorEl.textContent = "Le nom et la fonction sont requis.";
    errorEl.style.display = "block";
    return;
  }
  try {
    await api.addMachine({ name, function: fn, reservationType });
    document.getElementById("modal-add-machine").classList.add("hidden");
    await loadMachines();
  } catch (err) {
    errorEl.textContent = err.message || "Impossible d'ajouter cette machine.";
    errorEl.style.display = "block";
  }
}

function initials(name) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}
