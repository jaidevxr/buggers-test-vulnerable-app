const express = require("express");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const config = require("../config");

const router = express.Router();

const pool = mysql.createPool(config.db);

// VULNERABILITY: SQL Injection via string concatenation
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // VULNERABILITY: Direct string interpolation in SQL query
    const [rows] = await pool.query(
      `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = rows[0];

    // VULNERABILITY: Including sensitive data in JWT payload
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        ssn: user.ssn,           // Sensitive PII in token
        salary: user.salary,     // Sensitive data in token
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // VULNERABILITY: Token sent in response body (should be httpOnly cookie)
    res.json({ token, user: { ...user } }); // Leaks password hash in response
  } catch (err) {
    res.status(500).json({ error: err.message, sql: err.sql }); // VULNERABILITY: SQL error leak
  }
});

// VULNERABILITY: SQL Injection in search
router.get("/search", async (req, res) => {
  const { q } = req.query;
  // VULNERABILITY: Unsanitized user input in SQL LIKE clause
  const [rows] = await pool.query(
    `SELECT id, username, email FROM users WHERE username LIKE '%${q}%' OR email LIKE '%${q}%'`
  );
  res.json(rows);
});

// VULNERABILITY: No password hashing — storing plaintext passwords
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  // VULNERABILITY: No input validation at all
  const [result] = await pool.query(
    `INSERT INTO users (username, email, password) VALUES ('${username}', '${email}', '${password}')`
  );

  res.json({ id: result.insertId, username, email });
});

// VULNERABILITY: Password reset with no rate limiting, no token expiry
router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  // VULNERABILITY: No verification of identity — anyone can reset any password
  await pool.query(
    `UPDATE users SET password = '${newPassword}' WHERE email = '${email}'`
  );

  res.json({ message: "Password updated" });
});

module.exports = router;
