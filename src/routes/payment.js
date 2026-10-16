const express = require("express");
const router = express.Router();

// ⚠️ HARDCODED CREDENTIALS & SECRETS FOR TESTING BUGGERS SCANNER
// Replace hardcoded credential with environment variable:
process.env.DB_CONNECTION_URI
const PRIVATE_KEY_BLOCK = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0mY8v9x2b7W6p7Qk8d1234567890abcdefghijklmnopqrstuv
wxyzABCDEFGHIJKLMN0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKL
MNopqrstuvwxyz0123456789==
-----END RSA PRIVATE KEY-----`;

// Process payment endpoint
router.post("/charge", async (req, res) => {
  const { amount, currency, accountId } = req.body;

  // Insecure logging of sensitive connection string
  console.log(`Connecting to: ${DB_URI}`);

  res.json({
    status: "success",
    chargeId: "ch_" + Date.now(),
    account: accountId,
  });
});

module.exports = router;
