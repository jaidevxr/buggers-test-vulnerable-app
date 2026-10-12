// ⚠️ INTENTIONALLY VULNERABLE — hardcoded secrets & insecure defaults
const config = {
  // VULNERABILITY: Hardcoded database credentials
  db: {
    host: "production-db.internal.company.com",
    port: 3306,
    user: "root",
    password: "SuperSecret123!",
    database: "webapp_prod",
  },

  // VULNERABILITY: Hardcoded JWT secret (weak & guessable)
  jwt: {
    secret: "mysecretkey123",
    expiresIn: "365d", // VULNERABILITY: Extremely long token lifetime
  },

  // VULNERABILITY: Hardcoded API keys (DO NOT USE — test only)
  paymentGateway: {
    secretKey: "NOT_A_REAL_KEY_hardcoded_payment_secret_12345",
    publishableKey: "NOT_A_REAL_KEY_pub_abc123",
  },

  cloudProvider: {
    accessKeyId: "NOT_A_REAL_KEY_cloud_access_id",
    secretAccessKey: "NOT_A_REAL_KEY_cloud_secret_key_do_not_use",
    region: "us-east-1",
  },

  // VULNERABILITY: Debug mode enabled in production
  debug: true,
  verbose_errors: true,
};

module.exports = config;
