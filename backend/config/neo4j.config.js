/* ===========================================================
   Connexion Neo4j
   À COMPLÉTER PAR L'ÉQUIPE BASES DE DONNÉES.

   Usage prévu ailleurs dans le code :
     const { neo4jDriver } = require("../config/neo4j.config");
     const session = neo4jDriver.session();
     const result = await session.run("MATCH (u:User) RETURN u LIMIT 10");
     await session.close();
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
