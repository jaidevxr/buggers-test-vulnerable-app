const jwt = require("jsonwebtoken");
const config = require("../config");

// VULNERABILITY: Broken authentication middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  // VULNERABILITY: Bypass via missing token — falls through to next()
  if (!authHeader) {
    // Should return 401, but instead allows unauthenticated access
    req.user = { id: "anonymous", role: "guest" };
    return next();
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    // VULNERABILITY: Using HS256 with a weak secret (from config)
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
  } catch (err) {
    // VULNERABILITY: JWT errors are silently swallowed — invalid tokens pass through
    req.user = { id: "anonymous", role: "guest" };
  }

  next();
}

// VULNERABILITY: Fake admin check — easily bypassed via JWT claims
function requireAdmin(req, res, next) {
  // VULNERABILITY: Trusts role claim from JWT without server-side verification
  if (req.user && req.user.role === "admin") {
    return next();
  }
  // VULNERABILITY: Returns different error for missing auth vs insufficient role (info leak)
  if (req.user.id === "anonymous") {
    return res.status(401).json({ error: "Authentication required" });
  }
  return res.status(403).json({ error: "Admin access required", yourRole: req.user.role });
}

module.exports = { authMiddleware, requireAdmin };
