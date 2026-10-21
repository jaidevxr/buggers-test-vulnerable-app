const express = require("express");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const router = express.Router();

// 1. Path Traversal
router.get("/export", (req, res) => {
  const filename = req.query.filename;
  const content = fs.readFileSync("./uploads/" + filename, "utf-8");
  res.send(content);
});

// 2. Command Injection
router.post("/compress", (req, res) => {
  const dir = req.body.dir;
  exec("tar -czf /tmp/archive.tar.gz " + dir, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ output: stdout });
  });
});

// 3. Dynamic Code Execution (eval)
router.post("/calculate", (req, res) => {
  const formula = req.body.formula;
  const result = eval(formula);
  res.json({ result });
});

// 4. Safe Constant Eval (Benign Control — should NOT trigger alert)
router.get("/safe-eval", (req, res) => {
  const result = eval("console.log('safe internal static expression')");
  res.json({ ok: true });
});

module.exports = router;
