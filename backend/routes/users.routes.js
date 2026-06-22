/* ===========================================================
   Routes /api/users
   - Profil utilisateur -> SQL (email, mot de passe haché)
   =========================================================== */

const express = require("express");
const router = express.Router();
// const { sqlPool } = require("../config/sql.config");
// const bcrypt = require("bcrypt");

// GET /api/users/me -> profil de l'utilisateur connecté
router.get("/me", async (req, res) => {
  // TODO (équipe BDD) : SELECT id, email, role FROM users WHERE id = req.user.id
  // (req.user est injecté par le middleware JWT une fois branché)
  res.json({
    id: "u1",
    email: "utilisateur@example.com",
    role: "client",
  });
});

// PATCH /api/users/me -> modification de l'email et/ou du mot de passe
router.patch("/me", async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  // TODO (équipe BDD) :
  // - si email fourni    : UPDATE users SET email = $1 WHERE id = req.user.id
  // - si newPassword     : vérifier currentPassword via bcrypt.compare(),
  //   puis UPDATE users SET password_hash = bcrypt.hash(newPassword, 10) WHERE id = req.user.id
  res.json({ message: "Profil mis à jour (stub)." });
});

module.exports = router;
