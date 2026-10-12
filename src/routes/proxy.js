const express = require("express");
const http = require("http");
const https = require("https");
const { URL } = require("url");

const router = express.Router();

// VULNERABILITY: Server-Side Request Forgery (SSRF)
// No validation of target URL — allows access to internal services
router.get("/fetch", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL parameter required" });
  }

  try {
    // VULNERABILITY: No URL validation — attacker can access:
    // - Internal metadata endpoints (e.g., http://169.254.169.254/latest/meta-data/)
    // - Internal services (e.g., http://localhost:6379/ for Redis)
    // - Cloud provider credentials endpoints
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === "https:" ? https : http;

    const proxyReq = client.get(url, (proxyRes) => {
      let data = "";
      proxyRes.on("data", (chunk) => (data += chunk));
      proxyRes.on("end", () => {
        // VULNERABILITY: Returning raw response from arbitrary URLs
        res.json({
          status: proxyRes.statusCode,
          headers: proxyRes.headers,
          body: data,
        });
      });
    });

    proxyReq.on("error", (err) => {
      res.status(500).json({ error: err.message });
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// VULNERABILITY: Open redirect
router.get("/redirect", (req, res) => {
  const { target } = req.query;
  // VULNERABILITY: No validation of redirect target — phishing vector
  res.redirect(target);
});

// VULNERABILITY: Webhook with no signature verification
router.post("/webhook", async (req, res) => {
  const { callbackUrl, event, data } = req.body;

  // VULNERABILITY: Making requests to user-supplied URLs without validation
  try {
    await fetch(callbackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, data, timestamp: Date.now() }),
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
