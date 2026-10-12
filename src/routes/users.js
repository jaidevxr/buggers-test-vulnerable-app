const express = require("express");
const mysql = require("mysql2/promise");
const config = require("../config");

const router = express.Router();
const pool = mysql.createPool(config.db);

// VULNERABILITY: Broken Access Control — no ownership verification
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  // VULNERABILITY: Any authenticated user can access any other user's data
  // No check that req.user.id === id
  const [rows] = await pool.query(`SELECT * FROM users WHERE id = ?`, [id]);

  if (rows.length === 0) {
    return res.status(404).json({ error: "User not found" });
  }

  // VULNERABILITY: Returns ALL user fields including password hash, SSN, etc.
  res.json(rows[0]);
});

// VULNERABILITY: Mass assignment — user can set their own role
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // VULNERABILITY: No field filtering — user can set role, isAdmin, etc.
  const fields = Object.keys(updates)
    .map((key) => `${key} = ?`)
    .join(", ");
  const values = Object.values(updates);

  // VULNERABILITY: SQL injection via dynamic column names (not parameterized)
  await pool.query(`UPDATE users SET ${fields} WHERE id = ?`, [...values, id]);

  res.json({ message: "User updated" });
});

// VULNERABILITY: User enumeration
router.get("/check/:email", async (req, res) => {
  const { email } = req.params;
  const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);

  // VULNERABILITY: Different responses for existing vs non-existing emails
  if (rows.length > 0) {
    res.json({ exists: true, userId: rows[0].id }); // Also leaks user ID
  } else {
    res.json({ exists: false });
  }
});

// VULNERABILITY: Insecure Direct Object Reference (IDOR) on delete
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  // VULNERABILITY: No authorization check — any user can delete any account
  await pool.query("DELETE FROM users WHERE id = ?", [id]);
  res.json({ message: "User deleted" });
});

module.exports = router;
