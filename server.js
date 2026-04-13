const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Rate Limiting ───
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 5;

function rateLimit(req, res, next) {
  const ip = req.headers["x-forwarded-for"] || req.ip;
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + RATE_LIMIT_WINDOW;
  }

  entry.count++;
  rateLimitMap.set(ip, entry);

  if (entry.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: "Too many requests. Please wait a minute." });
  }
  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 300_000);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ─── Gemini Streaming API endpoint ───
app.post("/api/generate", rateLimit, async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured in Render environment." });
  }

  const { system, messages } = req.body;
  const userMessage = messages?.[0]?.content || "";

  const geminiBody = {
    system_instruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
    generationConfig: {
      maxOutputTokens: 1500,
      temperature: 0.9,
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });

    if (!response.ok) {
      let errMsg = `Gemini API error (${response.status})`;
      let rawError = "";
      try {
        const errData = await response.json();
        rawError = JSON.stringify(errData);
        errMsg = errData?.error?.message || errMsg;
      } catch(e) {}

      console.error(`Gemini error ${response.status}:`, rawError || errMsg);

      return res.status(response.status).json({ error: errMsg });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6);
          try {
            const parsed = JSON.parse(jsonStr);
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              // Send in a unified format the frontend understands
              res.write(`data: ${JSON.stringify({ type: "content_block_delta", delta: { text } })}\n\n`);
            }
          } catch(e) {}
        }
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("API error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to reach Gemini API. Please try again." });
    } else {
      res.end();
    }
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Beast Scripts running on port ${PORT}`);
});
