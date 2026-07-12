/* ===========================================================
   Routes /api/shops
   - Infos statiques du magasin -> SQL
   - Fiche enrichie (description, photos) -> MongoDB
   - Compteur de places en temps réel -> Redis
   =========================================================== */

const express = require("express");
const router = express.Router();
const { sqlPool } = require("../config/sql.config");
const { redisClient } = require("../config/redis.config");
const { getMongoDb } = require("../config/mongo.config");
const { asyncHandler } = require("../utils/async-handler");
const { requireRole } = require("../middleware/auth.middleware");
const { isOpenNow, formatHeure } = require("../utils/hours");

async function withOccupancy(magasin) {
  const seatsTaken = parseInt((await redisClient.get(`magasin:${magasin.id}:occupation`)) || "0", 10);
  const open = isOpenNow(magasin.horaire_ouverture, magasin.horaire_fermeture);
  return {
    id: String(magasin.id),
    name: magasin.nom,
    isOpen: open,
    closesAt: open ? formatHeure(magasin.horaire_fermeture) : null,
    seatsTaken,
    seatsMax: magasin.capacite_max,
  };
}

// GET /api/shops -> liste des magasins (vue client)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const [magasins] = await sqlPool.query(
      "SELECT id, nom, capacite_max, horaire_ouverture, horaire_fermeture FROM magasins"
    );
    res.json(await Promise.all(magasins.map(withOccupancy)));
  })
);

// GET /api/shops/mine -> magasins associés au compte client connecté
router.get(
  "/mine",
  requireRole("client"),
  asyncHandler(async (req, res) => {
    const [magasins] = await sqlPool.query(
      `SELECT DISTINCT m.id, m.nom, m.capacite_max, m.horaire_ouverture, m.horaire_fermeture
       FROM magasins m
       LEFT JOIN client_magasin cm ON cm.magasin_id = m.id AND cm.client_id = ?
       LEFT JOIN groupe_magasins gm ON gm.magasin_id = m.id
       LEFT JOIN user_groupes ug ON ug.groupe_id = gm.groupe_id AND ug.user_id = ?
       WHERE cm.client_id IS NOT NULL OR ug.user_id IS NOT NULL`,
      [req.user.id, req.user.id]
    );
    res.json(await Promise.all(magasins.map(withOccupancy)));
  })
);

// POST /api/shops/:id/reserve-online -> demande de réservation en ligne (magasin fermé/complet)
router.post(
  "/:id/reserve-online",
  requireRole("client"),
  asyncHandler(async (req, res) => {
    const { start, end, material } = req.body;
    const db = await getMongoDb();
    await db.collection("online_reservations").insertOne({
      magasin_id: parseInt(req.params.id, 10),
      client_id: req.user.id,
      start,
      end,
      material,
      created_at: new Date(),
    });
    res.json({ message: "Demande de réservation en ligne enregistrée." });
  })
);

// POST /api/shops/:id/seat -> le client prend une place
router.post(
  "/:id/seat",
  requireRole("client"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const [[magasin]] = await sqlPool.query("SELECT capacite_max FROM magasins WHERE id = ?", [id]);
    if (!magasin) return res.status(404).json({ message: "Magasin introuvable." });

    const occupation = parseInt((await redisClient.get(`magasin:${id}:occupation`)) || "0", 10);
    if (occupation >= magasin.capacite_max) {
      return res.status(409).json({ message: "Magasin complet." });
    }

    const newOccupation = await redisClient.incr(`magasin:${id}:occupation`);
    res.json({ message: "Place réservée.", occupation: newOccupation, capacite: magasin.capacite_max });
  })
);

// GET /api/shops/me -> infos du magasin du commerçant connecté
router.get(
  "/me",
  requireRole("commercant"),
  asyncHandler(async (req, res) => {
    const [[magasin]] = await sqlPool.query("SELECT * FROM magasins WHERE commercant_id = ?", [
      req.user.id,
    ]);
    if (!magasin) return res.status(404).json({ message: "Aucun magasin associé à ce compte." });

    const db = await getMongoDb();
    const details = await db.collection("magasins_details").findOne({ id_magasin: magasin.id });

    res.json({
      id: String(magasin.id),
      name: magasin.nom,
      hours: `${formatHeure(magasin.horaire_ouverture)} – ${formatHeure(magasin.horaire_fermeture)}`,
      openTime: magasin.horaire_ouverture.slice(0, 5),
      closeTime: magasin.horaire_fermeture.slice(0, 5),
      capacity: magasin.capacite_max,
      contact: magasin.contact,
      description: details?.description || null,
      photos: details?.photos || [],
    });
  })
);

// PATCH /api/shops/me -> mise à jour des infos du magasin
router.patch(
  "/me",
  requireRole("commercant"),
  asyncHandler(async (req, res) => {
    const { name, capacity, openTime, closeTime, contact, description } = req.body;

    const [[magasin]] = await sqlPool.query("SELECT id FROM magasins WHERE commercant_id = ?", [
      req.user.id,
    ]);
    if (!magasin) return res.status(404).json({ message: "Aucun magasin associé à ce compte." });

    const fields = [];
    const values = [];
    if (name) { fields.push("nom = ?"); values.push(name); }
    if (capacity) { fields.push("capacite_max = ?"); values.push(capacity); }
    if (openTime) { fields.push("horaire_ouverture = ?"); values.push(openTime); }
    if (closeTime) { fields.push("horaire_fermeture = ?"); values.push(closeTime); }
    if (contact) { fields.push("contact = ?"); values.push(contact); }

    if (fields.length) {
      values.push(magasin.id);
      await sqlPool.query(`UPDATE magasins SET ${fields.join(", ")} WHERE id = ?`, values);
    }

    if (description) {
      const db = await getMongoDb();
      await db
        .collection("magasins_details")
        .updateOne({ id_magasin: magasin.id }, { $set: { description } }, { upsert: true });
    }

    res.json({ message: "Magasin mis à jour." });
  })
);

// GET /api/shops/me/occupancy -> occupation en temps réel + qui réserve quoi
router.get(
  "/me/occupancy",
  requireRole("commercant"),
  asyncHandler(async (req, res) => {
    const [[magasin]] = await sqlPool.query(
      "SELECT id, capacite_max FROM magasins WHERE commercant_id = ?",
      [req.user.id]
    );
    if (!magasin) return res.status(404).json({ message: "Aucun magasin associé à ce compte." });

    const current = parseInt((await redisClient.get(`magasin:${magasin.id}:occupation`)) || "0", 10);
    const [rows] = await sqlPool.query(
      `SELECT u.nom, u.prenom, ma.nom AS machine_nom
       FROM reservations r
       JOIN users u ON u.id = r.client_id
       JOIN machines ma ON ma.id = r.machine_id
       WHERE ma.magasin_id = ? AND r.statut IN ('confirmee', 'en_attente')`,
      [magasin.id]
    );

    res.json({
      current,
      max: magasin.capacite_max,
      people: rows.map((r) => ({ name: `${r.prenom} ${r.nom}`, reserving: r.machine_nom })),
    });
  })
);

module.exports = router;
