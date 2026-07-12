/* ===========================================================
   FabLab Manager — profil utilisateur
   Utilisé par profil.html (client) ET commercant-profil.html
   =========================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  if (!localStorage.getItem("fablab_token")) {
    window.location.href = "login.html";
    return;
  }

  await loadProfile();

  document.getElementById("profile-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const feedback = document.getElementById("profile-feedback");
    const error = document.getElementById("profile-error");
    feedback.style.display = "none";
    error.style.display = "none";
    try {
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
    const profile = await api.getMyProfile();
    document.getElementById("email").value = profile.email || "";
  } catch {
    const emailEl = document.getElementById("email");
    if (emailEl) emailEl.placeholder = "Impossible de charger le profil";
  }
}
