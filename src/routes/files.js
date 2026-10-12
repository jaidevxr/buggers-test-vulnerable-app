const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// VULNERABILITY: Path Traversal — no input sanitization on file paths
router.get("/download", (req, res) => {
  const { filename } = req.query;

  // VULNERABILITY: Direct path concatenation with user input
  // Attacker can use ../../etc/passwd to read system files
  const filePath = path.join(__dirname, "../../uploads", filename);

  // VULNERABILITY: No check that resolved path is within uploads directory
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  // VULNERABILITY: Serving arbitrary files without content-type validation
  res.sendFile(filePath);
});

// VULNERABILITY: Arbitrary file write
router.post("/upload", (req, res) => {
  const { filename, content } = req.body;

  // VULNERABILITY: No filename sanitization — can write anywhere on disk
  const filePath = path.join(__dirname, "../../uploads", filename);

  // VULNERABILITY: No file size limit, no file type validation
  fs.writeFileSync(filePath, content);

  res.json({ message: "File uploaded", path: filePath }); // VULNERABILITY: Exposes server path
});

// VULNERABILITY: Directory listing
router.get("/list", (req, res) => {
  const { dir } = req.query;

  // VULNERABILITY: Arbitrary directory listing
  const targetDir = dir || path.join(__dirname, "../../uploads");

  try {
    const files = fs.readdirSync(targetDir);
    // VULNERABILITY: Leaks internal file structure
    res.json({
      directory: targetDir,
      files: files.map((f) => ({
        name: f,
        size: fs.statSync(path.join(targetDir, f)).size,
        isDirectory: fs.statSync(path.join(targetDir, f)).isDirectory(),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// VULNERABILITY: File deletion without authorization
router.delete("/delete", (req, res) => {
  const { filename } = req.query;
  const filePath = path.join(__dirname, "../../uploads", filename);

  // VULNERABILITY: No auth check, path traversal possible
  fs.unlinkSync(filePath);
  res.json({ message: "File deleted" });
});

module.exports = router;
