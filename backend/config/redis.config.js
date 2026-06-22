/* ===========================================================
   Connexion Redis
   À COMPLÉTER PAR L'ÉQUIPE BASES DE DONNÉES.

   Usage prévu ailleurs dans le code :
     const { redisClient } = require("../config/redis.config");
     await redisClient.set(`machine:${id}:status`, "reserved", { EX: 1200 }); // TTL 20 min
     const status = await redisClient.get(`machine:${id}:status`);
   =========================================================== */

const { createClient } = require("redis");

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
  },
});

redisClient.on("error", (err) => console.error("Erreur Redis :", err));

// TODO (équipe BDD) : se connecter au démarrage du serveur :
// redisClient.connect();

module.exports = { redisClient };
