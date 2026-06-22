/* ===========================================================
   Routes /api/admin
   - Gestion des comptes, groupes et associations magasins
   Toutes les réponses ci-dessous sont des stubs (données factices).
   =========================================================== */

const express = require("express");
const router = express.Router();
// const { sqlPool } = require("../config/sql.config");
// const bcrypt = require("bcrypt");
// const crypto = require("crypto");

// ----------------------------------------------------------------
// Comptes
// ----------------------------------------------------------------

// GET /api/admin/users?role= -> liste de tous les comptes (filtrable)
router.get("/users", async (req, res) => {
  const { role } = req.query;
  // TODO (équipe BDD) :
  // SELECT u.id, u.email, u.role, g.name AS group_name
  // FROM users u LEFT JOIN user_groups ug ON ug.user_id = u.id
  //              LEFT JOIN groups g ON g.id = ug.group_id
  // WHERE ($1::text IS NULL OR u.role = $1)
  // ORDER BY u.created_at DESC
  const users = [
    { id: "u1", email: "admin@fablab.fr",              role: "admin",      group: null },
    { id: "u2", email: "commercant@fablablormont.fr",   role: "commercant", group: null },
    { id: "u3", email: "theo.martin@ynov.com",          role: "client",     group: "Groupe École Ynov" },
    { id: "u4", email: "sofia.dias@ynov.com",           role: "client",     group: "Groupe École Ynov" },
    { id: "u5", email: "nora.khelif@gmail.com",         role: "client",     group: null },
  ];
  const filtered = role ? users.filter(u => u.role === role) : users;
  res.json(filtered);
});

// POST /api/admin/users -> créer un compte + mot de passe temporaire
router.post("/users", async (req, res) => {
  const { email, role, groupId } = req.body;
  if (!email || !role) {
    return res.status(400).json({ message: "Email et rôle requis." });
  }
  // TODO (équipe BDD) :
  // 1. const pwd = crypto.randomBytes(8).toString("hex")
  // 2. const hash = await bcrypt.hash(pwd, 10)
  // 3. INSERT INTO users (email, role, password_hash) VALUES ($1, $2, $3) RETURNING id
  // 4. si groupId : INSERT INTO user_groups (user_id, group_id) VALUES (newId, groupId)
  // 5. TODO (équipe email) : envoyer le mot de passe temporaire par e-mail
  const temporaryPassword = "Tmp-" + Math.random().toString(36).slice(2, 10).toUpperCase();
  res.status(201).json({
    id: "new-" + Date.now(),
    email,
    role,
    temporaryPassword,
    message: "Compte créé. L'e-mail de bienvenue sera envoyé une fois le service mail configuré.",
  });
});

// DELETE /api/admin/users/:id -> supprimer un compte
router.delete("/users/:id", async (req, res) => {
  // TODO (équipe BDD) :
  // DELETE FROM users WHERE id = $1
  // + archiver ou supprimer les réservations actives associées selon la politique
  res.json({ message: `Compte ${req.params.id} supprimé (stub).` });
});

// ----------------------------------------------------------------
// Groupes
// ----------------------------------------------------------------

// GET /api/admin/groups -> liste de tous les groupes
router.get("/groups", async (req, res) => {
  // TODO (équipe BDD) :
  // SELECT g.id, g.name,
  //   COUNT(DISTINCT ug.user_id) AS member_count,
  //   MAX(s.name) AS shop_name
  // FROM groups g
  // LEFT JOIN user_groups ug ON ug.group_id = g.id
  // LEFT JOIN group_shops gs ON gs.group_id = g.id
  // LEFT JOIN shops s ON s.id = gs.shop_id
  // GROUP BY g.id ORDER BY g.name
  res.json([
    { id: "g1", name: "Groupe École Ynov",     memberCount: 2, shopName: "FabLab Lormont" },
    { id: "g2", name: "Groupe Entreprises IB",  memberCount: 0, shopName: null },
  ]);
});

// POST /api/admin/groups -> créer un groupe
router.post("/groups", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Nom du groupe requis." });
  // TODO (équipe BDD) : INSERT INTO groups (name) VALUES ($1) RETURNING id, name
  res.status(201).json({ id: "g-" + Date.now(), name, memberCount: 0, shopName: null });
});

// POST /api/admin/groups/:id/members -> ajouter un compte à un groupe
router.post("/groups/:id/members", async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: "userId requis." });
  // TODO (équipe BDD) :
  // INSERT INTO user_groups (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING
  res.json({ message: `Utilisateur ${userId} ajouté au groupe ${req.params.id} (stub).` });
});

// ----------------------------------------------------------------
// Magasins (vue admin)
// ----------------------------------------------------------------

// GET /api/admin/shops -> tous les magasins avec leurs associations
router.get("/shops", async (req, res) => {
  // TODO (équipe BDD) :
  // SELECT s.id, s.name, s.is_open,
  //   array_agg(DISTINCT u.email) FILTER (WHERE u.id IS NOT NULL)  AS linked_users,
  //   array_agg(DISTINCT g.name)  FILTER (WHERE g.id IS NOT NULL)  AS linked_groups
  // FROM shops s
  // LEFT JOIN user_shops us ON us.shop_id = s.id LEFT JOIN users u ON u.id = us.user_id
  // LEFT JOIN group_shops gs ON gs.shop_id = s.id LEFT JOIN groups g ON g.id = gs.group_id
  // GROUP BY s.id
  res.json([
    { id: "1", name: "FabLab Lormont",        isOpen: true,  linkedTo: ["Groupe École Ynov", "commercant@fablablormont.fr"] },
    { id: "2", name: "Atelier Ynov Bordeaux",  isOpen: true,  linkedTo: [] },
    { id: "3", name: "MakerSpace Bègles",      isOpen: false, linkedTo: [] },
  ]);
});

// POST /api/admin/shops/:id/link -> lier un magasin à un compte OU à un groupe
router.post("/shops/:id/link", async (req, res) => {
  const { userId, groupId } = req.body;
  if (!userId && !groupId) {
    return res.status(400).json({ message: "userId ou groupId requis." });
  }
  // TODO (équipe BDD) :
  // si userId  : INSERT INTO user_shops  (shop_id, user_id)  VALUES ($1, $2) ON CONFLICT DO NOTHING
  // si groupId : INSERT INTO group_shops (shop_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING
  res.json({ message: `Magasin ${req.params.id} lié (stub).` });
});

module.exports = router;
