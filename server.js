const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
loadEnvFile(path.join(root, ".env"));

const preferredPort = Number(process.env.PORT || 5173);
const apiBaseUrl = process.env.AI_API_BASE_URL || "";
const apiKey = process.env.AI_API_KEY || "";
const model = process.env.AI_MODEL || "";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const index = trimmed.indexOf("=");
    if (index <= 0) return;
    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function createServer() {
  return http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === "GET" && url.pathname === "/api/health") {
      sendJson(res, 200, {
        ok: Boolean(apiBaseUrl && apiKey && model),
        hasBaseUrl: Boolean(apiBaseUrl),
        hasApiKey: Boolean(apiKey),
        model: model || null,
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/generate") {
      await handleGenerate(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/quality") {
      await handleQuality(req, res);
      return;
    }

    serveStatic(url.pathname, res);
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
  });
}

async function handleGenerate(req, res) {
  const payload = await readJson(req);
  await callModelJson(res, buildPrompt(payload), "You are a Chinese content operations assistant. Return strict JSON only. Do not copy viral examples; extract reusable platform patterns and create original drafts.");
}

async function handleQuality(req, res) {
  const payload = await readJson(req);
  await callModelJson(res, buildQualityPrompt(payload), "You are a strict Chinese content quality reviewer for multi-platform publishing. Return strict JSON only. Give practical review suggestions, not generic praise.");
}

async function callModelJson(res, prompt, systemMessage) {
  if (!apiBaseUrl || !apiKey || !model) {
    sendJson(res, 400, {
      error: "AI API is not configured. Set AI_API_BASE_URL, AI_API_KEY and AI_MODEL.",
    });
    return;
  }

  let endpoint;
  try {
    endpoint = new URL(`${apiBaseUrl.replace(/\/$/, "")}/chat/completions`);
  } catch {
    sendJson(res, 400, {
      error:
        "AI_API_BASE_URL is invalid. It should look like https://your-openai-compatible-endpoint/v1, not an API key.",
    });
    return;
  }

  const response = await fetch(endpoint.href, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    sendJson(res, response.status, { error: text.slice(0, 1000) });
    return;
  }

  const data = JSON.parse(text);
  const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!content) {
    sendJson(res, 502, { error: "Model response has no content." });
    return;
  }

  try {
    sendJson(res, 200, JSON.parse(content));
  } catch {
    sendJson(res, 502, { error: "Model did not return valid JSON.", raw: content.slice(0, 2000) });
  }
}

function buildPrompt(payload) {
  return JSON.stringify(
    {
      task: "Analyze platform viral content patterns and generate original platform drafts.",
      requirements: [
        "Output must be valid JSON.",
        "Do not plagiarize or imitate a specific work.",
        "Preserve the user's original meaning.",
        "Generate Chinese content.",
        "For each platform, return strategy and draft.",
        "For each draft, also return explanation with four sections: platform strategy, key changes, reference sample influence and risk reminder.",
        "If reference samples are provided, analyze their reusable structure only: title patterns, openings, body rhythm, tags and interaction style.",
        "Never copy sentences from reference samples into the final draft.",
        "Mention risks if sample style is clickbait, exaggerated or not suitable for the user's source.",
      ],
      source: payload.source,
      referenceSamples: payload.source && Array.isArray(payload.source.samples) ? payload.source.samples : [],
      platforms: payload.platforms,
      outputSchema: {
        platforms: [
          {
            id: "wechat",
            strategy: {
              headline: "string",
              titlePatterns: ["string"],
              opening: "string",
              structure: ["string"],
              tags: ["string"],
              risk: "string",
            },
            draft: {
              title: "string",
              summary: "string",
              body: ["string"],
              tags: ["string"],
              explanation: {
                source: "string",
                sections: [
                  { label: "平台策略", text: "string" },
                  { label: "关键改动", text: "string" },
                  { label: "样本影响", text: "string" },
                  { label: "风险提醒", text: "string" },
                ],
              },
            },
          },
        ],
      },
    },
    null,
    2
  );
}

function buildQualityPrompt(payload) {
  return JSON.stringify(
    {
      task: "Review the current platform draft with real AI judgment. Do not simulate scores.",
      requirements: [
        "Output must be valid JSON.",
        "Score should be strict and useful, from 0 to 100.",
        "Evaluate whether the draft fits the target platform and audience.",
        "Identify concrete risks, missing information and improvement opportunities.",
        "Do not invent facts. Do not suggest copying viral content.",
        "Generate Chinese review text.",
      ],
      platform: payload.platform,
      strategy: payload.strategy,
      source: payload.source,
      draft: payload.draft,
      outputSchema: {
        score: 86,
        items: [
          { label: "标题吸引力", value: 85 },
          { label: "结构完整度", value: 82 },
          { label: "平台匹配度", value: 88 },
          { label: "标签覆盖度", value: 78 },
          { label: "风险控制", value: 90 },
        ],
        tips: ["string", "string", "string"],
        risks: ["string", "string"],
        summary: "string",
      },
    },
    null,
    2
  );
}

function serveStatic(pathname, res) {
  const requested = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  const filePath = path.resolve(root, `.${requested}`);
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
    res.end(content);
  });
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Request body too large."));
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

findAvailablePort(preferredPort).then((port) => {
  const server = createServer();
  server.listen(port, "127.0.0.1", () => {
    console.log(`CreatorFlow server running at http://127.0.0.1:${port}`);
    console.log(apiBaseUrl && apiKey && model ? `AI proxy enabled: ${model}` : "AI proxy disabled: using mock fallback");
  });
});

function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    function tryPort(port) {
      if (port > startPort + 10) {
        reject(new Error(`No available port found from ${startPort} to ${startPort + 10}`));
        return;
      }

      const tester = http.createServer();
      tester.once("error", (error) => {
        if (error.code === "EADDRINUSE") {
          console.log(`Port ${port} is busy, trying ${port + 1}...`);
          tryPort(port + 1);
          return;
        }
        reject(error);
      });
      tester.once("listening", () => {
        tester.close(() => resolve(port));
      });
      tester.listen(port, "127.0.0.1");
    }

    tryPort(startPort);
  });
}
