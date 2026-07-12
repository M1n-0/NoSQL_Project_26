/* ===========================================================
   Routes /api/machines
   - Infos statiques (nom, fonction, magasin) -> SQL
   - Statut temps réel + TTL 20 min -> Redis
   =========================================================== */

const express = require("express");
const router = express.Router();
const { sqlPool } = require("../config/sql.config");
const { redisClient } = require("../config/redis.config");
const { asyncHandler } = require("../utils/async-handler");
const { requireRole } = require("../middleware/auth.middleware");

const STATUS_MAP = {
  disponible: { status: "available", label: "Disponible" },
  reserve: { status: "busy", label: "Réservée" },
  maintenance: { status: "maintenance", label: "En maintenance" },
};

function toApiMachine(row, statut) {
  const mapped = STATUS_MAP[statut] || STATUS_MAP.disponible;
  return {
    id: String(row.id),
    name: row.nom,
    function: row.fonction,
    status: mapped.status,
    statusLabel: mapped.label,
  };
}

async function enrichWithRedisStatus(rows) {
  return Promise.all(
    rows.map(async (row) => {
      const redisStatut = await redisClient.get(`machine:${row.id}:statut`);
      return toApiMachine(row, redisStatut || row.statut);
    })
  );
}

// GET /api/machines?shopId= -> machines d'un magasin (vue client lors d'un flux commande)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { shopId } = req.query;
    const [rows] = shopId
      ? await sqlPool.query("SELECT id, nom, fonction, statut FROM machines WHERE magasin_id = ?", [shopId])
      : await sqlPool.query("SELECT id, nom, fonction, statut FROM machines");
    res.json(await enrichWithRedisStatus(rows));
  })
);

// GET /api/machines/me -> machines du magasin du commerçant connecté
router.get(
  "/me",
  requireRole("commercant"),
  asyncHandler(async (req, res) => {
    const [rows] = await sqlPool.query(
      `SELECT ma.id, ma.nom, ma.fonction, ma.statut
       FROM machines ma
       JOIN magasins m ON m.id = ma.magasin_id
       WHERE m.commercant_id = ?`,
      [req.user.id]
    );
    res.json(await enrichWithRedisStatus(rows));
  })
);

// POST /api/machines -> ajout d'une nouvelle machine (commerçant)
router.post(
  "/",
  requireRole("commercant"),
  asyncHandler(async (req, res) => {
    const { name, function: fonction, reservationType } = req.body;
    if (!name || !fonction) {
      return res.status(400).json({ message: "Nom et fonction requis." });
    }

    const [[magasin]] = await sqlPool.query("SELECT id FROM magasins WHERE commercant_id = ?", [
      req.user.id,
    ]);
    if (!magasin) return res.status(404).json({ message: "Aucun magasin associé à ce compte." });

    const [result] = await sqlPool.query(
      "INSERT INTO machines (magasin_id, nom, fonction, statut, type_reservation) VALUES (?, ?, ?, 'disponible', ?)",
      [magasin.id, name, fonction, reservationType === "creneau" ? "creneau" : "instantanee"]
    );

    res.status(201).json({ id: String(result.insertId), message: "Machine ajoutée." });
  })
);

// PATCH /api/machines/:id/status -> changement manuel de statut (ex: mise en maintenance)
router.patch(
  "/:id/status",
  requireRole("commercant"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const statutSql = { available: "disponible", busy: "reserve", maintenance: "maintenance" }[status];
    if (!statutSql) return res.status(400).json({ message: "Statut invalide." });

    await sqlPool.query("UPDATE machines SET statut = ? WHERE id = ?", [statutSql, id]);
    await redisClient.set(`machine:${id}:statut`, statutSql);

    res.json({ message: "Statut mis à jour." });
  })
);

// POST /api/machines/:id/reserve -> réservation instantanée (ex: imprimante 3D)
router.post(
  "/:id/reserve",
  requireRole("client"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const [[machine]] = await sqlPool.query("SELECT statut FROM machines WHERE id = ?", [id]);
    if (!machine) return res.status(404).json({ message: "Machine introuvable." });
    if (machine.statut === "maintenance") {
      return res.status(409).json({ message: "Machine en maintenance." });
    }

    const redisStatut = await redisClient.get(`machine:${id}:statut`);
    if (redisStatut === "reserve") {
      return res.status(409).json({ message: "Machine déjà réservée." });
    }

    // TTL 20 min dans Redis (source de vérité du statut temps réel) : si rien
    // n'est confirmé avant l'expiration, la clé disparaît et la machine
    // redevient "disponible" automatiquement (le statut SQL, lui, ne bouge pas).
    await redisClient.set(`machine:${id}:statut`, "reserve", { EX: 1200 });
    await sqlPool.query(
      "INSERT INTO reservations (client_id, machine_id, statut, date_debut) VALUES (?, ?, 'en_attente', NOW())",
      [req.user.id, id]
    );

    res.json({ message: "Machine réservée pour 20 minutes." });
  })
);

module.exports = router;
