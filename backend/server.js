/* ===========================================================
   FabLab Manager — point d'entrée du serveur
   =========================================================== */

require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");

const { redisClient } = require("./config/redis.config");
const { requireAuth, requireRole } = require("./middleware/auth.middleware");

const authRoutes = require("./routes/auth.routes");
const shopRoutes = require("./routes/shops.routes");
const machineRoutes = require("./routes/machines.routes");
const reservationRoutes = require("./routes/reservations.routes");
const graphRoutes = require("./routes/graph.routes");
const userRoutes = require("./routes/users.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();
app.use(cors());
app.use(express.json());

// --- Frontend statique (pages/, css/, js/) ---
const FRONTEND_DIR = process.env.FRONTEND_DIR || path.join(__dirname, "..", "frontend");
app.use(express.static(FRONTEND_DIR));
app.get("/", (req, res) => res.redirect("/pages/login.html"));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api", requireAuth);
app.use("/api/shops", shopRoutes);
app.use("/api/machines", machineRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/graph", graphRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", requireRole("admin"), adminRoutes);

// --- Gestion d'erreur générique ---
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Erreur interne du serveur." });
});

const PORT = process.env.PORT || 3000;

async function start() {
  await redisClient.connect();
  app.listen(PORT, () => {
    console.log(`FabLab Manager API démarrée sur http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Échec du démarrage du serveur :", err);
  process.exit(1);
});
