/* ===========================================================
   Routes /api/reservations
   - Réservations / commandes -> SQL (transactionnel)
   - Confirmation de durée d'impression -> Redis (TTL 20 min)
   =========================================================== */

const express = require("express");
const router = express.Router();
const { sqlPool } = require("../config/sql.config");
const { redisClient } = require("../config/redis.config");
const { asyncHandler } = require("../utils/async-handler");
const { requireRole } = require("../middleware/auth.middleware");

const STATUS_LABEL = {
  terminee: { label: "Terminé", cls: "pill-ok" },
  confirmee: { label: "Confirmé", cls: "pill-ok" },
  en_attente: { label: "En attente", cls: "pill-warn" },
  annulee: { label: "Annulé", cls: "pill-danger" },
};

// GET /api/reservations/me -> réservation active du client connecté
router.get(
  "/me",
  requireRole("client"),
  asyncHandler(async (req, res) => {
    const [rows] = await sqlPool.query(
      `SELECT r.id, r.statut, r.date_debut, r.date_fin, r.duree_minutes,
              ma.nom AS machine_nom, m.nom AS magasin_nom
       FROM reservations r
       JOIN machines ma ON ma.id = r.machine_id
       JOIN magasins m  ON m.id = ma.magasin_id
       WHERE r.client_id = ? AND r.statut IN ('en_attente', 'confirmee')
       ORDER BY r.created_at DESC
       LIMIT 1`,
      [req.user.id]
    );
    const active = rows[0];

    if (!active) {
      return res.json({ hasActive: false });
    }

    let daysLeft = null;
    if (active.date_fin) {
      const msLeft = new Date(active.date_fin).getTime() - Date.now();
      const daysPart = Math.max(0, Math.floor(msLeft / 86400000));
      const hoursPart = Math.max(0, Math.floor((msLeft % 86400000) / 3600000));
      daysLeft = `${daysPart}j ${hoursPart}h`;
    }

    res.json({
      hasActive: true,
      id: String(active.id),
      itemName: active.machine_nom,
      shopName: active.magasin_nom,
      status: active.statut === "confirmee" ? "En cours d'impression" : "En attente de confirmation",
      rawStatus: active.statut,
      daysLeft,
    });
  })
);

// GET /api/reservations/me/history -> historique des réservations passées
router.get(
  "/me/history",
  requireRole("client"),
  asyncHandler(async (req, res) => {
    const [rows] = await sqlPool.query(
      `SELECT r.id, r.statut, r.date_debut, r.duree_minutes,
              ma.nom AS machine_nom, m.nom AS magasin_nom
       FROM reservations r
       JOIN machines ma ON ma.id = r.machine_id
       JOIN magasins m  ON m.id = ma.magasin_id
       WHERE r.client_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(
      rows.map((r) => {
        const meta = STATUS_LABEL[r.statut] || STATUS_LABEL.en_attente;
        return {
          id: String(r.id),
          itemName: r.machine_nom,
          shopName: r.magasin_nom,
          date: r.date_debut,
          duration: r.duree_minutes ? `${r.duree_minutes} min` : null,
          status: meta.label,
          statusClass: meta.cls,
        };
      })
    );
  })
);

// GET /api/reservations/shop/history -> historique des réservations du magasin (commerçant)
router.get(
  "/shop/history",
  requireRole("commercant"),
  asyncHandler(async (req, res) => {
    const [rows] = await sqlPool.query(
      `SELECT r.id, r.date_debut AS date, r.duree_minutes, r.statut,
              CONCAT(u.prenom, ' ', u.nom) AS client_name,
              ma.nom AS machine_name
       FROM reservations r
       JOIN users u    ON u.id = r.client_id
       JOIN machines ma ON ma.id = r.machine_id
       JOIN magasins m  ON m.id = ma.magasin_id
       WHERE m.commercant_id = ?
       ORDER BY r.date_debut DESC`,
      [req.user.id]
    );

    res.json(
      rows.map((r) => {
        const meta = STATUS_LABEL[r.statut] || STATUS_LABEL.en_attente;
        return {
          id: String(r.id),
          clientName: r.client_name,
          machineName: r.machine_name,
          date: r.date,
          duration: r.duree_minutes ? `${r.duree_minutes} min` : "-",
          status: meta.label,
          statusClass: meta.cls,
          rawStatus: r.statut,
        };
      })
    );
  })
);

// PATCH /api/reservations/:id/status -> le commerçant valide, termine ou annule une réservation
router.patch(
  "/:id/status",
  requireRole("commercant"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!["confirmee", "terminee", "annulee"].includes(status)) {
      return res.status(400).json({ message: "Statut invalide." });
    }

    const [[reservation]] = await sqlPool.query(
      `SELECT r.machine_id
       FROM reservations r
       JOIN machines ma ON ma.id = r.machine_id
       JOIN magasins m  ON m.id = ma.magasin_id
       WHERE r.id = ? AND m.commercant_id = ?`,
      [id, req.user.id]
    );
    if (!reservation) return res.status(404).json({ message: "Réservation introuvable." });

    await sqlPool.query("UPDATE reservations SET statut = ? WHERE id = ?", [status, id]);

    // une réservation terminée ou annulée libère la machine (le statut SQL de la
    // machine reste "disponible", seul Redis suit l'état "réservée" temps réel)
    if (status === "terminee" || status === "annulee") {
      await redisClient.del(`machine:${reservation.machine_id}:statut`);
    }

    res.json({ message: "Statut de la réservation mis à jour." });
  })
);

// PATCH /api/reservations/:id/duration -> le client renseigne le temps d'impression
router.patch(
  "/:id/duration",
  requireRole("client"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { minutes } = req.body;
    if (!minutes || minutes <= 0) {
      return res.status(400).json({ message: "Durée invalide." });
    }

    const [[reservation]] = await sqlPool.query(
      "SELECT machine_id FROM reservations WHERE id = ? AND client_id = ?",
      [id, req.user.id]
    );
    if (!reservation) return res.status(404).json({ message: "Réservation introuvable." });

    await sqlPool.query(
      "UPDATE reservations SET statut = 'confirmee', duree_minutes = ?, date_fin = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id = ?",
      [minutes, minutes, id]
    );

    // remplace le TTL de 20 min par la durée réelle d'impression annoncée
    await redisClient.set(`machine:${reservation.machine_id}:statut`, "reserve", {
      EX: minutes * 60,
    });

    res.json({ message: `Durée d'impression de ${minutes} min enregistrée.` });
  })
);

module.exports = router;
