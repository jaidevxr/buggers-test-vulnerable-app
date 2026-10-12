const express = require("express");
const router = express.Router();

const comments = [];

// VULNERABILITY: Stored XSS — no sanitization of user input rendered as HTML
router.post("/", (req, res) => {
  const { author, content, parentId } = req.body;

  // VULNERABILITY: No input sanitization or validation
  const comment = {
    id: comments.length + 1,
    author,
    content, // Raw HTML/script tags allowed
    parentId: parentId || null,
    createdAt: new Date().toISOString(),
  };

  comments.push(comment);
  res.json(comment);
});

// VULNERABILITY: Reflected XSS — user input rendered directly in HTML
router.get("/render", (req, res) => {
  const { search } = req.query;

  // VULNERABILITY: Direct injection of user input into HTML
  const html = `
    <html>
      <head><title>Comments - Search: ${search}</title></head>
      <body>
        <h1>Search results for: ${search}</h1>
        <div>
          ${comments
            .filter((c) => c.content.includes(search || ""))
            .map(
              (c) => `
              <div class="comment">
                <strong>${c.author}</strong>
                <p>${c.content}</p>
                <small>${c.createdAt}</small>
              </div>
            `
            )
            .join("")}
        </div>
      </body>
    </html>
  `;

  // VULNERABILITY: No Content-Security-Policy header
  res.type("html").send(html);
});

// VULNERABILITY: DOM-based XSS via JSON response used unsafely
router.get("/api", (req, res) => {
  const { callback } = req.query;

  // VULNERABILITY: JSONP callback injection
  if (callback) {
    res.type("application/javascript").send(`${callback}(${JSON.stringify(comments)})`);
  } else {
    res.json(comments);
  }
});

module.exports = router;
