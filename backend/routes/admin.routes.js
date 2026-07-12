/* ===========================================================
   Routes /api/admin
   - Gestion des comptes, groupes et associations magasins -> SQL
   =========================================================== */

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { sqlPool } = require("../config/sql.config");
const { asyncHandler } = require("../utils/async-handler");

// ----------------------------------------------------------------
// Comptes
// ----------------------------------------------------------------

// GET /api/admin/users?role= -> liste de tous les comptes (filtrable)
router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const { role } = req.query;

    let query = `SELECT u.id, u.email, u.role,
                        GROUP_CONCAT(DISTINCT g.nom SEPARATOR ', ') AS group_name
                 FROM users u
                 LEFT JOIN user_groupes ug ON ug.user_id = u.id
                 LEFT JOIN groupes g       ON g.id = ug.groupe_id`;
    const params = [];
    if (role) {
      query += " WHERE u.role = ?";
      params.push(role);
    }
    query += " GROUP BY u.id ORDER BY u.created_at DESC";

    const [rows] = await sqlPool.query(query, params);
    res.json(
      rows.map((r) => ({
        id: String(r.id),
        email: r.email,
        role: r.role,
        group: r.group_name || null,
      }))
    );
  })
);

// POST /api/admin/users -> créer un compte + mot de passe temporaire
router.post(
  "/users",
  asyncHandler(async (req, res) => {
    const { email, role, groupId, nom, prenom } = req.body;
    if (!email || !role) {
      return res.status(400).json({ message: "Email et rôle requis." });
    }

    const temporaryPassword = "Tmp-" + Math.random().toString(36).slice(2, 10).toUpperCase();
    const hash = await bcrypt.hash(temporaryPassword, 10);

    const [result] = await sqlPool.query(
      "INSERT INTO users (role, email, password_hash, nom, prenom) VALUES (?, ?, ?, ?, ?)",
      [role, email, hash, nom || "", prenom || ""]
    );

    if (groupId) {
      await sqlPool.query("INSERT IGNORE INTO user_groupes (user_id, groupe_id) VALUES (?, ?)", [
        result.insertId,
        groupId,
      ]);
    }

    // pas de service e-mail configuré : le mot de passe temporaire est affiché
    // à l'admin (voir la modale de création de compte côté frontend) à charge
    // pour lui de le transmettre au nouvel utilisateur.
    res.status(201).json({
      id: String(result.insertId),
      email,
      role,
      temporaryPassword,
      message: "Compte créé. L'e-mail de bienvenue sera envoyé une fois le service mail configuré.",
    });
  })
);

// DELETE /api/admin/users/:id -> supprimer un compte
router.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await sqlPool.query("DELETE FROM reservations WHERE client_id = ?", [id]);
    await sqlPool.query("DELETE FROM client_magasin WHERE client_id = ?", [id]);
    await sqlPool.query("DELETE FROM user_groupes WHERE user_id = ?", [id]);

    const [result] = await sqlPool.query("DELETE FROM users WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Compte introuvable." });
    }
    res.json({ message: `Compte ${id} supprimé.` });
  })
);

// ----------------------------------------------------------------
// Groupes
// ----------------------------------------------------------------

// GET /api/admin/groups -> liste de tous les groupes
router.get(
  "/groups",
  asyncHandler(async (req, res) => {
    const [rows] = await sqlPool.query(
      `SELECT g.id, g.nom,
              COUNT(DISTINCT ug.user_id) AS member_count,
              GROUP_CONCAT(DISTINCT m.nom SEPARATOR ', ') AS shop_name
       FROM groupes g
       LEFT JOIN user_groupes ug   ON ug.groupe_id = g.id
       LEFT JOIN groupe_magasins gm ON gm.groupe_id = g.id
       LEFT JOIN magasins m         ON m.id = gm.magasin_id
       GROUP BY g.id
       ORDER BY g.nom`
    );
    res.json(
      rows.map((r) => ({
        id: String(r.id),
        name: r.nom,
        memberCount: r.member_count,
        shopName: r.shop_name || null,
      }))
    );
  })
);

// POST /api/admin/groups -> créer un groupe
router.post(
  "/groups",
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Nom du groupe requis." });

    const [result] = await sqlPool.query("INSERT INTO groupes (nom) VALUES (?)", [name]);
    res.status(201).json({ id: String(result.insertId), name, memberCount: 0, shopName: null });
  })
);

// POST /api/admin/groups/:id/members -> ajouter un compte à un groupe
router.post(
  "/groups/:id/members",
  asyncHandler(async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId requis." });

    await sqlPool.query("INSERT IGNORE INTO user_groupes (user_id, groupe_id) VALUES (?, ?)", [
      userId,
      req.params.id,
    ]);
    res.json({ message: `Utilisateur ${userId} ajouté au groupe ${req.params.id}.` });
  })
);

// ----------------------------------------------------------------
// Magasins (vue admin)
// ----------------------------------------------------------------

// GET /api/admin/shops -> tous les magasins avec leurs associations
router.get(
  "/shops",
  asyncHandler(async (req, res) => {
    const [rows] = await sqlPool.query(
      `SELECT m.id, m.nom,
              GROUP_CONCAT(DISTINCT u.email SEPARATOR ', ') AS linked_users,
              GROUP_CONCAT(DISTINCT g.nom SEPARATOR ', ')   AS linked_groups
       FROM magasins m
       LEFT JOIN client_magasin cm  ON cm.magasin_id = m.id
       LEFT JOIN users u            ON u.id = cm.client_id
       LEFT JOIN groupe_magasins gm ON gm.magasin_id = m.id
       LEFT JOIN groupes g          ON g.id = gm.groupe_id
       GROUP BY m.id`
    );
    res.json(
      rows.map((r) => ({
        id: String(r.id),
        name: r.nom,
        linkedTo: [r.linked_groups, r.linked_users]
          .filter(Boolean)
          .join(", ")
          .split(", ")
          .filter(Boolean),
      }))
    );
  })
);

// POST /api/admin/shops/:id/link -> lier un magasin à un compte OU à un groupe
router.post(
  "/shops/:id/link",
  asyncHandler(async (req, res) => {
    const { userId, groupId } = req.body;
    if (!userId && !groupId) {
      return res.status(400).json({ message: "userId ou groupId requis." });
    }

    if (userId) {
      await sqlPool.query("INSERT IGNORE INTO client_magasin (client_id, magasin_id) VALUES (?, ?)", [
        userId,
        req.params.id,
      ]);
    }
    if (groupId) {
      await sqlPool.query(
        "INSERT IGNORE INTO groupe_magasins (groupe_id, magasin_id) VALUES (?, ?)",
        [groupId, req.params.id]
      );
    }

    res.json({ message: `Magasin ${req.params.id} lié.` });
  })
);

module.exports = router;
