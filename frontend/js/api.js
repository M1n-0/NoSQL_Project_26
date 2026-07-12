/* ===========================================================
   FabLab Manager — module d'appel à l'API backend
   Centralise tous les fetch() pour ne pas les disperser dans
   chaque page. À utiliser depuis les pages (login.html,
   client.html, commercant.html).
   =========================================================== */

const API_BASE_URL = "http://localhost:3000/api";

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("fablab_token");

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `Erreur API (${res.status})`);
  }
  return res.json();
}

const api = {
  // --- Auth ---
  login: (email, password) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  // --- Client ---
  getMyReservations: () => apiRequest("/reservations/me"),
  getShops: () => apiRequest("/shops"),
  reserveMachine: (machineId) =>
    apiRequest(`/machines/${machineId}/reserve`, { method: "POST" }),
  setPrintDuration: (reservationId, minutes) =>
    apiRequest(`/reservations/${reservationId}/duration`, {
      method: "PATCH",
      body: JSON.stringify({ minutes }),
    }),
  takeShopSeat: (shopId) =>
    apiRequest(`/shops/${shopId}/seat`, { method: "POST" }),

  // --- Commerçant ---
  getMyShop: () => apiRequest("/shops/me"),
  updateMyShop: (data) =>
    apiRequest("/shops/me", { method: "PATCH", body: JSON.stringify(data) }),
  getMyMachines: () => apiRequest("/machines/me"),
  addMachine: (data) =>
    apiRequest("/machines", { method: "POST", body: JSON.stringify(data) }),
  updateMachineStatus: (machineId, status) =>
    apiRequest(`/machines/${machineId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  getCurrentOccupancy: () => apiRequest("/shops/me/occupancy"),

  // --- Profil utilisateur ---
  getMyProfile: () => apiRequest("/users/me"),
  updateMyProfile: (data) => apiRequest("/users/me", { method: "PATCH", body: JSON.stringify(data) }),

  // --- Magasins liés au compte client ---
  getMyLinkedShops: () => apiRequest("/shops/mine"),
  reserveOnline: (shopId, data) =>
    apiRequest(`/shops/${shopId}/reserve-online`, { method: "POST", body: JSON.stringify(data) }),

  // --- Machines par magasin (flux commande) ---
  getMachinesForShop: (shopId) => apiRequest(`/machines?shopId=${encodeURIComponent(shopId)}`),

  // --- Historique complet client ---
  getMyFullHistory: () => apiRequest("/reservations/me/history"),

  // --- Historique commerçant ---
  getMerchantHistory: () => apiRequest("/reservations/shop/history"),
  updateReservationStatus: (reservationId, status) =>
    apiRequest(`/reservations/${reservationId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // --- Admin : comptes ---
  adminGetUsers: (role) => apiRequest(`/admin/users${role ? `?role=${encodeURIComponent(role)}` : ""}`),
  adminCreateUser: (data) =>
    apiRequest("/admin/users", { method: "POST", body: JSON.stringify(data) }),
  adminDeleteUser: (id) => apiRequest(`/admin/users/${id}`, { method: "DELETE" }),

  // --- Admin : groupes ---
  adminGetGroups: () => apiRequest("/admin/groups"),
  adminCreateGroup: (data) =>
    apiRequest("/admin/groups", { method: "POST", body: JSON.stringify(data) }),
  adminAddGroupMember: (groupId, data) =>
    apiRequest(`/admin/groups/${groupId}/members`, { method: "POST", body: JSON.stringify(data) }),

  // --- Admin : magasins ---
  adminGetAllShops: () => apiRequest("/admin/shops"),
  adminLinkShop: (shopId, data) =>
    apiRequest(`/admin/shops/${shopId}/link`, { method: "POST", body: JSON.stringify(data) }),
};

// Formate une date ISO (ex: "2026-07-07T12:25:07.000Z") en date/heure lisible (ex: "07/07/2026 12h25").
function formatDate(isoString) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  const date = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h");
  return `${date} ${time}`;
}
