const sharedStopWords = ["一个", "以及", "通过", "我们", "可以", "进行", "工具", "内容"];

const platformAdapters = {
  wechat: {
    id: "wechat",
    name: "公众号",
    accent: "#0f8a5f",
    profile: "重视完整结构、可信表达和收藏价值",
    maxTitle: 32,
    idealLength: [800, 1800],
    sections: ["背景", "核心观点", "方法步骤", "总结"],
    adapt(input, options) {
      const paragraphs = splitParagraphs(input.body);
      const title = clampTitle(input.title || makeTitle(input.body, "完整指南"), this.maxTitle);
      const summary = `面向${options.audience}，这篇内容被整理为适合公众号阅读的长文结构，强调背景、方法和可复用经验。`;
      const body = [
        "开篇说明",
        ...paragraphs.slice(0, 2),
        "核心拆解",
        ...toNumberedPoints(paragraphs),
        options.includeCta ? "如果这套方法对你有帮助，可以收藏后在下一次发布前逐项检查。" : "",
      ].filter(Boolean);
      return buildDraft(this, title, summary, body, input, options);
    },
  },
  zhihu: {
    id: "zhihu",
    name: "知乎",
    accent: "#1769e0",
    profile: "重视问题意识、论证链路和实践结论",
    maxTitle: 42,
    idealLength: [600, 1600],
    sections: ["结论先行", "原因分析", "操作建议", "边界条件"],
    adapt(input, options) {
      const title = clampTitle(input.title ? `${input.title}，实际应该怎么做？` : makeTitle(input.body, "实践答案"), this.maxTitle);
      const paragraphs = splitParagraphs(input.body);
      const summary = `先给结论：面向${options.audience}时，关键不是简单同步，而是让同一份内容在不同平台保留一致观点并调整表达方式。`;
      const body = [
        "我的判断",
        summary,
        "为什么需要适配",
        ...paragraphs.slice(0, 3),
        "可执行建议",
        ...toNumberedPoints(paragraphs).slice(0, 4),
        options.includeCta ? "欢迎在评论区补充你遇到的平台发布问题，我会继续把场景整理成清单。" : "",
      ].filter(Boolean);
      return buildDraft(this, title, summary, body, input, options);
    },
  },
  bilibili: {
    id: "bilibili",
    name: "B站",
    accent: "#fb7299",
    profile: "重视标题吸引力、分段节奏和视频简介信息密度",
    maxTitle: 36,
    idealLength: [180, 600],
    sections: ["标题", "简介", "时间轴", "互动"],
    adapt(input, options) {
      const title = clampTitle(input.title ? `${input.title}｜3分钟讲清楚` : makeTitle(input.body, "视频脚本"), this.maxTitle);
      const paragraphs = splitParagraphs(input.body);
      const summary = `本期面向${options.audience}，用更短的节奏讲清楚核心思路、适用场景和落地步骤。`;
      const body = [
        "视频简介",
        summary,
        "看点时间轴",
        "00:00 问题背景",
        "00:35 核心方案",
        "01:40 平台差异",
        "02:30 发布前检查",
        ...paragraphs.slice(0, 2),
        options.includeCta ? "觉得有用的话，可以一键三连并把你的发布流程发在评论区。" : "",
      ].filter(Boolean);
      return buildDraft(this, title, summary, body, input, options);
    },
  },
  xiaohongshu: {
    id: "xiaohongshu",
    name: "小红书",
    accent: "#ff4d6d",
    profile: "重视生活化表达、强标题、短句和标签分发",
    maxTitle: 20,
    idealLength: [120, 500],
    sections: ["痛点", "清单", "体验", "标签"],
    adapt(input, options) {
      const title = clampTitle(input.title ? `${input.title}避坑清单` : makeTitle(input.body, "实用清单"), this.maxTitle);
      const paragraphs = splitParagraphs(input.body);
      const summary = `给${options.audience}的一份发布前检查清单，适合收藏后直接照着做。`;
      const body = [
        "适合谁",
        summary,
        "发布前看这几项",
        ...toShortBullets(paragraphs),
        options.includeCta ? "你最常卡在哪个平台？评论区告诉我，我来补一版模板。" : "",
      ].filter(Boolean);
      return buildDraft(this, title, summary, body, input, options);
    },
  },
};

function createAdaptedDrafts(input, options) {
  return Object.fromEntries(
    Object.values(platformAdapters).map((adapter) => [adapter.id, adapter.adapt(input, options)])
  );
}

function buildDraft(adapter, title, summary, body, input, options) {
  const tags = options.includeTags ? makeTags(`${input.title} ${input.body}`, adapter.id) : [];
  const wordCount = body.join("").length;
  const checks = buildChecks(adapter, title, wordCount, tags);
  return {
    platformId: adapter.id,
    platformName: adapter.name,
    accent: adapter.accent,
    profile: adapter.profile,
    title,
    summary,
    body,
    tags,
    checks,
    metrics: {
      字数: wordCount,
      标题长度: title.length,
      标签数: tags.length,
      结构块: adapter.sections.length,
    },
  };
}

function buildChecks(adapter, titleLength, wordCount, tags) {
  const [min, max] = adapter.idealLength;
  return [
    {
      ok: titleLength.length <= adapter.maxTitle,
      text: `标题不超过 ${adapter.maxTitle} 字`,
    },
    {
      ok: wordCount >= min && wordCount <= max,
      text: `正文建议 ${min}-${max} 字`,
    },
    {
      ok: tags.length > 0,
      text: "已生成平台分发标签",
    },
    {
      ok: true,
      text: `已按${adapter.name}内容风格重组`,
    },
  ];
}

function splitParagraphs(text) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function toNumberedPoints(paragraphs) {
  const points = paragraphs.length ? paragraphs : ["先明确目标平台，再按平台规则调整标题、结构和互动引导。"];
  return points.slice(0, 5).map((point, index) => `${index + 1}. ${point}`);
}

function toShortBullets(paragraphs) {
  const points = paragraphs.length ? paragraphs : ["先准备主稿，再生成不同平台的短句版本。"];
  return points.slice(0, 5).map((point) => `- ${point.length > 46 ? `${point.slice(0, 46)}...` : point}`);
}

function clampTitle(title, maxLength) {
  const trimmed = title.trim().replace(/\s+/g, " ");
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1)}…` : trimmed;
}

function makeTitle(text, suffix) {
  const firstLine = splitParagraphs(text)[0] || "多平台发布";
  return clampTitle(`${firstLine.slice(0, 18)}${suffix}`, 28);
}

function makeTags(text, platformId) {
  const platformTags = {
    wechat: ["内容运营", "效率工具", "创作者"],
    zhihu: ["内容创作", "新媒体运营", "效率提升"],
    bilibili: ["创作工具", "运营经验", "视频发布"],
    xiaohongshu: ["博主工具", "内容模板", "新手运营"],
  };
  const keywords = text
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 2 && !sharedStopWords.includes(word))
    .slice(0, 2);
  return [...new Set([...platformTags[platformId], ...keywords])].slice(0, 5);
}

window.CreatorFlowAdapters = {
  platformAdapters,
  createAdaptedDrafts,
};
