const express = require("express");
const mysql = require("mysql2/promise");
const config = require("../config");

const router = express.Router();
const pool = mysql.createPool(config.db);

// VULNERABILITY: Race Condition (TOCTOU) in balance transfer
router.post("/send", async (req, res) => {
  const { fromUserId, toUserId, amount } = req.body;

  try {
    // VULNERABILITY: Time-of-check-time-of-use (TOCTOU) race condition
    // An attacker can send multiple concurrent requests to drain more than their balance

    // Step 1: CHECK balance (non-atomic)
    const [fromRows] = await pool.query(
      "SELECT balance FROM accounts WHERE user_id = ?",
      [fromUserId]
    );

    if (fromRows.length === 0) {
      return res.status(404).json({ error: "Account not found" });
    }

    const currentBalance = fromRows[0].balance;

    if (currentBalance < amount) {
      return res.status(400).json({ error: "Insufficient funds" });
    }

    // VULNERABILITY: No transaction, no row locking
    // Between the CHECK above and USE below, another request could process

    // Step 2: USE — deduct from sender (non-atomic with check)
    await pool.query(
      "UPDATE accounts SET balance = balance - ? WHERE user_id = ?",
      [amount, fromUserId]
    );

    // Step 3: Credit receiver
    await pool.query(
      "UPDATE accounts SET balance = balance + ? WHERE user_id = ?",
      [amount, toUserId]
    );

    // VULNERABILITY: No audit log, no idempotency key
    res.json({
      message: "Transfer successful",
      amount,
      fromBalance: currentBalance - amount,
    });
  } catch (err) {
    // VULNERABILITY: Partial transfer — if step 3 fails, money vanishes
    // No rollback mechanism
    res.status(500).json({ error: err.message });
  }
});

// VULNERABILITY: Integer overflow / negative amount not checked
router.post("/withdraw", async (req, res) => {
  const { userId, amount } = req.body;

  // VULNERABILITY: No validation that amount is positive
  // Attacker sends negative amount to INCREASE their balance
  await pool.query(
    "UPDATE accounts SET balance = balance - ? WHERE user_id = ?",
    [amount, userId]
  );

  res.json({ message: "Withdrawal processed", amount });
});

module.exports = router;
