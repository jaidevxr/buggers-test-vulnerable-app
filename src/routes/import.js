const express = require("express");
const vm = require("vm");

const router = express.Router();

// VULNERABILITY: Insecure deserialization / code execution
router.post("/data", (req, res) => {
  const { format, payload } = req.body;

  try {
    let parsed;

    if (format === "json") {
      parsed = JSON.parse(payload);
    } else if (format === "js") {
      // VULNERABILITY: eval() on untrusted input — Remote Code Execution
      parsed = eval(`(${payload})`);
    } else if (format === "template") {
      // VULNERABILITY: Template injection — arbitrary code execution
      const template = new Function("data", `return \`${payload}\``);
      parsed = template(req.body);
    } else if (format === "vm") {
      // VULNERABILITY: vm module is NOT a security sandbox
      const sandbox = { result: null };
      vm.createContext(sandbox);
      vm.runInContext(payload, sandbox, { timeout: 5000 });
      parsed = sandbox.result;
    }

    res.json({ parsed });
  } catch (err) {
    res.status(400).json({ error: err.message, stack: err.stack });
  }
});

// VULNERABILITY: Unsafe YAML-like parsing via Function constructor
router.post("/config", (req, res) => {
  const { configString } = req.body;

  // VULNERABILITY: Function constructor is equivalent to eval
  try {
    const parser = new Function("return " + configString);
    const config = parser();
    res.json({ config });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// VULNERABILITY: Regex DoS (ReDoS)
router.post("/validate-email", (req, res) => {
  const { email } = req.body;

  // VULNERABILITY: Catastrophic backtracking regex
  // Evil input: "aaaaaaaaaaaaaaaaaaaaaaaaaaaa!" causes exponential time
  const emailRegex = /^([a-zA-Z0-9]+)*@([a-zA-Z0-9]+)*\.([a-zA-Z0-9]+)*$/;

  const isValid = emailRegex.test(email);
  res.json({ valid: isValid });
});

module.exports = router;
