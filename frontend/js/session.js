/* ===========================================================
   FabLab Manager — menu profil (déconnexion) + identité sidebar
   Ajoute un petit menu déroulant sur la carte utilisateur en
   bas de la sidebar, avec une option pour se déconnecter, et
   remplace le "Chargement..." par le nom réel du compte connecté.
   =========================================================== */

async function loadSidebarIdentity() {
  const nameEl = document.getElementById("user-name") || document.getElementById("shop-name-sidebar");
  const initialsEl = document.getElementById("user-initials") || document.getElementById("shop-initials");
  const initialsElMobile =
    document.getElementById("user-initials-mobile") || document.getElementById("shop-initials-mobile");
  if (!nameEl && !initialsEl && !initialsElMobile) return;

  try {
    const role = localStorage.getItem("fablab_role");
    const label = role === "commercant" ? (await api.getMyShop()).name : (await api.getMyProfile()).email;
    const initials = label.slice(0, 2).toUpperCase();
    if (nameEl) nameEl.textContent = label;
    if (initialsEl) initialsEl.textContent = initials;
    if (initialsElMobile) initialsElMobile.textContent = initials;
  } catch {
    if (nameEl) nameEl.textContent = "Erreur de chargement";
  }
}

loadSidebarIdentity();

function logout() {
  localStorage.removeItem("fablab_token");
  localStorage.removeItem("fablab_role");
  window.location.href = "login.html";
}

document.querySelectorAll(".sidebar .user-card").forEach((card) => {
  const menu = document.createElement("div");
  menu.className = "user-menu";
  menu.innerHTML = `<button type="button" data-action="logout"><span class="ic">⏻</span> Se déconnecter</button>`;
  card.appendChild(menu);

  card.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("open");
  });

  menu.querySelector('[data-action="logout"]').addEventListener("click", (e) => {
    e.stopPropagation();
    logout();
  });
});

document.addEventListener("click", () => {
  document.querySelectorAll(".user-menu.open").forEach((m) => m.classList.remove("open"));
});
