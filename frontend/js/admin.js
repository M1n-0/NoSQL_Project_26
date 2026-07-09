/* ===========================================================
   FabLab Manager — logique des pages admin
   Gère admin.html, admin-groupes.html et admin-magasins.html
   Détecte la page active via les éléments présents dans le DOM.
   =========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  if (!localStorage.getItem("fablab_token") || localStorage.getItem("fablab_role") !== "admin") {
    window.location.href = "login.html";
    return;
  }

  if (document.getElementById("users-zone"))  await initDashboard();
  if (document.getElementById("groups-zone")) await initGroupes();
  if (document.getElementById("shops-zone") && !document.getElementById("users-zone")) await initMagasins();
});

/* ================================================================
   DASHBOARD — admin.html
   ================================================================ */

let allUsers = [];
let currentDeleteId = null;

async function initDashboard() {
  await loadUsers();
  await populateGroupSelect();

  document.getElementById("btn-create").addEventListener("click", openCreateModal);
  document.getElementById("btn-modal-cancel").addEventListener("click", closeCreateModal);
  document.getElementById("btn-modal-submit").addEventListener("click", submitCreateUser);
  document.getElementById("btn-delete-cancel").addEventListener("click", () => {
    document.getElementById("modal-delete").classList.add("hidden");
  });
  document.getElementById("btn-delete-confirm").addEventListener("click", confirmDelete);
  document.getElementById("search-input").addEventListener("input", filterUsers);
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      filterUsers();
    });
  });
}

async function loadUsers() {
  const zone = document.getElementById("users-zone");
  try {
    allUsers = await api.adminGetUsers("");
    renderUsers(allUsers);
  } catch {
    zone.innerHTML = `<div class="empty-state">Impossible de charger les comptes.</div>`;
  }
}

function renderUsers(users) {
  const zone = document.getElementById("users-zone");
  if (!users || users.length === 0) {
    zone.innerHTML = `<div class="empty-state"><div class="ic">👥</div>Aucun compte trouvé.</div>`;
    return;
  }
  zone.innerHTML = users.map(u => `
    <div class="user-row">
      <div class="user-info">
        <div class="avatar" style="background:var(--blush);color:var(--wine);flex-shrink:0;">
          ${u.email.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div class="user-email">${u.email}</div>
          ${u.group ? `<div style="font-size:12px;color:var(--ink-soft);">Groupe : ${u.group}</div>` : ""}
        </div>
        <span class="tag-role ${u.role}">${u.role}</span>
      </div>
      <div class="user-actions">
        <button class="btn btn-ghost btn-sm" onclick="openDeleteModal('${u.id}','${u.email}')">Supprimer</button>
      </div>
    </div>`).join("");
}

function filterUsers() {
  const search = document.getElementById("search-input").value.toLowerCase();
  const activeRole = document.querySelector(".filter-btn.active")?.dataset.role || "";
  const filtered = allUsers.filter(u => {
    const matchRole   = !activeRole || u.role === activeRole;
    const matchSearch = !search || u.email.toLowerCase().includes(search);
    return matchRole && matchSearch;
  });
  renderUsers(filtered);
}

function openCreateModal() {
  document.getElementById("created-pwd-zone").style.display = "none";
  document.getElementById("create-error").style.display = "none";
  document.getElementById("btn-modal-submit").style.display = "";
  document.getElementById("new-email").value = "";
  document.getElementById("modal-create").classList.remove("hidden");
}

function closeCreateModal() {
  document.getElementById("modal-create").classList.add("hidden");
  loadUsers();
}

async function submitCreateUser() {
  const email   = document.getElementById("new-email").value;
  const role    = document.getElementById("new-role").value;
  const groupId = document.getElementById("new-group").value;
  const errorEl = document.getElementById("create-error");
  errorEl.style.display = "none";
  if (!email) {
    errorEl.textContent = "L'adresse e-mail est requise.";
    errorEl.style.display = "block";
    return;
  }
  try {
    const result = await api.adminCreateUser({ email, role, groupId: groupId || null });
    document.getElementById("created-pwd").textContent = result.temporaryPassword;
    document.getElementById("created-pwd-zone").style.display = "block";
    document.getElementById("btn-modal-submit").style.display = "none";
  } catch (err) {
    errorEl.textContent = err.message || "Impossible de créer le compte.";
    errorEl.style.display = "block";
  }
}

function openDeleteModal(userId, email) {
  currentDeleteId = userId;
  document.getElementById("delete-email-label").textContent =
    `Supprimer le compte « ${email} » ? Cette action est irréversible.`;
  document.getElementById("modal-delete").classList.remove("hidden");
}

async function confirmDelete() {
  try {
    await api.adminDeleteUser(currentDeleteId);
    document.getElementById("modal-delete").classList.add("hidden");
    await loadUsers();
  } catch (err) {
    alert("Impossible de supprimer ce compte : " + err.message);
  }
}

async function populateGroupSelect() {
  try {
    const groups = await api.adminGetGroups();
    const select = document.getElementById("new-group");
    if (!select) return;
    groups.forEach(g => {
      const opt = document.createElement("option");
      opt.value = g.id;
      opt.textContent = g.name;
      select.appendChild(opt);
    });
  } catch {}
}

/* ================================================================
   GROUPES — admin-groupes.html
   ================================================================ */

let currentGroupId = null;

async function initGroupes() {
  await loadGroups();

  document.getElementById("btn-create-group").addEventListener("click", () => {
    document.getElementById("group-name").value = "";
    document.getElementById("group-create-error").style.display = "none";
    document.getElementById("modal-create-group").classList.remove("hidden");
  });
  document.getElementById("btn-group-cancel").addEventListener("click", () => {
    document.getElementById("modal-create-group").classList.add("hidden");
  });
  document.getElementById("btn-group-submit").addEventListener("click", submitCreateGroup);
  document.getElementById("btn-member-cancel").addEventListener("click", () => {
    document.getElementById("modal-add-member").classList.add("hidden");
  });
  document.getElementById("btn-member-submit").addEventListener("click", submitAddMember);
}

async function loadGroups() {
  const zone = document.getElementById("groups-zone");
  try {
    const groups = await api.adminGetGroups();
    if (!groups || groups.length === 0) {
      zone.innerHTML = `<div class="empty-state"><div class="ic">⬡</div>Aucun groupe créé.</div>`;
      return;
    }
    zone.innerHTML = groups.map(g => `
      <div class="group-row">
        <div class="group-info">
          <div class="group-name">${g.name}</div>
          <div class="group-meta">
            ${g.memberCount ?? 0} membre(s)
            ${g.shopName ? ` · Magasin lié : ${g.shopName}` : ""}
          </div>
        </div>
        <div class="group-actions">
          <button class="btn btn-ghost btn-sm" onclick="openAddMember('${g.id}','${g.name}')">+ Membre</button>
        </div>
      </div>`).join("");
  } catch {
    zone.innerHTML = `<div class="empty-state">Impossible de charger les groupes.</div>`;
  }
}

async function submitCreateGroup() {
  const name    = document.getElementById("group-name").value;
  const errorEl = document.getElementById("group-create-error");
  errorEl.style.display = "none";
  if (!name) {
    errorEl.textContent = "Le nom du groupe est requis.";
    errorEl.style.display = "block";
    return;
  }
  try {
    await api.adminCreateGroup({ name });
    document.getElementById("modal-create-group").classList.add("hidden");
    await loadGroups();
  } catch (err) {
    errorEl.textContent = err.message || "Impossible de créer le groupe.";
    errorEl.style.display = "block";
  }
}

async function openAddMember(groupId, groupName) {
  currentGroupId = groupId;
  document.getElementById("member-group-label").textContent = `Groupe : ${groupName}`;
  document.getElementById("member-error").style.display = "none";
  const select = document.getElementById("member-select");
  select.innerHTML = `<option value="">Chargement...</option>`;
  document.getElementById("modal-add-member").classList.remove("hidden");
  try {
    const users = await api.adminGetUsers("");
    select.innerHTML = users.map(u => `<option value="${u.id}">${u.email} (${u.role})</option>`).join("");
  } catch {
    select.innerHTML = `<option value="">Impossible de charger les comptes</option>`;
  }
}

async function submitAddMember() {
  const userId  = document.getElementById("member-select").value;
  const errorEl = document.getElementById("member-error");
  errorEl.style.display = "none";
  if (!userId) {
    errorEl.textContent = "Sélectionnez un compte.";
    errorEl.style.display = "block";
    return;
  }
  try {
    await api.adminAddGroupMember(currentGroupId, { userId });
    document.getElementById("modal-add-member").classList.add("hidden");
    await loadGroups();
  } catch (err) {
    errorEl.textContent = err.message || "Impossible d'ajouter ce membre.";
    errorEl.style.display = "block";
  }
}

/* ================================================================
   MAGASINS — admin-magasins.html
   ================================================================ */

let currentLinkShopId = null;

async function initMagasins() {
  await loadAdminShops();

  document.getElementById("link-type").addEventListener("change", (e) => {
    document.getElementById("link-user-field").style.display  = e.target.value === "user"  ? "" : "none";
    document.getElementById("link-group-field").style.display = e.target.value === "group" ? "" : "none";
  });
  document.getElementById("btn-link-cancel").addEventListener("click", () => {
    document.getElementById("modal-link").classList.add("hidden");
  });
  document.getElementById("btn-link-submit").addEventListener("click", submitLinkShop);
}

async function loadAdminShops() {
  const zone = document.getElementById("shops-zone");
  try {
    const shops = await api.adminGetAllShops();
    if (!shops || shops.length === 0) {
      zone.innerHTML = `<div class="empty-state"><div class="ic">🏭</div>Aucun magasin trouvé.</div>`;
      return;
    }
    zone.innerHTML = shops.map(shop => `
      <div class="shop-row">
        <div class="shop-info">
          <div class="shop-icon">🏭</div>
          <div>
            <div class="shop-name">${shop.name}</div>
            <div class="shop-meta">
              ${shop.isOpen ? "Ouvert" : "Fermé"}
              ${shop.linkedTo && shop.linkedTo.length > 0
                ? ` · Lié à : ${shop.linkedTo.join(", ")}`
                : " · Non associé"}
            </div>
          </div>
        </div>
        <div class="shop-actions">
          <button class="btn btn-soft btn-sm" onclick="openLinkModal('${shop.id}','${shop.name}')">Associer →</button>
        </div>
      </div>`).join("");
  } catch {
    zone.innerHTML = `<div class="empty-state">Impossible de charger les magasins.</div>`;
  }
}

async function openLinkModal(shopId, shopName) {
  currentLinkShopId = shopId;
  document.getElementById("link-shop-label").textContent = `Magasin : ${shopName}`;
  document.getElementById("link-error").style.display = "none";
  document.getElementById("link-type").value = "user";
  document.getElementById("link-user-field").style.display  = "";
  document.getElementById("link-group-field").style.display = "none";
  document.getElementById("modal-link").classList.remove("hidden");

  try {
    const users = await api.adminGetUsers("");
    document.getElementById("link-user-select").innerHTML =
      users.map(u => `<option value="${u.id}">${u.email} (${u.role})</option>`).join("");
  } catch {
    document.getElementById("link-user-select").innerHTML = `<option>Impossible de charger</option>`;
  }
  try {
    const groups = await api.adminGetGroups();
    document.getElementById("link-group-select").innerHTML =
      groups.map(g => `<option value="${g.id}">${g.name}</option>`).join("");
  } catch {
    document.getElementById("link-group-select").innerHTML = `<option>Impossible de charger</option>`;
  }
}

async function submitLinkShop() {
  const type    = document.getElementById("link-type").value;
  const errorEl = document.getElementById("link-error");
  errorEl.style.display = "none";
  const body = type === "user"
    ? { userId:  document.getElementById("link-user-select").value }
    : { groupId: document.getElementById("link-group-select").value };
  try {
    await api.adminLinkShop(currentLinkShopId, body);
    document.getElementById("modal-link").classList.add("hidden");
    await loadAdminShops();
  } catch (err) {
    errorEl.textContent = err.message || "Impossible d'associer ce magasin.";
    errorEl.style.display = "block";
  }
}
