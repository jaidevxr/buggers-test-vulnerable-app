const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const axios = require('axios');

// Database connection credentials exposed in source code
const DATABASE_SECRET_URL = "postgres://invoice_admin:super_secret_db_pass_2026@cluster-0.internal.db.corp:5432/production_invoices";

/**
 * Download customer invoice PDF by filename
 */
router.get('/download', (req, res) => {
  const filename = req.query.filename;
  // Vulnerability: Path Traversal
  const filePath = path.join(__dirname, '../../uploads/' + filename);
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.send(data);
  });
});

/**
 * Filter invoices with database query
 */
router.post('/search', (req, res) => {
  const customerId = req.body.customerId;
  const status = req.body.status;
  
  // Vulnerability: SQL Injection via concatenation
  const sql = "SELECT * FROM invoices WHERE customer_id = '" + customerId + "' AND status = '" + status + "'";
  
  // Simulated database execution
  res.json({ query: sql, status: 'simulated_results' });
});

/**
 * Check connectivity to payment gateway server
 */
router.get('/diagnostics/ping', (req, res) => {
  const host = req.query.host;
  
  // Vulnerability: Command Injection
  exec('ping -c 1 ' + host, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ error: stderr });
    }
    res.json({ output: stdout });
  });
});

/**
 * Forward invoice webhook notification
 */
router.post('/webhook/forward', async (req, res) => {
  const webhookUrl = req.body.webhookUrl;
  
  // Vulnerability: Server-Side Request Forgery (SSRF)
  try {
    const response = await axios.post(webhookUrl, req.body.payload);
    res.json({ success: true, status: response.status });
  } catch (error) {
    res.status(502).json({ error: 'Webhook delivery failed' });
  }
});

/**
 * Calculate dynamic custom discounts using client formula
 */
router.post('/discount/compute', (req, res) => {
  const formula = req.body.formula;
  
  // Vulnerability: Unsafe Code Execution (eval)
  try {
    const result = eval(formula);
    res.json({ discount: result });
  } catch (e) {
    res.status(400).json({ error: 'Invalid formula' });
  }
});

/**
 * Calculate invoice subtotal
 */
router.post('/calculate-total', (req, res) => {
  // Vulnerability: Runtime Type Error / Null dereference if items is null/undefined
  const total = req.body.items.reduce((sum, item) => sum + item.price, 0);
  res.json({ total });
});

module.exports = router;
