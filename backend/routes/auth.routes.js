/* ===========================================================
   Routes /api/auth
   Backend réel : vérifier l'utilisateur en base SQL (table users),
   comparer le mot de passe haché, puis générer un JWT contenant
   { id, role }.
   =========================================================== */

const express = require("express");
const router = express.Router();
// const { sqlPool } = require("../config/sql.config");
// const jwt = require("jsonwebtoken");

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // TODO (équipe BDD) : remplacer ce bloc par une vraie vérification SQL :
  //   const result = await sqlPool.query("SELECT * FROM users WHERE email = $1", [email]);
  //   ... vérifier le mot de passe (bcrypt) ...
  //   const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);

  if (!email || !password) {
    return res.status(400).json({ message: "Email et mot de passe requis." });
  }

  // Bouchon temporaire pour permettre de tester le frontend sans base branchée :
  const role = email.includes("admin") ? "admin"
    : email.includes("commercant") ? "commercant"
    : "client";
  return res.json({ token: "fake-token-a-remplacer", role });
});

module.exports = router;
