/* ===========================================================
   FabLab Manager — flux de commande en 3 étapes
   Étape 1 : choisir un magasin
   Étape 2 : choisir ce que l'on veut réserver (place et/ou machine)
   Étape 3 : sélectionner une machine disponible
   =========================================================== */

const state = { step: 1, shopId: null, shopName: null, wantSeat: true, wantMachine: true };

document.addEventListener("DOMContentLoaded", async () => {
  if (!localStorage.getItem("fablab_token")) {
    window.location.href = "login.html";
    return;
  }

  await loadShops();

  document.getElementById("btn-step2-next").addEventListener("click", goToStep3);
  document.getElementById("btn-step2-back").addEventListener("click", () => goToStep(1));
  document.getElementById("btn-step3-back").addEventListener("click", () => goToStep(2));
});

async function loadShops() {
  const zone = document.getElementById("shops-list");
  try {
    const shops = await api.getShops();
    if (!shops || shops.length === 0) {
      zone.innerHTML = `<div class="empty-state"><div class="ic">🏭</div>Aucun magasin disponible.</div>`;
      return;
    }
    zone.innerHTML = shops.map(shop => `
      <div class="shop-row">
        <div class="shop-info">
          <div class="shop-icon">🏭</div>
          <div>
            <div class="shop-name">${shop.name}</div>
            <div class="shop-meta">
              ${shop.isOpen
                ? `Ouvert · ${shop.seatsTaken}/${shop.seatsMax} places`
                : "Fermé"}
            </div>
          </div>
        </div>
        <div class="shop-actions">
          <button class="btn btn-soft btn-sm" onclick="selectShop('${shop.id}','${shop.name}')">Choisir →</button>
        </div>
      </div>`).join("");
  } catch {
    zone.innerHTML = `<div class="empty-state">Impossible de charger les magasins.</div>`;
  }
}

function selectShop(shopId, shopName) {
  state.shopId = shopId;
  state.shopName = shopName;
  document.getElementById("selected-shop-recap").textContent = shopName;
  goToStep(2);
}

function goToStep3() {
  state.wantSeat = document.getElementById("want-seat").checked;
  state.wantMachine = document.getElementById("want-machine").checked;
  if (state.wantMachine) {
    loadMachines();
    goToStep(3);
  } else {
    confirmOrderWithoutMachine();
  }
}

async function loadMachines() {
  const zone = document.getElementById("machines-list");
  zone.innerHTML = `<div class="empty-state card"><div class="ic">🔧</div>Chargement...</div>`;
  try {
    const machines = await api.getMachinesForShop(state.shopId);
    const available = machines ? machines.filter(m => m.status === "available") : [];
    if (available.length === 0) {
      zone.innerHTML = `<div class="empty-state card"><div class="ic">🔧</div>Aucune machine disponible dans ce magasin pour le moment.</div>`;
      return;
    }
    zone.innerHTML = available.map(m => `
      <div class="machine-row">
        <div>
          <div class="machine-name"><span class="status-dot ok"></span>${m.name}</div>
          <div class="machine-fn">${m.function}</div>
        </div>
        <button class="btn btn-soft btn-sm" onclick="selectMachine('${m.id}','${m.name}')">Réserver</button>
      </div>`).join("");
  } catch {
    zone.innerHTML = `<div class="empty-state card">Impossible de charger les machines.</div>`;
  }
}

async function selectMachine(machineId, machineName) {
  try {
    if (state.wantSeat) {
      await api.takeShopSeat(state.shopId);
    }
    await api.reserveMachine(machineId);
    document.getElementById("confirm-machine").textContent = machineName;
    document.getElementById("confirm-shop").textContent = state.shopName;
    goToStep("confirm");
  } catch (err) {
    alert("Impossible de finaliser la réservation : " + err.message);
  }
}

async function confirmOrderWithoutMachine() {
  try {
    if (state.wantSeat) {
      await api.takeShopSeat(state.shopId);
    }
    document.getElementById("confirm-machine").textContent = "Place réservée";
    document.getElementById("confirm-shop").textContent = state.shopName;
    goToStep("confirm");
  } catch (err) {
    alert("Impossible de finaliser : " + err.message);
  }
}

function goToStep(n) {
  ["step-1", "step-2", "step-3", "step-confirm"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  state.step = n;
  const targetId = n === "confirm" ? "step-confirm" : `step-${n}`;
  const el = document.getElementById(targetId);
  if (el) el.style.display = "block";
  updateStepIndicators(n);
}

function updateStepIndicators(n) {
  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById(`si-${i}`);
    if (!el) continue;
    el.classList.remove("active", "done");
    if (n === "confirm") {
      el.classList.add("done");
    } else if (i < n) {
      el.classList.add("done");
    } else if (i === n) {
      el.classList.add("active");
    }
  }
}
