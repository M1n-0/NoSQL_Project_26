/* ===========================================================
   Routes /api/graph
   Tout ce qui relève du réseau de relations et des
   recommandations -> Neo4j.
   =========================================================== */

const express = require("express");
const router = express.Router();
// const { neo4jDriver } = require("../config/neo4j.config");

// GET /api/graph/recommendations -> machines/magasins recommandés pour le client connecté
router.get("/recommendations", async (req, res) => {
  // TODO (équipe BDD) : requête Cypher type :
  // MATCH (u:User {id: $userId})-[:RESERVED]->(m:Machine)<-[:RESERVED]-(other:User)-[:RESERVED]->(rec:Machine)
  // WHERE NOT (u)-[:RESERVED]->(rec)
  // RETURN rec, count(*) AS score ORDER BY score DESC LIMIT 5
  res.json([]);
});

// GET /api/graph/network -> personnes avec qui le client a déjà croisé en fablab
router.get("/network", async (req, res) => {
  // TODO (équipe BDD) : requête Cypher sur les co-présences en fablab
  res.json([]);
});

module.exports = router;
