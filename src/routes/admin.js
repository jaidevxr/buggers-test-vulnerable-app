const express = require("express");
const { exec, execSync } = require("child_process");

const router = express.Router();

// VULNERABILITY: Command Injection — user input passed directly to shell
router.post("/run-diagnostic", (req, res) => {
  const { hostname } = req.body;

  // VULNERABILITY: Direct shell command injection
  // Attacker sends: hostname = "google.com; rm -rf /"
  exec(`ping -c 4 ${hostname}`, (error, stdout, stderr) => {
    res.json({
      output: stdout,
      error: stderr,
      exitCode: error?.code,
    });
  });
});

// VULNERABILITY: Another command injection vector
router.get("/dns-lookup", (req, res) => {
  const { domain } = req.query;

  // VULNERABILITY: Template literal injection into exec
  const result = execSync(`nslookup ${domain}`).toString();
  res.json({ result });
});

// VULNERABILITY: Code execution via eval
router.post("/calculate", (req, res) => {
  const { expression } = req.body;

  try {
    // VULNERABILITY: eval() on user-supplied input — arbitrary code execution
    const result = eval(expression);
    res.json({ result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// VULNERABILITY: Prototype pollution
router.post("/config/update", (req, res) => {
  const updates = req.body;

  // VULNERABILITY: Recursive merge without prototype pollution protection
  function deepMerge(target, source) {
    for (const key in source) {
      if (typeof source[key] === "object" && source[key] !== null) {
        target[key] = target[key] || {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  const appConfig = {};
  deepMerge(appConfig, updates);
  // Attacker sends: {"__proto__": {"isAdmin": true}}
  res.json({ config: appConfig });
});

module.exports = router;
