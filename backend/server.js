/* ===========================================================
   FabLab Manager — point d'entrée du serveur
   =========================================================== */

require("dotenv").config();
const express = require("express");
const cors = require("cors");

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

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/machines", machineRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/graph", graphRoutes); // recommandations / réseau (Neo4j)
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// --- Gestion d'erreur générique ---
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Erreur interne du serveur." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`FabLab Manager API démarrée sur http://localhost:${PORT}`);
});
