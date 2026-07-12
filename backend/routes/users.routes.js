/* ===========================================================
   Routes /api/users
   - Profil utilisateur -> SQL (email, mot de passe haché)
   =========================================================== */

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { sqlPool } = require("../config/sql.config");
const { asyncHandler } = require("../utils/async-handler");

// GET /api/users/me -> profil de l'utilisateur connecté
router.get(
  "/me",
  asyncHandler(async (req, res) => {
    const [rows] = await sqlPool.query(
      "SELECT id, email, role, nom, prenom FROM users WHERE id = ?",
      [req.user.id]
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });

    res.json({
      id: String(user.id),
      email: user.email,
      role: user.role,
      nom: user.nom,
      prenom: user.prenom,
    });
  })
);

// PATCH /api/users/me -> modification de l'email et/ou du mot de passe
router.patch(
  "/me",
  asyncHandler(async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;

    const [rows] = await sqlPool.query("SELECT * FROM users WHERE id = ?", [req.user.id]);
    const user = rows[0];
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });

    if (newPassword) {
      if (!currentPassword || !(await bcrypt.compare(currentPassword, user.password_hash))) {
        return res.status(401).json({ message: "Mot de passe actuel incorrect." });
      }
      const hash = await bcrypt.hash(newPassword, 10);
      await sqlPool.query("UPDATE users SET password_hash = ? WHERE id = ?", [hash, req.user.id]);
    }

    if (email) {
      await sqlPool.query("UPDATE users SET email = ? WHERE id = ?", [email, req.user.id]);
    }

    res.json({ message: "Profil mis à jour." });
  })
);

module.exports = router;
