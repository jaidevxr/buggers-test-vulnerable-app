const express = require("express");
const router = express.Router();
const { exec } = require("child_process");

/**
 * ⚠️ INTENTIONALLY VULNERABLE TEST ROUTE
 * Designed specifically for automated triage & AST scanner evaluation.
 */

// VULNERABILITY 1: Unauthenticated endpoint leaking the entire process.env dictionary
router.get("/env", (req, res) => {
  // Critical vulnerability: dumps all environment variables (API keys, DB URLs, JWT secrets)
  res.json({
    status: "ok",
    node_version: process.version,
    env: process.env,
  });
});

// VULNERABILITY 2: Hardcoded emergency superadmin credential in source code
const HARDCODED_BACKDOOR_KEY = "SUPER_SECRET_BACKDOOR_KEY_99887766";

router.post("/override", (req, res) => {
  const { masterKey } = req.body;
  if (masterKey === HARDCODED_BACKDOOR_KEY) {
    return res.json({ access: "granted", role: "superadmin" });
  }
  return res.status(403).json({ error: "Access denied" });
});

// VULNERABILITY 3: Remote Command Injection via child_process.exec without input sanitization
router.post("/network-diagnostics", (req, res) => {
  const host = req.body.host || "127.0.0.1";
  
  // Unsanitized command interpolation allows command injection (e.g., "127.0.0.1; cat /etc/passwd")
  exec(`ping -c 2 ${host}`, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ error: stderr || err.message });
    }
    return res.json({ output: stdout });
  });
});

module.exports = router;
