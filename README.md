# Buggers Test Vulnerable App

⚠️ **WARNING: This repository contains INTENTIONALLY VULNERABLE code for testing purposes ONLY.**

This repo is designed to test [Buggers](https://github.com/your-org/buggers) — an AI-powered security code review tool. It contains a variety of real-world vulnerability patterns across multiple categories:

## Vulnerability Categories

| Category | File | Vulnerabilities |
|----------|------|-----------------|
| **SQL Injection** | `src/auth.js` | Raw string concatenation in queries |
| **XSS** | `src/routes/comments.js` | Unsanitized HTML rendering |
| **Auth Bypass** | `src/middleware/auth.js` | Weak JWT, hardcoded secrets |
| **SSRF** | `src/routes/proxy.js` | Unvalidated URL fetching |
| **Path Traversal** | `src/routes/files.js` | Unsanitized file path access |
| **Command Injection** | `src/routes/admin.js` | `exec()` with user input |
| **Sensitive Data Exposure** | `src/config.js` | Hardcoded API keys & passwords |
| **Race Conditions** | `src/routes/transfer.js` | TOCTOU in balance checks |
| **Broken Access Control** | `src/routes/users.js` | Missing ownership checks |
| **Insecure Deserialization** | `src/routes/import.js` | `eval()` on untrusted data |

## How to Test with Buggers

1. Push this repo to GitHub
2. Create a PR from `feature/add-user-features` → `main`
3. Connect the repo in Buggers and run analysis
4. Verify that Buggers detects the vulnerabilities

**DO NOT deploy this application to any production environment.**
