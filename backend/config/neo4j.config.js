/* ===========================================================
   Connexion Neo4j
   =========================================================== */

const neo4j = require("neo4j-driver");

const neo4jDriver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USER || "neo4j",
    process.env.NEO4J_PASSWORD || "changeme"
  )
);

module.exports = { neo4jDriver };
