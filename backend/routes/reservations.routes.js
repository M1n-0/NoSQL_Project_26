/* ===========================================================
   Routes /api/reservations
   - Réservations / commandes -> SQL (transactionnel)
   - Confirmation de durée d'impression -> Redis (annule le TTL de 20 min)
   =========================================================== */

const express = require("express");
const router = express.Router();
// const { sqlPool } = require("../config/sql.config");
// const { redisClient } = require("../config/redis.config");

// GET /api/reservations/me -> réservation active du client connecté
router.get("/me", async (req, res) => {
  // TODO (équipe BDD) : SELECT en SQL la réservation active du user (req.user.id)
  res.json({
    hasActive: true,
    itemName: "Imprimante 3D — BIBI",
    shopName: "FabLab Lormont",
    status: "En cours d'impression",
    daysLeft: "2j 14h",
  });
});

// GET /api/reservations/me/history -> historique des réservations passées
router.get("/me/history", async (req, res) => {
  // TODO (équipe BDD) : SELECT en SQL, triées par date décroissante
  res.json([]);
});

// GET /api/reservations/shop/history -> historique des réservations du magasin (commerçant)
router.get("/shop/history", async (req, res) => {
  // TODO (équipe BDD) :
  // SELECT r.id, u.email AS client_email, CONCAT(u.first_name,' ',u.last_name) AS client_name,
  //   m.name AS machine_name, r.created_at AS date, r.duration_min, r.status
  // FROM reservations r
  // JOIN users u     ON u.id = r.user_id
  // JOIN machines m  ON m.id = r.machine_id
  // JOIN shops s     ON s.id = m.shop_id
  // WHERE s.owner_id = req.user.id
  // ORDER BY r.created_at DESC
  res.json([
    { clientName: "Theo Martin",  machineName: "Imprimante 3D — BIBI", date: "2026-06-20", duration: "45 min",  status: "Terminé",   statusClass: "pill-ok" },
    { clientName: "Sofia Dias",   machineName: "Découpeuse laser",      date: "2026-06-18", duration: "1h30",    status: "Terminé",   statusClass: "pill-ok" },
    { clientName: "Nora Khelif",  machineName: "Poste à souder n°2",   date: "2026-06-15", duration: "30 min",  status: "Annulé",    statusClass: "pill-danger" },
  ]);
});

// PATCH /api/reservations/:id/duration -> le client renseigne le temps d'impression
router.patch("/:id/duration", async (req, res) => {
  const { minutes } = req.body;
  // TODO (équipe BDD) :
  // - annuler/remplacer le TTL Redis de 20 min par un TTL = minutes fournies
  // - mettre à jour la réservation en SQL avec la durée prévue
  res.json({ message: `Durée d'impression de ${minutes} min enregistrée (stub).` });
});

module.exports = router;
