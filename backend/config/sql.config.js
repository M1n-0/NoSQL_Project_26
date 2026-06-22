/* ===========================================================
   Connexion SQL (PostgreSQL)
   À COMPLÉTER PAR L'ÉQUIPE BASES DE DONNÉES.

   Usage prévu ailleurs dans le code :
     const { sqlPool } = require("../config/sql.config");
     const result = await sqlPool.query("SELECT * FROM users WHERE id = $1", [id]);
   =========================================================== */

const { Pool } = require("pg");

const sqlPool = new Pool({
  host: process.env.SQL_HOST,
  port: process.env.SQL_PORT,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DATABASE,
});

// TODO (équipe BDD) : vérifier la connexion au démarrage si besoin :
// sqlPool.connect().then(() => console.log("SQL connecté")).catch(console.error);

module.exports = { sqlPool };
