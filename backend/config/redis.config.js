/* ===========================================================
   Connexion Redis
   La connexion effective (redisClient.connect()) est faite au
   démarrage du serveur, voir server.js.
   =========================================================== */

const { createClient } = require("redis");

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
  },
  password: process.env.REDIS_PASSWORD,
});

redisClient.on("error", (err) => console.error("Erreur Redis :", err));

module.exports = { redisClient };
