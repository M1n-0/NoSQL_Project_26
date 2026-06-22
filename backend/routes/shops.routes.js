/* ===========================================================
   Routes /api/shops
   - Infos statiques du magasin -> SQL
   - Fiche enrichie (description, photos) -> MongoDB
   - Compteur de places en temps réel -> Redis
   =========================================================== */

const express = require("express");
const router = express.Router();
// const { sqlPool } = require("../config/sql.config");
// const { redisClient } = require("../config/redis.config");
// const { getMongoDb } = require("../config/mongo.config");

// GET /api/shops -> liste des magasins (vue client)
router.get("/", async (req, res) => {
  // TODO (équipe BDD) :
  // 1. récupérer la liste des magasins en SQL (nom, horaires)
  // 2. pour chacun, lire le compteur de places en Redis (clé ex: shop:{id}:seats)
  res.json([
    { id: "1", name: "FabLab Lormont", isOpen: true, closesAt: "19h00", seatsTaken: 4, seatsMax: 12 },
    { id: "2", name: "Atelier Ynov Bordeaux", isOpen: true, closesAt: "18h00", seatsTaken: 12, seatsMax: 12 },
    { id: "3", name: "MakerSpace Bègles", isOpen: false, closesAt: null, seatsTaken: 0, seatsMax: 10 },
  ]);
});

// GET /api/shops/mine -> magasins associés au compte client connecté
router.get("/mine", async (req, res) => {
  // TODO (équipe BDD) :
  // SELECT DISTINCT s.* FROM shops s
  // LEFT JOIN user_shops us  ON us.shop_id  = s.id AND us.user_id  = req.user.id
  // LEFT JOIN group_shops gs ON gs.shop_id  = s.id
  // LEFT JOIN user_groups ug ON ug.group_id = gs.group_id AND ug.user_id = req.user.id
  // WHERE us.user_id IS NOT NULL OR ug.user_id IS NOT NULL
  // + pour chacun, lire le compteur Redis (clé shop:{id}:seats)
  res.json([
    { id: "1", name: "FabLab Lormont",   isOpen: true,  closesAt: "19h00", seatsTaken: 4, seatsMax: 12 },
    { id: "3", name: "MakerSpace Bègles", isOpen: false, closesAt: null,    seatsTaken: 0, seatsMax: 10 },
  ]);
});

// POST /api/shops/:id/reserve-online -> demande de réservation en ligne (magasin fermé/complet)
router.post("/:id/reserve-online", async (req, res) => {
  const { start, end, material } = req.body;
  // TODO (équipe BDD) :
  // INSERT INTO online_reservations (shop_id, user_id, start_date, end_date, material)
  // VALUES ($1, req.user.id, $2, $3, $4)
  res.json({ message: "Demande de réservation en ligne enregistrée (stub)." });
});

// POST /api/shops/:id/seat -> le client prend une place
router.post("/:id/seat", async (req, res) => {
  // TODO (équipe BDD) : incrémenter le compteur Redis shop:{id}:seats
  // (et vérifier qu'on ne dépasse pas la capacité max stockée en SQL)
  res.json({ message: "Place réservée (stub)." });
});

// GET /api/shops/me -> infos du magasin du commerçant connecté
router.get("/me", async (req, res) => {
  // TODO (équipe BDD) : récupérer via l'id du commerçant (req.user.id) en SQL
  res.json({
    name: "FabLab Lormont",
    hours: "08h00 – 19h00",
    capacity: 12,
    contact: "contact@fablab-lormont.fr",
  });
});

// PATCH /api/shops/me -> mise à jour des infos du magasin
router.patch("/me", async (req, res) => {
  // TODO (équipe BDD) : UPDATE en SQL (et/ou Mongo si description enrichie)
  res.json({ message: "Magasin mis à jour (stub)." });
});

// GET /api/shops/me/occupancy -> occupation en temps réel + qui réserve quoi
router.get("/me/occupancy", async (req, res) => {
  // TODO (équipe BDD) :
  // - "current"/"max" -> Redis
  // - liste nominative -> jointure SQL (réservations actives) ou Redis selon modélisation
  res.json({
    current: 4,
    max: 12,
    people: [
      { name: "Erika Labus", reserving: "Imprimante 3D — BIBI" },
      { name: "Théo Martin", reserving: "Poste à souder n°2" },
      { name: "Sofia Dias", reserving: "Place fablab" },
      { name: "Nora Khelif", reserving: "Découpeuse laser" },
    ],
  });
});

module.exports = router;
