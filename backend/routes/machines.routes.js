/* ===========================================================
   Routes /api/machines
   - Infos statiques (nom, fonction, magasin) -> SQL
   - Fiche technique détaillée (specs variables) -> MongoDB
   - Statut temps réel + TTL 20 min -> Redis
   =========================================================== */

const express = require("express");
const router = express.Router();
// const { sqlPool } = require("../config/sql.config");
// const { redisClient } = require("../config/redis.config");
// const { getMongoDb } = require("../config/mongo.config");

// GET /api/machines?shopId= -> machines d'un magasin (vue client lors d'un flux commande)
router.get("/", async (req, res) => {
  const { shopId } = req.query;
  // TODO (équipe BDD) :
  // SELECT m.id, m.name, m.function, m.shop_id FROM machines m
  // WHERE ($1::text IS NULL OR m.shop_id = $1)
  // + enrichir chaque machine avec son statut Redis (clé machine:{id}:status)
  res.json([
    { id: "m1", name: "Imprimante 3D — BIBI", function: "Impression FDM grand format", status: "busy",        statusLabel: "Réservée · 20 min" },
    { id: "m2", name: "Imprimante 3D — KIKI", function: "Impression FDM compacte",     status: "available",   statusLabel: "Disponible" },
    { id: "m3", name: "Poste à souder n°2",    function: "Soudure électronique",         status: "busy",        statusLabel: "Réservé 14h00–15h30" },
    { id: "m4", name: "Découpeuse laser",       function: "Découpe bois / acrylique",    status: "maintenance", statusLabel: "En maintenance" },
  ]);
});

// GET /api/machines/me -> machines du magasin du commerçant connecté
router.get("/me", async (req, res) => {
  // TODO (équipe BDD) :
  // 1. lister les machines du magasin en SQL
  // 2. enrichir chaque machine avec son statut temps réel depuis Redis (clé ex: machine:{id}:status)
  res.json([
    { id: "m1", name: "Imprimante 3D — BIBI", function: "Impression FDM grand format", status: "busy", statusLabel: "Réservée · 20 min" },
    { id: "m2", name: "Imprimante 3D — KIKI", function: "Impression FDM compacte", status: "available", statusLabel: "Disponible" },
    { id: "m3", name: "Poste à souder n°2", function: "Soudure électronique", status: "busy", statusLabel: "Réservé 14h00–15h30" },
    { id: "m4", name: "Découpeuse laser", function: "Découpe bois / acrylique", status: "maintenance", statusLabel: "En maintenance" },
  ]);
});

// POST /api/machines -> ajout d'une nouvelle machine (commerçant)
router.post("/", async (req, res) => {
  // TODO (équipe BDD) : INSERT en SQL (nom, fonction, magasin_id, statut initial)
  // + éventuelle fiche technique détaillée en Mongo si besoin
  res.json({ message: "Machine ajoutée (stub)." });
});

// PATCH /api/machines/:id/status -> changement manuel de statut (ex: mise en maintenance)
router.patch("/:id/status", async (req, res) => {
  // TODO (équipe BDD) : mettre à jour Redis (statut temps réel) + historiser en SQL si besoin
  res.json({ message: "Statut mis à jour (stub)." });
});

// POST /api/machines/:id/reserve -> réservation instantanée (ex: imprimante 3D)
router.post("/:id/reserve", async (req, res) => {
  // TODO (équipe BDD) :
  // - poser une clé Redis machine:{id}:status = "reserved" avec EX 1200 (20 min)
  // - si rien n'est confirmé avant l'expiration -> redevient "available" automatiquement (TTL Redis)
  res.json({ message: "Machine réservée pour 20 minutes (stub)." });
});

module.exports = router;
