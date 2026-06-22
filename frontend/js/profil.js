/* ===========================================================
   FabLab Manager — profil utilisateur
   Utilisé par profil.html (client) ET commercant-profil.html
   =========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  // TODO : réactiver quand le backend auth sera branché
  // const token = localStorage.getItem("fablab_token");
  // if (!token) { window.location.href = "login.html"; return; }
  const token = "dev";

  await loadProfile();

  document.getElementById("profile-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const feedback = document.getElementById("profile-feedback");
    const error = document.getElementById("profile-error");
    feedback.style.display = "none";
    error.style.display = "none";
    try {
      // TODO (backend) : PATCH /api/users/me
      await api.updateMyProfile({ email: document.getElementById("email").value });
      feedback.style.display = "block";
    } catch (err) {
      error.textContent = err.message || "Une erreur est survenue.";
      error.style.display = "block";
    }
  });

  document.getElementById("password-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const feedback = document.getElementById("pwd-feedback");
    const error = document.getElementById("pwd-error");
    feedback.style.display = "none";
    error.style.display = "none";
    const pwdNew = document.getElementById("pwd-new").value;
    const pwdConfirm = document.getElementById("pwd-confirm").value;
    if (pwdNew !== pwdConfirm) {
      error.textContent = "Les mots de passe ne correspondent pas.";
      error.style.display = "block";
      return;
    }
    try {
      // TODO (backend) : PATCH /api/users/me
      await api.updateMyProfile({
        currentPassword: document.getElementById("pwd-current").value,
        newPassword: pwdNew,
      });
      feedback.style.display = "block";
      document.getElementById("password-form").reset();
    } catch (err) {
      error.textContent = err.message || "Mot de passe actuel incorrect.";
      error.style.display = "block";
    }
  });
});

async function loadProfile() {
  try {
    // TODO (backend) : GET /api/users/me
    const profile = await api.getMyProfile();
    document.getElementById("email").value = profile.email || "";
    const initials = profile.email ? profile.email.slice(0, 2).toUpperCase() : "--";

    // Gère les deux layouts (client : user-name/user-initials, commerçant : shop-name-sidebar/shop-initials)
    const nameEl = document.getElementById("user-name") || document.getElementById("shop-name-sidebar");
    const initialsEl = document.getElementById("user-initials") || document.getElementById("shop-initials");
    const initialsElMob = document.getElementById("user-initials-mobile") || document.getElementById("shop-initials-mobile");
    if (nameEl) nameEl.textContent = profile.email;
    if (initialsEl) initialsEl.textContent = initials;
    if (initialsElMob) initialsElMob.textContent = initials;
  } catch {
    const emailEl = document.getElementById("email");
    if (emailEl) emailEl.placeholder = "Impossible de charger le profil";
  }
}
