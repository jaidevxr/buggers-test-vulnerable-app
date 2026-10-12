const express = require("express");
const config = require("./config");
const authRoutes = require("./routes/auth");
const commentRoutes = require("./routes/comments");
const proxyRoutes = require("./routes/proxy");
const fileRoutes = require("./routes/files");
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/users");
const transferRoutes = require("./routes/transfer");
const importRoutes = require("./routes/import");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// VULNERABILITY: CORS wildcard — allows any origin
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "*");
  next();
});

// VULNERABILITY: Verbose error handler exposes stack traces
app.use((err, req, res, next) => {
  if (config.debug) {
    res.status(500).json({
      error: err.message,
      stack: err.stack,
      query: req.query,
      body: req.body,
      headers: req.headers,
    });
  } else {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/proxy", proxyRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transfer", transferRoutes);
app.use("/api/import", importRoutes);

// VULNERABILITY: Binding to all interfaces with no rate limiting
app.listen(3000, "0.0.0.0", () => {
  console.log(`Server running on port 3000 (debug: ${config.debug})`);
  // VULNERABILITY: Logging credentials at startup
  console.log(`DB connected to ${config.db.host} as ${config.db.user}:${config.db.password}`);
});
