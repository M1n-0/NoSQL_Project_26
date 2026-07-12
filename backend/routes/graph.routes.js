/* ===========================================================
   Routes /api/graph
   Tout ce qui relève du réseau de relations et des
   recommandations -> Neo4j.
   =========================================================== */

const express = require("express");
const router = express.Router();
const neo4j = require("neo4j-driver");
const { neo4jDriver } = require("../config/neo4j.config");
const { asyncHandler } = require("../utils/async-handler");
const { requireRole } = require("../middleware/auth.middleware");

// GET /api/graph/recommendations -> machines recommandées pour le client connecté
// (basé sur les machines réservées par des clients ayant réservé les mêmes machines que moi)
router.get(
  "/recommendations",
  requireRole("client"),
  asyncHandler(async (req, res) => {
    const session = neo4jDriver.session();
    try {
      const result = await session.run(
        `MATCH (moi:Client {id_client: $userId})-[:A_RESERVE]->(:Machine)<-[:A_RESERVE]-(autre:Client)-[:A_RESERVE]->(reco:Machine)
         WHERE NOT (moi)-[:A_RESERVE]->(reco)
         RETURN reco.id_machine AS id, reco.nom AS name, reco.type AS type, count(*) AS score
         ORDER BY score DESC
         LIMIT 5`,
        { userId: neo4j.int(req.user.id) }
      );
      res.json(
        result.records.map((r) => ({
          id: neo4j.integer.toNumber(r.get("id")),
          name: r.get("name"),
          type: r.get("type"),
          score: r.get("score").toNumber(),
        }))
      );
    } finally {
      await session.close();
    }
  })
);

// GET /api/graph/network -> personnes avec qui le client a déjà croisé en fablab
// (clients qui fréquentent les mêmes magasins)
router.get(
  "/network",
  requireRole("client"),
  asyncHandler(async (req, res) => {
    const session = neo4jDriver.session();
    try {
      const result = await session.run(
        `MATCH (moi:Client {id_client: $userId})-[:FREQUENTE]->(:Magasin)<-[:FREQUENTE]-(autre:Client)
         WHERE moi <> autre
         RETURN DISTINCT autre.id_client AS id, autre.nom AS name`,
        { userId: neo4j.int(req.user.id) }
      );
      res.json(
        result.records.map((r) => ({
          id: neo4j.integer.toNumber(r.get("id")),
          name: r.get("name"),
        }))
      );
    } finally {
      await session.close();
    }
  })
);

module.exports = router;
