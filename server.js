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
    if (req.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      sendCors(res, 204);
      return;
    }

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

    if (req.method === "POST" && url.pathname === "/api/analyze") {
      await handleAnalyze(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/collect") {
      await handleCollect(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/publish") {
      await handlePublish(req, res);
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

async function handleAnalyze(req, res) {
  const payload = await readJson(req);
  await callModelJson(res, buildAnalyzePrompt(payload), "You are a Chinese multi-platform content strategist. Analyze only reusable patterns from user-provided public or authorized samples. Return strict JSON only. Do not copy sample wording.");
}

async function handleCollect(req, res) {
  const payload = await readJson(req);
  const links = Array.isArray(payload.links) ? payload.links.slice(0, 8) : [];
  if (!links.length) {
    sendJson(res, 400, { error: "No public links provided." });
    return;
  }

  const items = await Promise.all(
    links.map(async (item) => {
      const url = String(item.url || "").trim();
      const platformId = String(item.platformId || "unknown");
      try {
        const collected = await collectPublicPage(url);
        return Object.assign({ platformId, url, ok: true }, collected);
      } catch (error) {
        return {
          platformId,
          url,
          ok: false,
          error: error.message,
        };
      }
    })
  );

  sendJson(res, 200, { items });
}

async function handlePublish(req, res) {
  const payload = await readJson(req);
  const items = Array.isArray(payload.items) ? payload.items.slice(0, 8) : [];
  if (!items.length) {
    sendJson(res, 400, { error: "No publish items provided." });
    return;
  }

  const results = await Promise.all(
    items.map(async (item) => {
      try {
        return await publishItem(item);
      } catch (error) {
        return {
          platformId: item.platformId,
          platformName: item.platformName,
          ok: false,
          mode: "error",
          publisher: "PublishGateway",
          status: "发布失败",
          message: error.message,
        };
      }
    })
  );

  sendJson(res, 200, { items: results });
}

async function publishItem(item) {
  const platformId = String(item.platformId || "");
  if (platformId === "wechat") {
    return publishWechatDraft(item);
  }

  const webhookUrl = getWebhookUrl(platformId);
  if (webhookUrl) {
    return publishToWebhook(item, webhookUrl);
  }

  return {
    platformId,
    platformName: item.platformName,
    ok: false,
    mode: "manual",
    publisher: "ManualPublisher",
    status: "待人工发布",
    message: "该平台未配置官方发布凭证或 Webhook。已生成最终稿，可复制到平台后台确认发布。",
  };
}

async function publishWechatDraft(item) {
  const webhookUrl = getWebhookUrl("wechat");
  const accessToken = process.env.WECHAT_ACCESS_TOKEN || "";
  const thumbMediaId = process.env.WECHAT_THUMB_MEDIA_ID || "";

  if (!accessToken && webhookUrl) {
    return publishToWebhook(item, webhookUrl);
  }

  if (!accessToken || !thumbMediaId) {
    return {
      platformId: "wechat",
      platformName: item.platformName,
      ok: false,
      mode: "draft",
      publisher: "WeChatDraftConnector",
      status: "待配置",
      message: "公众号草稿箱需要 WECHAT_ACCESS_TOKEN 和 WECHAT_THUMB_MEDIA_ID。未配置时不会伪装成真实发布。",
    };
  }

  const draft = item.draft || {};
  const endpoint = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${encodeURIComponent(accessToken)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      articles: [
        {
          title: String(draft.title || "").slice(0, 64),
          author: process.env.WECHAT_AUTHOR || "CreatorFlow",
          digest: String(draft.summary || "").slice(0, 120),
          content: draftToWechatHtml(draft),
          content_source_url: process.env.WECHAT_SOURCE_URL || "",
          thumb_media_id: thumbMediaId,
          need_open_comment: 0,
          only_fans_can_comment: 0,
        },
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.errcode) {
    return {
      platformId: "wechat",
      platformName: item.platformName,
      ok: false,
      mode: "draft",
      publisher: "WeChatDraftConnector",
      status: "发布失败",
      message: data.errmsg || `公众号 API 返回 HTTP ${response.status}`,
    };
  }

  return {
    platformId: "wechat",
    platformName: item.platformName,
    ok: true,
    mode: "draft",
    publisher: "WeChatDraftConnector",
    status: "已提交草稿箱",
    externalId: data.media_id || "",
    message: data.media_id ? `公众号草稿 media_id：${data.media_id}` : "已提交公众号草稿箱",
  };
}

async function publishToWebhook(item, webhookUrl) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "CreatorFlow",
      platformId: item.platformId,
      platformName: item.platformName,
      version: item.version,
      draft: item.draft,
      createdAt: new Date().toISOString(),
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    return {
      platformId: item.platformId,
      platformName: item.platformName,
      ok: false,
      mode: "webhook",
      publisher: "WebhookPublisher",
      status: "发布失败",
      message: text.slice(0, 300) || `Webhook HTTP ${response.status}`,
    };
  }

  return {
    platformId: item.platformId,
    platformName: item.platformName,
    ok: true,
    mode: "webhook",
    publisher: "WebhookPublisher",
    status: "已提交真实通道",
    message: text.slice(0, 300) || "Webhook 已接收发布任务",
  };
}

function getWebhookUrl(platformId) {
  const key = `PUBLISH_WEBHOOK_${String(platformId || "").toUpperCase()}`;
  return process.env[key] || process.env.PUBLISH_WEBHOOK_URL || "";
}

function draftToWechatHtml(draft) {
  const body = Array.isArray(draft.body) ? draft.body : [];
  const tags = Array.isArray(draft.tags) ? draft.tags : [];
  return [
    `<p>${escapeHtmlForServer(draft.summary || "")}</p>`,
    ...body.map((line) => `<p>${escapeHtmlForServer(line)}</p>`),
    tags.length ? `<p>${tags.map((tag) => `#${escapeHtmlForServer(tag)}`).join(" ")}</p>` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function escapeHtmlForServer(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

function buildAnalyzePrompt(payload) {
  return JSON.stringify(
    {
      task: "Analyze user-provided platform sample pool and extract reusable viral content strategies.",
      requirements: [
        "Output must be valid JSON.",
        "Analyze only samples provided by the user. Do not claim live crawling.",
        "Do not copy sample sentences. Extract structure, rhythm, title patterns, openings, tags and interaction style.",
        "Mention sample limitations and compliance risks if samples look clickbait, exaggerated or insufficient.",
        "Generate Chinese strategy text.",
      ],
      platforms: payload.platforms,
      samplePool: payload.samplePool,
      outputSchema: {
        platforms: [
          {
            id: "wechat",
            strategy: {
              headline: "string",
              titlePatterns: ["string", "string", "string"],
              opening: "string",
              structure: ["string", "string", "string", "string"],
              tags: ["string", "string", "string"],
              risk: "string",
              evidence: "string",
            },
          },
        ],
      },
    },
    null,
    2
  );
}

async function collectPublicPage(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("链接格式无效");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("只支持 http/https 公开链接");
  }

  if (isBlockedHost(url.hostname)) {
    throw new Error("不采集本机或内网地址");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  let response;
  try {
    response = await fetch(url.href, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "CreatorFlowDemo/1.0 (+public content strategy analysis)",
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.8,*/*;q=0.5",
      },
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`公开页面访问失败：HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
    throw new Error("链接不是可解析的公开文本页面");
  }

  const html = (await response.text()).slice(0, 500000);
  const title = extractTitle(html);
  const description = extractMeta(html, "description") || extractMeta(html, "og:description");
  const keywords = extractMeta(html, "keywords");
  const headings = extractHeadings(html);
  const body = extractBodyText(html);
  const sample = [
    title ? `标题：${title}` : "",
    description ? `摘要：${description}` : "",
    headings.length ? `结构线索：${headings.join(" / ")}` : "",
    keywords ? `关键词：${keywords}` : "",
    body ? `正文片段：${body}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  if (!sample) {
    throw new Error("公开页面没有提取到可分析文本");
  }

  return {
    title,
    description,
    sample: sample.slice(0, 4000),
  };
}

function isBlockedHost(hostname) {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local")) return true;
  if (host === "::1" || host === "0.0.0.0") return true;
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)) return true;
  const private172 = host.match(/^172\.(\d+)\./);
  return Boolean(private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31);
}

function extractTitle(html) {
  return decodeEntities(firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i)).slice(0, 120);
}

function extractMeta(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${escaped}["'][^>]*>`, "i"),
  ];
  for (const pattern of patterns) {
    const value = firstMatch(html, pattern);
    if (value) return decodeEntities(value).slice(0, 240);
  }
  return "";
}

function extractHeadings(html) {
  const headings = [];
  html.replace(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi, (_, value) => {
    const text = cleanText(value);
    if (text && headings.length < 6) headings.push(text.slice(0, 60));
    return "";
  });
  return headings;
}

function extractBodyText(html) {
  const clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return cleanText(clean).slice(0, 1400);
}

function firstMatch(source, pattern) {
  const match = source.match(pattern);
  return match ? match[1] || "" : "";
}

function cleanText(value) {
  return decodeEntities(value)
    .replace(/\s+/g, " ")
    .replace(/[\u200b-\u200f\ufeff]/g, "")
    .trim();
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
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
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  });
  res.end(JSON.stringify(body));
}

function sendCors(res, status) {
  res.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  });
  res.end();
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
