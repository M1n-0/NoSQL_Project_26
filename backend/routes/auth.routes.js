/* ===========================================================
   Routes /api/auth
   Vérifie l'utilisateur en base SQL (table users), compare le
   mot de passe haché, puis génère un JWT contenant { id, role }.
   =========================================================== */

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sqlPool } = require("../config/sql.config");
const { asyncHandler } = require("../utils/async-handler");

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis." });
    }

    const [rows] = await sqlPool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });
    res.json({ token, role: user.role });
  })
);

module.exports = router;
