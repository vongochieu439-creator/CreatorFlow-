(function () {
  "use strict";

  var platforms = [
    {
      id: "wechat",
      name: "\u516c\u4f17\u53f7",
      accent: "#0f8a5f",
      profile: "\u957f\u6587\u7ed3\u6784\u3001\u65b9\u6cd5\u603b\u7ed3\u3001\u6536\u85cf\u4ef7\u503c",
      maxTitle: 32,
      minLength: 220,
      maxLength: 1800,
    },
    {
      id: "zhihu",
      name: "\u77e5\u4e4e",
      accent: "#1769e0",
      profile: "\u7ed3\u8bba\u5148\u884c\u3001\u539f\u56e0\u5206\u6790\u3001\u5b9e\u8df5\u5efa\u8bae",
      maxTitle: 42,
      minLength: 180,
      maxLength: 1600,
    },
    {
      id: "bilibili",
      name: "B\u7ad9",
      accent: "#fb7299",
      profile: "\u89c6\u9891\u7b80\u4ecb\u3001\u770b\u70b9\u65f6\u95f4\u8f74\u3001\u4e92\u52a8\u5f15\u5bfc",
      maxTitle: 36,
      minLength: 120,
      maxLength: 800,
    },
    {
      id: "xiaohongshu",
      name: "\u5c0f\u7ea2\u4e66",
      accent: "#ff4d6d",
      profile: "\u77ed\u53e5\u6e05\u5355\u3001\u751f\u6d3b\u5316\u8868\u8fbe\u3001\u6807\u7b7e\u5206\u53d1",
      maxTitle: 20,
      minLength: 80,
      maxLength: 600,
    },
  ];

  var selectedId = "wechat";
  var generationCount = 0;
  var analysisCount = 0;
  var platformStrategies = {};
  var editedDrafts = {};
  var draftVersions = {};
  var aiDrafts = {};
  var aiSource = "\u672c\u5730\u6a21\u62df";
  var sampleSource = "\u672a\u63d0\u4f9b\u53c2\u8003\u6837\u672c";
  var hasScored = false;
  var scoreDirty = false;
  var qualityResults = {};
  var qualityArchives = {};
  var qualityLoading = {};
  var publishRecords = [];
  var publishSelections = {};
  var toastTimer = null;
  var composeStep = "input";
  var aiRendering = false;
  var aiRenderingLabel = "\u56db\u4e2a\u5e73\u53f0";
  var previewDirty = false;
  var viewMeta = {
    compose: ["\u521b\u4f5c\u53f0", "\u8f93\u5165\u4e3b\u7a3f\u5e76\u751f\u6210\u5e73\u53f0\u7a3f"],
    strategy: ["AI\u7b56\u7565", "\u5206\u6790\u5e73\u53f0\u89c4\u5f8b\u548c\u53c2\u8003\u6837\u672c"],
    publish: ["\u53d1\u5e03\u4ea4\u4ed8", "\u5bfc\u51fa\u7a3f\u4ef6\u3001\u6a21\u62df\u53d1\u5e03\u548c\u67e5\u770b\u901a\u9053"],
  };

  var publishers = {
    wechat: {
      current: "MockPublisher",
      future: "\u516c\u4f17\u53f7\u8349\u7a3f\u7bb1 API",
      mode: "\u8349\u7a3f\u7bb1",
      note: "\u5148\u751f\u6210\u8349\u7a3f\uff0c\u518d\u7531\u8fd0\u8425\u4eba\u5458\u786e\u8ba4\u53d1\u5e03\u3002",
    },
    zhihu: {
      current: "MockPublisher",
      future: "\u6388\u6743\u53d1\u5e03 / \u534a\u81ea\u52a8\u590d\u5236",
      mode: "\u534a\u81ea\u52a8",
      note: "\u4fdd\u7559\u4eba\u5de5\u786e\u8ba4\uff0c\u907f\u514d\u5e73\u53f0\u6743\u9650\u548c\u98ce\u63a7\u95ee\u9898\u3002",
    },
    bilibili: {
      current: "MockPublisher",
      future: "\u521b\u4f5c\u4e2d\u5fc3\u6295\u7a3f\u6d41\u7a0b",
      mode: "\u7a3f\u4ef6\u5305",
      note: "\u53ef\u5bf9\u63a5\u89c6\u9891\u7d20\u6750\u3001\u7b80\u4ecb\u3001\u6807\u7b7e\u548c\u65f6\u95f4\u8f74\u3002",
    },
    xiaohongshu: {
      current: "MockPublisher",
      future: "\u5206\u4eab\u53d1\u5e03 / \u534a\u81ea\u52a8\u53d1\u5e03",
      mode: "\u5206\u4eab\u5f0f",
      note: "\u5efa\u8bae\u5148\u5bfc\u51fa\u53d1\u5e03\u5305\uff0c\u518d\u8fdb\u5165\u5e73\u53f0\u786e\u8ba4\u3002",
    },
  };

  var strategyTemplates = {
    wechat: {
      headline: "\u65b9\u6cd5\u8bba + \u6536\u85cf\u4ef7\u503c",
      titlePatterns: ["\u7ed3\u679c\u627f\u8bfa + \u5b8c\u6574\u6307\u5357", "\u95ee\u9898\u80cc\u666f + \u89e3\u51b3\u65b9\u6848", "\u4eba\u7fa4 + \u5b9e\u7528\u6e05\u5355"],
      opening: "\u5148\u4ea4\u4ee3\u95ee\u9898\u80cc\u666f\uff0c\u518d\u8bf4\u8fd9\u7bc7\u6587\u80fd\u5e2e\u8bfb\u8005\u89e3\u51b3\u4ec0\u4e48\u3002",
      structure: ["\u80cc\u666f", "\u6838\u5fc3\u65b9\u6cd5", "\u64cd\u4f5c\u6b65\u9aa4", "\u603b\u7ed3"],
      tags: ["\u5185\u5bb9\u8fd0\u8425", "\u6548\u7387\u5de5\u5177", "\u7ecf\u9a8c\u603b\u7ed3"],
      risk: "\u907f\u514d\u6807\u9898\u8fc7\u5ea6\u5938\u5f20\uff0c\u8981\u4fdd\u7559\u4fe1\u606f\u5bc6\u5ea6\u548c\u53ef\u4fe1\u5ea6\u3002",
    },
    zhihu: {
      headline: "\u95ee\u9898\u610f\u8bc6 + \u7ed3\u8bba\u5148\u884c",
      titlePatterns: ["\u95ee\u9898 + \u5b9e\u9645\u600e\u4e48\u505a", "\u7ed3\u8bba + \u539f\u56e0\u5206\u6790", "\u8bef\u533a + \u6b63\u786e\u505a\u6cd5"],
      opening: "\u7b2c\u4e00\u6bb5\u76f4\u63a5\u7ed9\u5224\u65ad\uff0c\u7136\u540e\u8bf4\u660e\u7406\u7531\u3002",
      structure: ["\u7ed3\u8bba", "\u539f\u56e0", "\u6848\u4f8b", "\u5efa\u8bae"],
      tags: ["\u5185\u5bb9\u521b\u4f5c", "\u65b0\u5a92\u4f53", "\u6548\u7387"],
      risk: "\u907f\u514d\u53ea\u6709\u60c5\u7eea\u8868\u8fbe\uff0c\u9700\u8981\u7ed9\u51fa\u8bba\u636e\u548c\u8fb9\u754c\u3002",
    },
    bilibili: {
      headline: "\u770b\u70b9\u524d\u7f6e + \u8282\u594f\u660e\u786e",
      titlePatterns: ["\u7ed3\u679c + 3\u5206\u949f\u8bb2\u6e05", "\u65b0\u624b + \u907f\u5751", "\u4e00\u671f\u641e\u61c2 + \u5173\u952e\u95ee\u9898"],
      opening: "\u7b80\u4ecb\u5148\u8bf4\u89c6\u9891\u770b\u70b9\uff0c\u518d\u7ed9\u65f6\u95f4\u8f74\u3002",
      structure: ["\u89c6\u9891\u7b80\u4ecb", "\u65f6\u95f4\u8f74", "\u770b\u70b9", "\u4e92\u52a8"],
      tags: ["\u521b\u4f5c\u5de5\u5177", "\u8fd0\u8425\u7ecf\u9a8c", "\u89c6\u9891\u53d1\u5e03"],
      risk: "\u907f\u514d\u7b80\u4ecb\u592a\u957f\uff0c\u8981\u8ba9\u7528\u6237\u5feb\u901f\u770b\u5230\u89c6\u9891\u4ef7\u503c\u3002",
    },
    xiaohongshu: {
      headline: "\u75db\u70b9\u6807\u9898 + \u77ed\u53e5\u6e05\u5355",
      titlePatterns: ["\u4eba\u7fa4 + \u907f\u5751\u6e05\u5355", "\u75db\u70b9 + \u89e3\u51b3\u7ed3\u679c", "\u6570\u5b57 + \u53ef\u6536\u85cf"],
      opening: "\u5148\u8bf4\u7528\u6237\u75db\u70b9\uff0c\u518d\u7ed9\u4e00\u4e2a\u53ef\u7acb\u5373\u4f7f\u7528\u7684\u7ed3\u679c\u3002",
      structure: ["\u9002\u5408\u8c01", "\u6838\u5fc3\u6e05\u5355", "\u4f7f\u7528\u4f53\u9a8c", "\u8bc4\u8bba\u63d0\u95ee"],
      tags: ["\u535a\u4e3b\u5de5\u5177", "\u5185\u5bb9\u6a21\u677f", "\u65b0\u624b\u8fd0\u8425"],
      risk: "\u907f\u514d\u8fc7\u5ea6\u8425\u9500\u548c\u7167\u642c\u53c2\u8003\u7d20\u6750\uff0c\u4fdd\u7559\u539f\u521b\u89c2\u70b9\u3002",
    },
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function text(value) {
    return value == null ? "" : String(value);
  }

  function getInput() {
    return {
      title: text(byId("sourceTitle").value).trim() || "\u672a\u547d\u540d\u5185\u5bb9",
      body: text(byId("sourceBody").value).trim() || "\u8bf7\u5148\u8f93\u5165\u8981\u53d1\u5e03\u7684\u5185\u5bb9\u3002",
      samples: parseSamples(text(byId("sampleInput").value)),
      audience: text(byId("audienceInput").value).trim() || "\u76ee\u6807\u8bfb\u8005",
      tone: text(byId("toneSelect").value),
      includeTags: byId("tagToggle").checked,
      includeCta: byId("ctaToggle").checked,
    };
  }

  function parseSamples(value) {
    return value
      .split(/\n\s*---+\s*\n|\n\s*###\s*\n/)
      .map(function (item) {
        return item.trim();
      })
      .filter(Boolean)
      .slice(0, 3);
  }

  function splitLines(body) {
    return body.split(/\n+/).map(function (line) {
      return line.trim();
    }).filter(Boolean);
  }

  function cut(value, limit) {
    return value.length > limit ? value.slice(0, limit - 1) + "..." : value;
  }

  function makeDraft(platform, input) {
    var strategy = platformStrategies[platform.id] || strategyTemplates[platform.id];
    var aiDraft = aiDrafts[platform.id];
    var lines = splitLines(input.body);
    var body = [];
    var title = input.title;
    var summary = "";

    if (aiDraft) {
      title = cut(aiDraft.title || input.title, platform.maxTitle);
      summary = aiDraft.summary || "";
      body = Array.isArray(aiDraft.body) && aiDraft.body.length ? aiDraft.body : lines;
      return buildDraft(platform, strategy, input, title, summary, body, aiDraft.tags, aiDraft.explanation);
    }

    if (platform.id === "wechat") {
      title = cut(input.audience + "\u5fc5\u6536\u85cf\uff1a" + input.title, platform.maxTitle);
      summary = "\u9762\u5411" + input.audience + "\uff0c\u6839\u636e\u516c\u4f17\u53f7\u70ed\u95e8\u5185\u5bb9\u7684\u300c" + strategy.headline + "\u300d\u89c4\u5f8b\u91cd\u7ec4\u4e3a\u957f\u6587\u7ed3\u6784\u3002";
      body = ["\u5f00\u7bc7\u8bf4\u660e"].concat(lines.slice(0, 2), ["\u6838\u5fc3\u62c6\u89e3"], numberLines(lines));
    }

    if (platform.id === "zhihu") {
      title = cut(input.title + "\uff0c\u5b9e\u9645\u5e94\u8be5\u600e\u4e48\u505a\uff1f", platform.maxTitle);
      summary = "\u5148\u7ed9\u7ed3\u8bba\uff1a\u7ed3\u5408\u77e5\u4e4e\u300c" + strategy.headline + "\u300d\u7684\u5185\u5bb9\u7279\u5f81\uff0c\u5173\u952e\u662f\u628a\u89c2\u70b9\u3001\u7406\u7531\u548c\u5efa\u8bae\u8bb2\u6e05\u695a\u3002";
      body = ["\u6211\u7684\u5224\u65ad", summary, "\u4e3a\u4ec0\u4e48\u9700\u8981\u9002\u914d"].concat(lines.slice(0, 3), ["\u53ef\u6267\u884c\u5efa\u8bae"], numberLines(lines).slice(0, 4));
    }

    if (platform.id === "bilibili") {
      title = cut(input.title + " | 3\u5206\u949f\u8bb2\u6e05\u695a", platform.maxTitle);
      summary = "\u672c\u671f\u9762\u5411" + input.audience + "\uff0c\u6309 B\u7ad9\u300c" + strategy.headline + "\u300d\u7684\u89c4\u5f8b\u63d0\u70bc\u770b\u70b9\u548c\u65f6\u95f4\u8f74\u3002";
      body = ["\u89c6\u9891\u7b80\u4ecb", summary, "\u770b\u70b9\u65f6\u95f4\u8f74", "00:00 \u95ee\u9898\u80cc\u666f", "00:35 \u6838\u5fc3\u65b9\u6848", "01:40 \u5e73\u53f0\u5dee\u5f02", "02:30 \u53d1\u5e03\u524d\u68c0\u67e5"].concat(lines.slice(0, 2));
    }

    if (platform.id === "xiaohongshu") {
      title = cut(input.audience + input.title + "\u907f\u5751\u6e05\u5355", platform.maxTitle);
      summary = "\u7ed9" + input.audience + "\u7684\u4e00\u4efd\u53d1\u5e03\u524d\u68c0\u67e5\u6e05\u5355\uff0c\u6309\u5c0f\u7ea2\u4e66\u300c" + strategy.headline + "\u300d\u98ce\u683c\u751f\u6210\u3002";
      body = ["\u9002\u5408\u8c01", summary, "\u53d1\u5e03\u524d\u770b\u8fd9\u51e0\u9879"].concat(shortLines(lines));
    }

    if (input.includeCta) {
      body.push("\u5982\u679c\u8fd9\u4efd\u7a3f\u4ef6\u6709\u5e2e\u52a9\uff0c\u53ef\u4ee5\u5148\u6536\u85cf\uff0c\u53d1\u5e03\u524d\u518d\u5bf9\u7167\u68c0\u67e5\u3002");
    }

    return buildDraft(platform, strategy, input, title, summary, body);
  }

  function buildDraft(platform, strategy, input, title, summary, body, apiTags, apiExplanation) {
    var plainText = body.join("");
    var tags = input.includeTags ? (apiTags && apiTags.length ? apiTags : makeTags(platform, input)) : [];
    var explanation = normalizeExplanation(apiExplanation) || makeExplanation(platform, strategy, input, body);
    return {
      platform: platform,
      title: title,
      summary: summary,
      body: body,
      tags: tags,
      explanation: explanation,
      metrics: {
        length: plainText.length,
        titleLength: title.length,
        tagCount: tags.length,
        sectionCount: body.length,
      },
      checks: [
        { ok: title.length <= platform.maxTitle, text: "\u6807\u9898\u4e0d\u8d85\u8fc7 " + platform.maxTitle + " \u5b57" },
        { ok: plainText.length >= platform.minLength && plainText.length <= platform.maxLength, text: "\u6b63\u6587\u5efa\u8bae " + platform.minLength + "-" + platform.maxLength + " \u5b57" },
        { ok: tags.length > 0, text: "\u5df2\u751f\u6210\u5e73\u53f0\u5206\u53d1\u6807\u7b7e" },
        { ok: analysisCount > 0, text: "\u5df2\u7ed3\u5408 AI \u5e73\u53f0\u7206\u6b3e\u5206\u6790\u7b56\u7565" },
        { ok: aiSource !== "\u672c\u5730\u6a21\u62df", text: aiSource !== "\u672c\u5730\u6a21\u62df" ? "\u5f53\u524d\u7a3f\u4ef6\u6765\u81ea\u771f\u5b9e API" : "\u5f53\u524d\u4f7f\u7528\u672c\u5730\u6a21\u62df\u7b56\u7565" },
        { ok: sampleSource !== "\u672a\u63d0\u4f9b\u53c2\u8003\u6837\u672c", text: sampleSource },
        { ok: Boolean(editedDrafts[platform.id]), text: editedDrafts[platform.id] ? "\u5df2\u4fdd\u5b58\u624b\u52a8\u7f16\u8f91\u7248\u672c" : "AI \u751f\u6210\u7a3f\u9700\u8981\u4eba\u5de5\u786e\u8ba4\u540e\u518d\u53d1\u5e03" },
        { ok: true, text: "\u672a\u76f4\u63a5\u590d\u5236\u53c2\u8003\u7206\u6b3e\u8868\u8fbe\uff0c\u4ec5\u4f7f\u7528\u7ed3\u6784\u7b56\u7565" },
        { ok: true, text: "\u5df2\u6309" + platform.name + "\u98ce\u683c\u91cd\u7ec4" },
      ],
    };
  }

  function numberLines(lines) {
    var source = lines.length ? lines : ["\u5148\u660e\u786e\u76ee\u6807\u5e73\u53f0\uff0c\u518d\u8c03\u6574\u6807\u9898\u3001\u7ed3\u6784\u548c\u4e92\u52a8\u5f15\u5bfc\u3002"];
    return source.slice(0, 5).map(function (line, index) {
      return index + 1 + ". " + line;
    });
  }

  function shortLines(lines) {
    var source = lines.length ? lines : ["\u5148\u51c6\u5907\u4e3b\u7a3f\uff0c\u518d\u751f\u6210\u4e0d\u540c\u5e73\u53f0\u7684\u7248\u672c\u3002"];
    return source.slice(0, 5).map(function (line) {
      return "- " + cut(line, 48);
    });
  }

  function makeTags(platform, input) {
    var common = {
      wechat: ["\u5185\u5bb9\u8fd0\u8425", "\u6548\u7387\u5de5\u5177", "\u521b\u4f5c\u8005"],
      zhihu: ["\u5185\u5bb9\u521b\u4f5c", "\u65b0\u5a92\u4f53\u8fd0\u8425", "\u6548\u7387\u63d0\u5347"],
      bilibili: ["\u521b\u4f5c\u5de5\u5177", "\u8fd0\u8425\u7ecf\u9a8c", "\u89c6\u9891\u53d1\u5e03"],
      xiaohongshu: ["\u535a\u4e3b\u5de5\u5177", "\u5185\u5bb9\u6a21\u677f", "\u65b0\u624b\u8fd0\u8425"],
    };
    var keyword = cut(input.title.replace(/\s+/g, ""), 8);
    return common[platform.id].concat(keyword ? [keyword] : []).slice(0, 5);
  }

  function getSelectedPlatform() {
    for (var i = 0; i < platforms.length; i += 1) {
      if (platforms[i].id === selectedId) return platforms[i];
    }
    return platforms[0];
  }

  function render() {
    var input = getInput();
    var activePlatform = getSelectedPlatform();
    var activeDraft = makeDraft(activePlatform, input);
    renderComposeStep();
    renderTaskStatus(activeDraft);
    renderPlatformCards(input);
    renderStrategyBoard(input);
    renderPreview(activeDraft);
    renderRewriteExplanation(activeDraft);
    renderPublishSummary();
    renderPublisherGrid();
    renderPublishVersionGrid();
    renderVersionList(activeDraft);
    renderDiffPanel(activeDraft);
    renderInlineQuality(activeDraft);
    renderPublishLog();
  }

  function renderTaskStatus(draft) {
    var status = byId("taskStatus");
    var mask = byId("renderMask");
    if (!status || !mask) return;
    var qualityBusy = Boolean(qualityLoading[draft.platform.id]);
    var className = "task-status";
    var message = "\u5f53\u524d\u65e0\u540e\u53f0\u4efb\u52a1\uff0c\u53ef\u4ee5\u7f16\u8f91\u7a3f\u4ef6\u3002";

    if (aiRendering) {
      className += " is-blocking";
      message = "\u667a\u80fd\u4f18\u5316\u4e2d\uff1a\u6b63\u5728\u91cd\u5199" + aiRenderingLabel + "\u7a3f\u4ef6\uff0c\u5efa\u8bae\u7a0d\u7b49\u518d\u7f16\u8f91\u3002";
    } else if (previewDirty) {
      className += " is-warning";
      message = "\u5f53\u524d\u7a3f\u6709\u672a\u4fdd\u5b58\u4fee\u6539\uff1a\u53ef\u7ee7\u7eed\u7f16\u8f91\uff0c\u4fdd\u5b58\u540e\u53ef\u4e3b\u52a8\u5f00\u59cb AI \u8d28\u68c0\u3002";
    } else if (qualityBusy) {
      className += " is-working";
      message = "AI\u8d28\u68c0\u4e2d\uff1a\u53ef\u4ee5\u7ee7\u7eed\u7f16\u8f91\uff0c\u8fd9\u6b21\u7ed3\u679c\u4f1a\u5bf9\u5e94\u5f53\u524d\u9001\u68c0\u7248\u672c\u3002";
    } else {
      var record = getQualityRecord(draft);
      if (record && record.result) {
        className += " is-ready";
        message = "AI\u8d28\u68c0\u5df2\u5b8c\u6210\uff1a\u53ef\u67e5\u770b\u8bc4\u5206\u5efa\u8bae\uff0c\u4e5f\u53ef\u7ee7\u7eed\u5fae\u8c03\u5e76\u4fdd\u5b58\u3002";
      }
      if (record && record.error) {
        className += " is-warning";
        message = "AI\u8d28\u68c0\u672a\u5b8c\u6210\uff1a\u8bf7\u68c0\u67e5 API \u914d\u7f6e\u6216\u91cd\u65b0\u8bc4\u5206\u3002";
      }
    }

    status.className = className;
    status.textContent = message;
    if (aiRendering) {
      var title = mask.querySelector("strong");
      var copy = mask.querySelector("span");
      if (title) title.textContent = "\u6b63\u5728\u667a\u80fd\u4f18\u5316" + aiRenderingLabel;
      if (copy) copy.textContent = "\u4f18\u5316\u5b8c\u6210\u540e\u4f1a\u66f4\u65b0\u7a3f\u4ef6\uff0c\u5efa\u8bae\u7a0d\u7b49\u518d\u7f16\u8f91\u3002";
    }
    mask.classList.toggle("is-visible", aiRendering);
  }

  function renderComposeStep() {
    var inputStep = byId("inputStep");
    var draftStep = byId("draftStep");
    if (!inputStep || !draftStep) return;
    inputStep.classList.toggle("is-active", composeStep === "input");
    draftStep.classList.toggle("is-active", composeStep === "draft");
  }

  function analyzePlatformTrends() {
    analysisCount += 1;
    byId("analyzeBtn").disabled = true;
    byId("analyzeBtn").textContent = "AI\u5206\u6790\u4e2d";
    byId("generationState").textContent = "\u6b63\u5728\u5206\u6790\u5e73\u53f0\u7206\u6b3e\u89c4\u5f8b";

    window.setTimeout(function () {
      platforms.forEach(function (platform) {
        platformStrategies[platform.id] = buildStrategy(platform, getInput());
      });
      byId("analyzeBtn").disabled = false;
      byId("analyzeBtn").textContent = "\u91cd\u65b0AI\u5206\u6790";
      byId("generationState").textContent = "\u5df2\u5f62\u6210 4 \u4e2a\u5e73\u53f0\u5185\u5bb9\u7b56\u7565";
      render();
      showToast("AI \u5df2\u5206\u6790 4 \u4e2a\u5e73\u53f0\u7684\u7206\u6b3e\u5185\u5bb9\u89c4\u5f8b");
    }, 360);
  }

  function buildAiPlatformPayload(platformList) {
    return platformList.map(function (platform) {
      return {
        id: platform.id,
        name: platform.name,
        profile: platform.profile,
        maxTitle: platform.maxTitle,
        lengthRange: [platform.minLength, platform.maxLength],
      };
    });
  }

  async function requestAiDrafts(platformList) {
    var input = getInput();
    var response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: input,
        platforms: buildAiPlatformPayload(platformList),
      }),
    });
    var data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "\u771f\u5b9e AI \u8bf7\u6c42\u5931\u8d25");
    }
    return data;
  }

  async function callRealAi() {
    aiRendering = true;
    aiRenderingLabel = "\u56db\u4e2a\u5e73\u53f0";
    previewDirty = false;
    render();
    byId("realAiBtn").disabled = true;
    byId("realAiBtn").textContent = "\u4f18\u5316\u4e2d";
    byId("generationState").textContent = "\u6b63\u5728\u667a\u80fd\u4f18\u5316\u591a\u5e73\u53f0\u7a3f";

    try {
      var input = getInput();
      var data = await requestAiDrafts(platforms);
      applyAiResponse(data, false);
      aiSource = "\u771f\u5b9e API";
      sampleSource = input.samples.length ? "\u7b56\u7565\u6765\u6e90\uff1a\u7528\u6237\u53c2\u8003\u6837\u672c + \u771f\u5b9e API" : "\u7b56\u7565\u6765\u6e90\uff1a\u5e73\u53f0\u753b\u50cf + \u771f\u5b9e API";
      analysisCount += 1;
      generationCount += 1;
      composeStep = "draft";
      editedDrafts = {};
      qualityResults = {};
      hasScored = true;
      scoreDirty = false;
      render();
      byId("generationState").textContent = "\u5df2\u5b8c\u6210\u667a\u80fd\u4f18\u5316";
      showToast("\u667a\u80fd\u4f18\u5316\u5b8c\u6210");
    } catch (error) {
      aiSource = "\u672c\u5730\u6a21\u62df";
      sampleSource = "\u771f\u5b9e API \u672a\u751f\u6548\uff0c\u5f53\u524d\u4f7f\u7528\u672c\u5730\u6a21\u62df";
      var message = error.message && error.message.indexOf("AI API is not configured") >= 0
        ? "\u672a\u914d\u7f6e AI API\uff0c\u5df2\u4fdd\u7559\u672c\u5730\u6a21\u62df\u7ed3\u679c"
        : error.message + "\uff0c\u5df2\u4fdd\u7559\u672c\u5730\u6a21\u62df";
      showToast(message);
      byId("generationState").textContent = "\u672a\u914d\u7f6e AI API\uff0c\u5f53\u524d\u4f7f\u7528\u672c\u5730\u6a21\u62df";
    } finally {
      aiRendering = false;
      byId("realAiBtn").disabled = false;
      byId("realAiBtn").textContent = "\u4e00\u952e\u667a\u80fd\u4f18\u5316";
      render();
    }
  }

  async function optimizeCurrentPlatform() {
    var platform = getSelectedPlatform();
    aiRendering = true;
    aiRenderingLabel = platform.name;
    previewDirty = false;
    render();
    byId("optimizeCurrentBtn").disabled = true;
    byId("optimizeCurrentBtn").textContent = "\u4f18\u5316\u4e2d";
    byId("generationState").textContent = "\u6b63\u5728\u4f18\u5316" + platform.name + "\u7a3f";

    try {
      var input = getInput();
      var data = await requestAiDrafts([platform]);
      applyAiResponse(data, true);
      aiSource = "\u771f\u5b9e API";
      sampleSource = input.samples.length ? "\u7b56\u7565\u6765\u6e90\uff1a\u7528\u6237\u53c2\u8003\u6837\u672c + \u771f\u5b9e API" : "\u7b56\u7565\u6765\u6e90\uff1a\u5e73\u53f0\u753b\u50cf + \u771f\u5b9e API";
      generationCount += 1;
      delete editedDrafts[platform.id];
      delete qualityResults[platform.id];
      publishSelections[platform.id] = "ai";
      render();
      byId("generationState").textContent = "\u5df2\u5b8c\u6210" + platform.name + "\u667a\u80fd\u4f18\u5316";
      showToast(platform.name + "\u7a3f\u5df2\u91cd\u65b0\u4f18\u5316");
    } catch (error) {
      showToast((error.message || "\u5355\u5e73\u53f0\u4f18\u5316\u5931\u8d25") + "\uff0c\u5df2\u4fdd\u7559\u5f53\u524d\u7a3f");
      byId("generationState").textContent = platform.name + "\u4f18\u5316\u672a\u5b8c\u6210";
    } finally {
      aiRendering = false;
      byId("optimizeCurrentBtn").disabled = false;
      byId("optimizeCurrentBtn").textContent = "\u4f18\u5316\u5f53\u524d\u5e73\u53f0";
      render();
    }
  }

  function applyAiResponse(data, mergeDrafts) {
    var list = Array.isArray(data.platforms) ? data.platforms : [];
    var nextStrategies = {};
    var nextDrafts = {};

    list.forEach(function (item) {
      if (!item || !item.id) return;
      if (item.strategy) {
        nextStrategies[item.id] = normalizeStrategy(item.id, item.strategy);
      }
      if (item.draft) {
        nextDrafts[item.id] = normalizeDraft(item.draft);
      }
    });

    if (!Object.keys(nextDrafts).length) {
      throw new Error("\u6a21\u578b\u8fd4\u56de\u7ed3\u6784\u4e2d\u6ca1\u6709 draft");
    }

    platformStrategies = Object.assign({}, platformStrategies, nextStrategies);
    aiDrafts = mergeDrafts ? Object.assign({}, aiDrafts, nextDrafts) : nextDrafts;
  }

  function normalizeStrategy(platformId, strategy) {
    var fallback = strategyTemplates[platformId];
    return {
      headline: String(strategy.headline || fallback.headline),
      titlePatterns: Array.isArray(strategy.titlePatterns) && strategy.titlePatterns.length ? strategy.titlePatterns.map(String) : fallback.titlePatterns,
      opening: String(strategy.opening || fallback.opening),
      structure: Array.isArray(strategy.structure) && strategy.structure.length ? strategy.structure.map(String) : fallback.structure,
      tags: Array.isArray(strategy.tags) && strategy.tags.length ? strategy.tags.map(String) : fallback.tags,
      risk: String(strategy.risk || fallback.risk),
    };
  }

  function normalizeDraft(draft) {
    return {
      title: String(draft.title || ""),
      summary: String(draft.summary || ""),
      body: Array.isArray(draft.body) ? draft.body.map(String).filter(Boolean) : [],
      tags: Array.isArray(draft.tags) ? draft.tags.map(String).filter(Boolean) : [],
      explanation: normalizeExplanation(draft.explanation),
    };
  }

  function normalizeExplanation(explanation) {
    if (!explanation) return null;
    var sections = Array.isArray(explanation.sections) ? explanation.sections : [];
    var normalizedSections = sections.map(function (item) {
      if (!item) return null;
      return {
        label: String(item.label || ""),
        text: String(item.text || ""),
      };
    }).filter(function (item) {
      return item.label && item.text;
    }).slice(0, 4);

    if (!normalizedSections.length) return null;
    return {
      source: String(explanation.source || "AI\u751f\u6210\u8bf4\u660e"),
      sections: normalizedSections,
    };
  }

  function makeExplanation(platform, strategy, input, body) {
    var source = aiSource !== "\u672c\u5730\u6a21\u62df" ? "\u771f\u5b9eAI\u751f\u6210" : "\u672c\u5730\u7b56\u7565\u6a21\u62df";
    var sampleNote = input.samples.length
      ? "\u5df2\u4ece\u53c2\u8003\u6837\u672c\u63d0\u53d6\u6807\u9898\u8282\u594f\u3001\u5f00\u5934\u65b9\u5f0f\u548c\u4e92\u52a8\u7ed3\u6784\uff0c\u4e0d\u590d\u5236\u539f\u53e5\u3002"
      : "\u672a\u63d0\u4f9b\u53c2\u8003\u6837\u672c\uff0c\u4e3b\u8981\u4f9d\u636e\u5e73\u53f0\u753b\u50cf\u548c\u9884\u7f6e\u7b56\u7565\u751f\u6210\u3002";
    var changeText = "\u5c06\u539f\u7a3f\u91cd\u7ec4\u4e3a\u300c" + strategy.structure.slice(0, 4).join(" / ") + "\u300d\uff0c\u5e76\u6309" + platform.name + "\u9605\u8bfb\u4e60\u60ef\u8c03\u6574\u6807\u9898\u3001\u6458\u8981\u548c\u6bb5\u843d\u8282\u594f\u3002";
    if (body.length <= 4) {
      changeText += "\u5f53\u524d\u4e3b\u7a3f\u504f\u77ed\uff0c\u5efa\u8bae\u540e\u7eed\u8865\u5145\u6848\u4f8b\u6216\u7ec6\u8282\u3002";
    }

    return {
      source: source,
      sections: [
        { label: "\u5e73\u53f0\u7b56\u7565", text: "\u91c7\u7528\u300c" + strategy.headline + "\u300d\uff0c\u9002\u914d" + platform.profile + "\u3002" },
        { label: "\u5173\u952e\u6539\u52a8", text: changeText },
        { label: "\u6837\u672c\u5f71\u54cd", text: sampleNote },
        { label: "\u98ce\u9669\u63d0\u9192", text: strategy.risk },
      ],
    };
  }

  function buildStrategy(platform, input) {
    var template = strategyTemplates[platform.id];
    return {
      headline: template.headline,
      titlePatterns: template.titlePatterns,
      opening: template.opening,
      structure: template.structure,
      tags: template.tags.concat(cut(input.title.replace(/\s+/g, ""), 8)).slice(0, 5),
      risk: template.risk,
    };
  }

  function renderStrategyBoard(input) {
    var board = byId("strategyBoard");
    board.innerHTML = "";
    platforms.forEach(function (platform) {
      var strategy = platformStrategies[platform.id] || strategyTemplates[platform.id];
      var card = document.createElement("article");
      card.className = "strategy-card" + (platform.id === selectedId ? " is-active" : "");
      card.style.setProperty("--accent", platform.accent);
      card.innerHTML =
        '<div class="strategy-card-head"><span>' + platform.name + '</span><strong>' + (analysisCount ? "AI\u5df2\u5206\u6790" : "\u9884\u7f6e\u7b56\u7565") + "</strong></div>" +
        '<p class="strategy-main">' + strategy.headline + "</p>" +
        '<dl>' +
        '<div><dt>\u6807\u9898\u89c4\u5f8b</dt><dd>' + strategy.titlePatterns[0] + "</dd></div>" +
        '<div><dt>\u5f00\u5934\u65b9\u5f0f</dt><dd>' + strategy.opening + "</dd></div>" +
        '<div><dt>\u5185\u5bb9\u7ed3\u6784</dt><dd>' + strategy.structure.join(" / ") + "</dd></div>" +
        '<div><dt>\u98ce\u9669\u63d0\u9192</dt><dd>' + strategy.risk + "</dd></div>" +
        "</dl>";
      card.addEventListener("click", function () {
        selectedId = platform.id;
        render();
      });
      board.appendChild(card);
    });
  }

  function renderPlatformCards(input) {
    var grid = byId("platformGrid");
    grid.innerHTML = "";
    platforms.forEach(function (platform) {
      var draft = makeDraft(platform, input);
      var button = document.createElement("button");
      button.type = "button";
      button.className = "platform-card" + (platform.id === selectedId ? " is-active" : "");
      button.style.setProperty("--accent", platform.accent);
      button.innerHTML =
        '<span class="platform-name">' + platform.name + '</span>' +
        '<span class="platform-profile">' + platform.profile + '</span>' +
        '<span class="platform-stats">' + draft.metrics.length + ' \u5b57 · ' + draft.tags.length + ' \u6807\u7b7e</span>';
      button.addEventListener("click", function () {
        selectedId = platform.id;
        previewDirty = false;
        render();
        showToast("\u5df2\u5207\u6362\u5230" + platform.name + "\u53d1\u5e03\u7a3f");
      });
      grid.appendChild(button);
    });
  }

  function renderPreview(draft) {
    var edited = editedDrafts[draft.platform.id];
    var current = edited || draftToParts(draft);
    var previewBody = current.body;
    byId("generationBanner").textContent = generationCount
      ? "\u5df2\u751f\u6210\u7b2c " + generationCount + " \u6b21\uff1a" + aiSource + " · " + sampleSource + " · \u5f53\u524d\u4e3a" + draft.platform.name + "\u7248\u672c"
      : "\u7b49\u5f85\u751f\u6210\u5e73\u53f0\u7a3f";
    byId("generationBanner").classList.toggle("is-ready", generationCount > 0);
    byId("previewMeta").innerHTML = '<span style="background:' + draft.platform.accent + '"></span>' + draft.platform.name + " \u53d1\u5e03\u7a3f";
    if (document.activeElement !== byId("previewTitle")) byId("previewTitle").textContent = current.title;
    if (document.activeElement !== byId("previewSummary")) byId("previewSummary").textContent = current.summary;
    byId("previewTitle").setAttribute("contenteditable", aiRendering ? "false" : "true");
    byId("previewSummary").setAttribute("contenteditable", aiRendering ? "false" : "true");
    byId("previewBody").setAttribute("contenteditable", aiRendering ? "false" : "true");
    byId("copyDraftBtn").disabled = aiRendering;
    byId("saveEditBtn").disabled = aiRendering;
    byId("optimizeCurrentBtn").disabled = aiRendering;
    byId("restoreDraftBtn").disabled = aiRendering;

    var body = byId("previewBody");
    if (document.activeElement !== body) {
      body.innerHTML = "";
      previewBody.forEach(function (line) {
        var el = document.createElement(line.length <= 8 ? "h4" : "p");
        el.textContent = line;
        body.appendChild(el);
      });
    }

    var tags = byId("previewTags");
    tags.innerHTML = "";
    draft.tags.forEach(function (tag) {
      var chip = document.createElement("span");
      chip.textContent = "#" + tag;
      tags.appendChild(chip);
    });
  }

  function renderRewriteExplanation(draft) {
    var box = byId("rewriteExplanation");
    var source = byId("rewriteSource");
    box.innerHTML = "";
    source.textContent = draft.explanation.source;
    draft.explanation.sections.forEach(function (section) {
      var item = document.createElement("article");
      var label = document.createElement("strong");
      var copy = document.createElement("p");
      item.className = "rewrite-item";
      label.textContent = section.label;
      copy.textContent = section.text;
      item.appendChild(label);
      item.appendChild(copy);
      box.appendChild(item);
    });
  }

  function renderVersionList(draft) {
    var versions = draftVersions[draft.platform.id] || [];
    var box = byId("versionList");
    box.innerHTML = "";
    if (!versions.length) {
      box.innerHTML = '<p class="empty-state">\u6682\u65e0\u4fdd\u5b58\u7248\u672c\u3002\u5728\u5de6\u4fa7\u7f16\u8f91\u5e73\u53f0\u7a3f\u540e\uff0c\u70b9\u51fb\u300c\u4fdd\u5b58\u5f53\u524d\u7248\u672c\u300d\u5373\u53ef\u5728\u8fd9\u91cc\u6311\u9009\u3002</p>';
      return;
    }
    versions.slice(0, 5).forEach(function (version, index) {
      var item = document.createElement("article");
      var textLength = version.parts.body.join("").length;
      var tagCount = version.parts.tags.length;
      var qualityRecord = getQualityRecordForParts(draft.platform.id, version.parts);
      var qualityBadge = qualityRecord && qualityRecord.result
        ? '<span class="version-score is-scored">AI质检 ' + qualityRecord.result.score + '</span>'
        : '<span class="version-score">未评分</span>';
      item.className = "version-item";
      item.innerHTML =
        '<div class="version-item-main">' +
        '<span>' + (version.label || ("v" + (versions.length - index))) + " · " + version.time + '</span>' +
        '<strong>' + escapeHtml(version.title) + '</strong>' +
        '<small>' + textLength + ' \u5b57 · ' + tagCount + ' \u6807\u7b7e</small>' +
        '</div>' +
        '<div class="version-actions">' +
        qualityBadge +
        '<button class="secondary-button mini-button" type="button" data-action="use">\u4f7f\u7528\u6b64\u7248\u672c</button>' +
        '<button class="ghost-button mini-button" type="button" data-action="publish">\u8bbe\u4e3a\u53d1\u5e03\u7248</button>' +
        '</div>';
      item.querySelector('[data-action="use"]').addEventListener("click", function () {
        editedDrafts[draft.platform.id] = cloneParts(version.parts);
        previewDirty = false;
        render();
        showToast("\u5df2\u5207\u6362\u5230" + (version.label || "\u5386\u53f2\u7248\u672c"));
      });
      item.querySelector('[data-action="publish"]').addEventListener("click", function () {
        publishSelections[draft.platform.id] = version.id;
        render();
        showToast("\u5df2\u5c06" + (version.label || "\u5386\u53f2\u7248\u672c") + "\u8bbe\u4e3a\u53d1\u5e03\u7248");
      });
      box.appendChild(item);
    });
  }

  function renderDiffPanel(draft) {
    var aiParts = draftToParts(draft);
    var savedParts = editedDrafts[draft.platform.id];
    if (!savedParts) {
      byId("diffPanel").innerHTML =
        '<div class="review-empty">' +
        '<strong>\u5c1a\u672a\u4ea7\u751f\u4eba\u5de5\u7248\u672c</strong>' +
        '<p>\u4f60\u53ef\u4ee5\u5728\u5de6\u4fa7\u5e73\u53f0\u7a3f\u4e2d\u76f4\u63a5\u4fee\u6539\u6807\u9898\u3001\u6458\u8981\u6216\u6b63\u6587\uff0c\u70b9\u51fb\u300c\u4fdd\u5b58\u5f53\u524d\u7248\u672c\u300d\u540e\uff0c\u8fd9\u91cc\u4f1a\u5bf9\u6bd4 AI \u539f\u7a3f\u548c\u4f60\u7684\u4eba\u5de5\u7a3f\u3002</p>' +
        '</div>';
      return;
    }
    var currentParts = savedParts;
    var rows = [
      ["\u6807\u9898", aiParts.title, currentParts.title],
      ["\u6458\u8981", aiParts.summary, currentParts.summary],
      ["\u6b63\u6587", aiParts.body.join("\n"), currentParts.body.join("\n")],
    ];
    var changedRows = rows.filter(function (row) {
      return row[1] !== row[2];
    });
    if (!changedRows.length) {
      byId("diffPanel").innerHTML =
        '<div class="review-empty">' +
        '<strong>\u5df2\u4fdd\u5b58\uff0c\u4f46\u4e0e AI \u539f\u7a3f\u4e00\u81f4</strong>' +
        '<p>\u5f53\u524d\u7248\u672c\u6ca1\u6709\u5b9e\u8d28\u4fee\u6539\u3002\u5982\u679c\u8981\u505a\u53d1\u5e03\u524d\u786e\u8ba4\uff0c\u53ef\u4ee5\u5148\u8c03\u6574\u4e00\u4e0b\u6807\u9898\u3001\u5f00\u5934\u6216\u7ed3\u5c3e\u4e92\u52a8\u518d\u4fdd\u5b58\u3002</p>' +
        '</div>';
      return;
    }
    var aiLength = aiParts.body.join("").length;
    var currentLength = currentParts.body.join("").length;
    var lengthDelta = currentLength - aiLength;
    byId("diffPanel").innerHTML =
      '<div class="diff-summary">' +
      '<strong>\u4fee\u6539\u5f71\u54cd</strong>' +
      '<span>\u53d8\u66f4\u5b57\u6bb5\uff1a' + changedRows.map(function (row) { return row[0]; }).join("\u3001") + '</span>' +
      '<span>\u6b63\u6587\u5b57\u6570\uff1a' + (lengthDelta >= 0 ? "+" : "") + lengthDelta + '</span>' +
      '<span>\u5efa\u8bae\uff1a\u4fdd\u5b58\u540e\u5230\u8d28\u68c0\u8bc4\u5206\u91cd\u65b0\u786e\u8ba4\u5e73\u53f0\u5339\u914d\u5ea6</span>' +
      '</div>' +
      '<div class="diff-head"><span>AI\u539f\u7a3f</span><span>\u5f53\u524d\u7a3f</span></div>' +
      rows.map(function (row) {
        var changed = row[1] !== row[2];
        return '<section class="diff-row' + (changed ? " is-changed" : "") + '">' +
          '<h4>' + row[0] + (changed ? " · \u5df2\u4fee\u6539" : " · \u672a\u53d8\u66f4") + '</h4>' +
          '<div><pre>' + escapeHtml(row[1]) + '</pre><pre>' + escapeHtml(row[2]) + '</pre></div>' +
          '</section>';
      }).join("");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderChecks(draft) {
    var list = byId("checkList");
    list.innerHTML = "";
    draft.checks.forEach(function (check) {
      var li = document.createElement("li");
      li.className = check.ok ? "pass" : "warn";
      li.innerHTML = "<span>" + (check.ok ? "\u901a\u8fc7" : "\u6ce8\u610f") + "</span>" + check.text;
      list.appendChild(li);
    });
  }

  function renderInlineQuality(draft) {
    var panel = byId("inlineQualityPanel");
    if (!panel) return;
    renderQualityBox(panel, draft, "\u5f53\u524d\u7a3fAI\u8d28\u68c0");
  }

  function renderQualityBox(panel, draft, scoreLabel) {
    var scoredDraft = getEffectiveDraftForScoring(draft);
    var key = qualityKey(scoredDraft);
    var record = getQualityRecord(draft);
    var button = byId("rescoreBtn");
    if (button) {
      button.disabled = Boolean(qualityLoading[draft.platform.id]);
      button.textContent = record && record.result ? "\u91cd\u65b0AI\u8d28\u68c0" : "\u5f00\u59cbAI\u8d28\u68c0";
    }

    if (!generationCount) {
      panel.innerHTML = '<p class="empty-state">\u751f\u6210\u5e73\u53f0\u7a3f\u540e\uff0c\u53ef\u4e3b\u52a8\u70b9\u51fb\u300c\u5f00\u59cbAI\u8d28\u68c0\u300d\u68c0\u67e5\u5f53\u524d\u7248\u672c\u3002</p>';
      return;
    }

    if (previewDirty && draft.platform.id === selectedId) {
      panel.innerHTML = '<p class="score-stale">\u5f53\u524d\u7a3f\u6709\u672a\u4fdd\u5b58\u4fee\u6539\u3002AI \u8d28\u68c0\u4e0d\u4f1a\u5728\u8f93\u5165\u4e2d\u53cd\u590d\u6d88\u8017 API\uff0c\u8bf7\u5148\u4fdd\u5b58\u7248\u672c\uff0c\u9700\u8981\u65f6\u518d\u70b9\u51fb\u300c\u5f00\u59cbAI\u8d28\u68c0\u300d\u3002</p>';
      return;
    }

    if (qualityLoading[draft.platform.id]) {
      panel.innerHTML = '<p class="score-stale">AI \u8d28\u68c0\u4e2d\uff1a\u6b63\u5728\u5206\u6790\u5e73\u53f0\u5339\u914d\u3001\u98ce\u9669\u548c\u6539\u8fdb\u5efa\u8bae\u3002\u4f60\u53ef\u4ee5\u7ee7\u7eed\u7f16\u8f91\uff0c\u5f53\u524d\u7ed3\u679c\u4f1a\u7ed1\u5b9a\u5230\u9001\u68c0\u65f6\u7684\u7248\u672c\u3002</p>';
      return;
    }

    if (!record) {
      panel.innerHTML = '<p class="empty-state">\u5c1a\u672a\u5bf9\u5f53\u524d\u7248\u672c\u8fdb\u884c AI \u8d28\u68c0\u3002\u5982\u679c\u8fd9\u4e2a\u7248\u672c\u503c\u5f97\u68c0\u67e5\uff0c\u70b9\u51fb\u300c\u5f00\u59cbAI\u8d28\u68c0\u300d\u3002</p>';
      return;
    }

    if (record.key !== key) {
      panel.innerHTML = '<p class="score-stale">\u5f53\u524d\u7a3f\u548c\u4e0a\u6b21\u8d28\u68c0\u7248\u672c\u4e0d\u4e00\u81f4\u3002\u53ef\u4ee5\u7ee7\u7eed\u4fdd\u5b58\u7248\u672c\uff0c\u9700\u8981\u65f6\u518d\u4e3b\u52a8\u5f00\u59cb AI \u8d28\u68c0\u3002</p>';
      return;
    }

    if (record.error) {
      panel.innerHTML = '<p class="score-error">AI \u8d28\u68c0\u672a\u5b8c\u6210\uff1a' + escapeHtml(record.error) + '<br />\u8bf7\u786e\u8ba4 .env \u5df2\u914d\u7f6e AI_API_BASE_URL\u3001AI_API_KEY \u548c AI_MODEL\u3002</p>';
      return;
    }

    var result = record.result;
    panel.innerHTML =
      '<div class="inline-quality-score"><strong>' + result.score + '</strong><span>' + scoreLabel + '</span></div>' +
      (result.summary ? '<p class="quality-summary">' + escapeHtml(result.summary) + '</p>' : "") +
      '<div class="inline-quality-grid">' +
      result.items.map(function (item) {
        return '<div><span>' + item.label + '</span><meter min="0" max="100" value="' + item.value + '"></meter><strong>' + item.value + '</strong></div>';
      }).join("") +
      '</div><ul class="quality-tips">' +
      result.tips.map(function (tip) {
        return "<li>" + escapeHtml(tip) + "</li>";
      }).join("") +
      "</ul>";
  }

  function qualityKey(draft) {
    return JSON.stringify({
      platform: draft.platform.id,
      title: draft.title,
      summary: draft.summary,
      body: draft.body,
      tags: draft.tags,
    });
  }

  function qualityKeyForParts(platformId, parts) {
    return JSON.stringify({
      platform: platformId,
      title: parts.title,
      summary: parts.summary,
      body: parts.body,
      tags: parts.tags,
    });
  }

  function getQualityRecord(draft) {
    var scoredDraft = getEffectiveDraftForScoring(draft);
    var key = qualityKey(scoredDraft);
    return getQualityRecordByKey(draft.platform.id, key);
  }

  function getQualityRecordForParts(platformId, parts) {
    return getQualityRecordByKey(platformId, qualityKeyForParts(platformId, parts));
  }

  function getQualityRecordByKey(platformId, key) {
    var latest = qualityResults[platformId];
    if (latest && latest.key === key) return latest;
    return qualityArchives[platformId] && qualityArchives[platformId][key];
  }

  function saveQualityRecord(platformId, key, record) {
    qualityResults[platformId] = record;
    if (!qualityArchives[platformId]) qualityArchives[platformId] = {};
    qualityArchives[platformId][key] = record;
  }

  async function requestAiQuality(draft) {
    var scoredDraft = getEffectiveDraftForScoring(draft);
    var key = qualityKey(scoredDraft);
    var platformId = draft.platform.id;
    qualityLoading[platformId] = true;
    hasScored = true;
    scoreDirty = false;
    render();

    try {
      var response = await fetch("/api/quality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: {
            id: scoredDraft.platform.id,
            name: scoredDraft.platform.name,
            profile: scoredDraft.platform.profile,
            maxTitle: scoredDraft.platform.maxTitle,
            lengthRange: [scoredDraft.platform.minLength, scoredDraft.platform.maxLength],
          },
          strategy: platformStrategies[scoredDraft.platform.id] || strategyTemplates[scoredDraft.platform.id],
          source: getInput(),
          draft: {
            title: scoredDraft.title,
            summary: scoredDraft.summary,
            body: scoredDraft.body,
            tags: scoredDraft.tags,
            metrics: scoredDraft.metrics,
          },
        }),
      });
      var data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "AI \u8d28\u68c0\u8bf7\u6c42\u5931\u8d25");
      }
      var result = normalizeQualityResult(data);
      if (!result.items.length || !result.tips.length) {
        throw new Error("\u6a21\u578b\u8fd4\u56de\u7684\u8d28\u68c0\u7ed3\u6784\u4e0d\u5b8c\u6574");
      }
      saveQualityRecord(platformId, key, { key: key, result: result });
      showToast("\u771f\u5b9e AI \u8d28\u68c0\u5b8c\u6210");
    } catch (error) {
      saveQualityRecord(platformId, key, { key: key, error: error.message || "\u672a\u77e5\u9519\u8bef" });
      showToast("AI \u8d28\u68c0\u5931\u8d25\uff0c\u672a\u4f7f\u7528\u6a21\u62df\u8bc4\u5206");
    } finally {
      qualityLoading[platformId] = false;
      render();
    }
  }

  function normalizeQualityResult(data) {
    var items = Array.isArray(data.items) ? data.items : [];
    return {
      score: clampScore(Number(data.score) || 0),
      summary: String(data.summary || ""),
      items: items.map(function (item) {
        return {
          label: String(item.label || "\u8d28\u68c0\u7ef4\u5ea6"),
          value: clampScore(Number(item.value) || 0),
        };
      }).filter(function (item) {
        return item.label;
      }).slice(0, 5),
      tips: (Array.isArray(data.tips) ? data.tips : []).map(String).filter(Boolean).slice(0, 4),
    };
  }

  function getEffectiveDraftForScoring(draft) {
    var parts = editedDrafts[draft.platform.id];
    if (!parts) return draft;
    var plainText = parts.body.join("");
    return Object.assign({}, draft, {
      title: parts.title,
      summary: parts.summary,
      body: parts.body.slice(),
      tags: parts.tags.slice(),
      metrics: {
        length: plainText.length,
        titleLength: parts.title.length,
        tagCount: parts.tags.length,
        sectionCount: parts.body.length,
      },
    });
  }

  function clampScore(value) {
    return Math.max(0, Math.min(100, value));
  }

  function renderMetrics(draft) {
    var metrics = [
      ["\u5b57\u6570", draft.metrics.length],
      ["\u6807\u9898\u957f\u5ea6", draft.metrics.titleLength],
      ["\u6807\u7b7e\u6570", draft.metrics.tagCount],
      ["\u7ed3\u6784\u5757", draft.metrics.sectionCount],
    ];
    var grid = byId("metricGrid");
    grid.innerHTML = "";
    metrics.forEach(function (item) {
      var box = document.createElement("div");
      box.className = "metric";
      box.innerHTML = "<span>" + item[0] + "</span><strong>" + item[1] + "</strong>";
      grid.appendChild(box);
    });
  }

  function renderPublishSummary() {
    var total = platforms.length;
    var latest = publishRecords.slice(0, total);
    var published = latest.filter(function (record) {
      return record.status === "\u5df2\u6a21\u62df\u53d1\u5e03";
    }).length;
    var publishing = latest.filter(function (record) {
      return record.status === "\u53d1\u5e03\u4e2d";
    }).length;
    var edited = platforms.filter(function (platform) {
      return Boolean(editedDrafts[platform.id]);
    }).length;
    var selectedVersions = platforms.filter(function (platform) {
      return getPublishSelection(platform.id) !== "ai";
    }).length;

    byId("publishSummary").innerHTML =
      '<div class="summary-item"><span>\u5e73\u53f0</span><strong>' + total + '</strong></div>' +
      '<div class="summary-item"><span>\u5df2\u53d1\u5e03</span><strong>' + published + '</strong></div>' +
      '<div class="summary-item"><span>\u53d1\u5e03\u4e2d</span><strong>' + publishing + '</strong></div>' +
      '<div class="summary-item"><span>\u9009\u7528\u7248\u672c</span><strong>' + selectedVersions + "/" + total + '</strong></div>';
  }

  function renderPublishVersionGrid() {
    var box = byId("publishVersionGrid");
    if (!box) return;
    box.innerHTML = "";
    platforms.forEach(function (platform) {
      var draft = makeDraft(platform, getInput());
      var selection = getPublishSelection(platform.id);
      var selectedParts = getPublishParts(platform, draft);
      var versions = draftVersions[platform.id] || [];
      var item = document.createElement("article");
      item.className = "publish-version-item";
      item.style.setProperty("--accent", platform.accent);

      var select = document.createElement("select");
      select.className = "text-input";
      select.dataset.platform = platform.id;
      select.appendChild(makeVersionOption("ai", "AI 当前稿"));
      versions.forEach(function (version) {
        select.appendChild(makeVersionOption(version.id, version.label + " · " + version.time));
      });
      select.value = selection;
      if (select.value !== selection) {
        publishSelections[platform.id] = "ai";
      }
      select.addEventListener("change", function () {
        publishSelections[platform.id] = select.value;
        render();
        showToast("\u5df2\u9009\u62e9" + platform.name + "\u7684\u53d1\u5e03\u7248\u672c");
      });

      item.innerHTML =
        '<div class="publish-version-head"><strong>' + platform.name + '</strong><span>' + (selection === "ai" ? "AI稿" : "\u4eba\u5de5\u7248") + '</span></div>' +
        '<p>' + escapeHtml(selectedParts.title) + '</p>' +
        '<small>' + selectedParts.body.join("").length + ' \u5b57 · ' + selectedParts.tags.length + ' \u6807\u7b7e</small>';
      item.appendChild(select);
      box.appendChild(item);
    });
  }

  function makeVersionOption(value, label) {
    var option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    return option;
  }

  function getPublishSelection(platformId) {
    var value = publishSelections[platformId] || "ai";
    if (value === "ai") return value;
    var versions = draftVersions[platformId] || [];
    return versions.some(function (version) {
      return version.id === value;
    }) ? value : "ai";
  }

  function renderPublisherGrid() {
    var box = byId("publisherGrid");
    box.innerHTML = "";
    platforms.forEach(function (platform) {
      var publisher = publishers[platform.id];
      var item = document.createElement("div");
      item.className = "publisher-item";
      item.innerHTML =
        '<div><strong>' + platform.name + '</strong><span>' + publisher.mode + '</span></div>' +
        '<p>\u5f53\u524d\uff1a' + publisher.current + '</p>' +
        '<p>\u53ef\u6269\u5c55\uff1a' + publisher.future + '</p>';
      box.appendChild(item);
    });
  }

  function renderPublishLog() {
    var box = byId("publishLog");
    box.innerHTML = "";
    if (!publishRecords.length) {
      box.innerHTML = '<p class="empty-state">\u6682\u65e0\u53d1\u5e03\u8bb0\u5f55</p>';
      return;
    }
    publishRecords.slice(0, 8).forEach(function (record) {
      var item = document.createElement("div");
      item.className = "log-item";
      item.innerHTML = '<span class="log-platform">' + record.platform + "</span><span>" + record.title + '</span><strong>' + record.status + '</strong><em>' + record.version + " · " + record.publisher + '</em>';
      box.appendChild(item);
    });
  }

  function generate() {
    generationCount += 1;
    composeStep = "input";
    aiSource = "\u672c\u5730\u6a21\u62df";
    sampleSource = "\u672a\u63d0\u4f9b\u53c2\u8003\u6837\u672c";
    aiDrafts = {};
    qualityResults = {};
    qualityArchives = {};
    publishSelections = {};
    hasScored = false;
    scoreDirty = false;
    byId("generateBtn").textContent = "\u751f\u6210\u4e2d";
    byId("generateBtn").disabled = true;
    byId("generationState").textContent = "\u6b63\u5728\u751f\u6210 4 \u4e2a\u5e73\u53f0\u7248\u672c";
    byId("generationBanner").textContent = "\u6b63\u5728\u751f\u6210 4 \u4e2a\u5e73\u53f0\u7248\u672c...";
    byId("generationBanner").classList.add("is-working");

    window.setTimeout(function () {
      byId("generateBtn").disabled = false;
      byId("generateBtn").textContent = "\u91cd\u65b0\u751f\u6210\u5e73\u53f0\u7a3f";
      byId("generationState").textContent = "\u5df2\u751f\u6210 4 \u4e2a\u5e73\u53f0\u7248\u672c";
      byId("generationBanner").classList.remove("is-working");
      composeStep = "draft";
      previewDirty = false;
      render();
      showToast(analysisCount ? "\u5df2\u57fa\u4e8e AI \u5e73\u53f0\u7b56\u7565\u751f\u6210\u7a3f\u4ef6" : "\u5df2\u751f\u6210\u516c\u4f17\u53f7\u3001\u77e5\u4e4e\u3001B\u7ad9\u3001\u5c0f\u7ea2\u4e66\u7a3f\u4ef6");
    }, 250);
  }

  function publishAll() {
    var input = getInput();
    var created = [];
    platforms.forEach(function (platform) {
      var draft = makeDraft(platform, input);
      var parts = getPublishParts(platform, draft);
      var record = {
        platform: platform.name,
        title: parts.title,
        status: "\u53d1\u5e03\u4e2d",
        publisher: publishers[platform.id].current,
        channel: publishers[platform.id].future,
        version: getPublishLabel(platform.id),
        body: partsToText(parts),
      };
      created.push(record);
      publishRecords.unshift(record);
    });
    renderPublishLog();
    showToast("\u6b63\u5728\u901a\u8fc7 MockPublisher \u6a21\u62df\u5e73\u53f0\u53d1\u5e03\u901a\u9053");
    window.setTimeout(function () {
      created.forEach(function (record) {
        record.status = "\u5df2\u6a21\u62df\u53d1\u5e03";
      });
      renderPublishSummary();
      renderPublishLog();
      showToast("\u5df2\u5b8c\u6210 4 \u4e2a\u5e73\u53f0\u7684\u6a21\u62df\u53d1\u5e03");
    }, 650);
  }

  function copyCurrent() {
    var draft = makeDraft(getSelectedPlatform(), getInput());
    var value = getEffectiveDraftText(draft);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(function () {
        showToast("\u5df2\u590d\u5236\u5f53\u524d\u53d1\u5e03\u7a3f");
      });
    } else {
      showToast("\u5f53\u524d\u6d4f\u89c8\u5668\u4e0d\u652f\u6301\u81ea\u52a8\u590d\u5236");
    }
  }

  function exportAllDrafts() {
    var input = getInput();
    var exportedAt = new Date().toLocaleString();
    var content = [
      "# CreatorFlow \u591a\u5e73\u53f0\u53d1\u5e03\u7a3f",
      "",
      "- \u5bfc\u51fa\u65f6\u95f4\uff1a" + exportedAt,
      "- \u539f\u59cb\u6807\u9898\uff1a" + input.title,
      "- \u76ee\u6807\u53d7\u4f17\uff1a" + input.audience,
      "- AI \u7206\u6b3e\u5206\u6790\uff1a" + (analysisCount ? "\u5df2\u5b8c\u6210" : "\u672a\u624b\u52a8\u89e6\u53d1\uff0c\u4f7f\u7528\u9884\u7f6e\u7b56\u7565"),
      "- \u7b56\u7565\u6765\u6e90\uff1a" + sampleSource,
      "",
    ];

    platforms.forEach(function (platform) {
      var draft = makeDraft(platform, input);
      var strategy = platformStrategies[platform.id] || strategyTemplates[platform.id];
      var parts = getPublishParts(platform, draft);
      var publishLabel = getPublishLabel(platform.id);
      content = content.concat([
        "## " + platform.name,
        "",
        "- \u53d1\u5e03\u7248\u672c\uff1a" + publishLabel,
        "- \u7b56\u7565\u91cd\u70b9\uff1a" + strategy.headline,
        "- \u98ce\u9669\u63d0\u9192\uff1a" + strategy.risk,
        "- AI\u6539\u5199\u8bf4\u660e\uff1a" + draft.explanation.sections.map(function (item) {
          return item.label + "\uff1a" + item.text;
        }).join(" | "),
        "",
        partsToText(parts),
        "",
      ]);
    });

    downloadText("creatorflow-platform-drafts.md", content.join("\n"));
    showToast("\u5df2\u5bfc\u51fa\u5168\u90e8\u5e73\u53f0\u7a3f");
  }

  function downloadText(filename, content) {
    var blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function getEffectiveDraftText(draft) {
    return partsToText(editedDrafts[draft.platform.id] || draftToParts(draft));
  }

  function getPublishParts(platform, draft) {
    var selection = getPublishSelection(platform.id);
    if (selection === "ai") return draftToParts(draft);
    var version = (draftVersions[platform.id] || []).find(function (item) {
      return item.id === selection;
    });
    return version ? cloneParts(version.parts) : draftToParts(draft);
  }

  function getPublishLabel(platformId) {
    var selection = getPublishSelection(platformId);
    if (selection === "ai") return "AI \u5f53\u524d\u7a3f";
    var version = (draftVersions[platformId] || []).find(function (item) {
      return item.id === selection;
    });
    return version ? version.label + " · " + version.time : "AI \u5f53\u524d\u7a3f";
  }

  function draftToParts(draft) {
    return {
      title: draft.title,
      summary: draft.summary,
      body: draft.body.slice(),
      tags: draft.tags.slice(),
    };
  }

  function partsToText(parts) {
    return [parts.title, "", parts.summary, ""].concat(parts.body, ["", parts.tags.map(function (tag) {
      return "#" + tag;
    }).join(" ")]).join("\n");
  }

  function cloneParts(parts) {
    return {
      title: parts.title,
      summary: parts.summary,
      body: parts.body.slice(),
      tags: parts.tags.slice(),
    };
  }

  function readPreviewParts(draft) {
    return {
      title: byId("previewTitle").innerText.trim() || draft.title,
      summary: byId("previewSummary").innerText.trim() || draft.summary,
      body: byId("previewBody").innerText.split(/\n+/).map(function (line) {
        return line.trim();
      }).filter(Boolean),
      tags: draft.tags.slice(),
    };
  }

  function saveManualEdit() {
    var platform = getSelectedPlatform();
    var draft = makeDraft(platform, getInput());
    var parts = readPreviewParts(draft);
    if (!parts.body.length) {
      showToast("\u5f53\u524d\u7a3f\u4ef6\u4e0d\u80fd\u4e3a\u7a7a");
      return;
    }
    editedDrafts[platform.id] = cloneParts(parts);
    previewDirty = false;
    if (!draftVersions[platform.id]) draftVersions[platform.id] = [];
    var versionId = "v_" + Date.now() + "_" + Math.random().toString(16).slice(2);
    var versionLabel = "v" + (draftVersions[platform.id].length + 1);
    draftVersions[platform.id].unshift({
      id: versionId,
      label: versionLabel,
      time: new Date().toLocaleTimeString(),
      title: parts.title,
      parts: cloneParts(parts),
    });
    publishSelections[platform.id] = versionId;
    draftVersions[platform.id] = draftVersions[platform.id].slice(0, 8);
    render();
    showToast("\u5df2\u4fdd\u5b58" + platform.name + "\u5f53\u524d\u7248\u672c");
  }

  function restoreAiDraft() {
    var platform = getSelectedPlatform();
    delete editedDrafts[platform.id];
    previewDirty = false;
    render();
    showToast("\u5df2\u6062\u590d" + platform.name + " AI \u7248\u672c");
  }

  function loadSample() {
    byId("sourceTitle").value = "\u5982\u4f55\u628a\u4e00\u7bc7\u5185\u5bb9\u9ad8\u6548\u53d1\u5e03\u5230\u591a\u4e2a\u5e73\u53f0";
    byId("sourceBody").value = "\u5f88\u591a\u521b\u4f5c\u8005\u4f1a\u5148\u5199\u4e00\u7bc7\u5b8c\u6574\u7a3f\u4ef6\uff0c\u518d\u5206\u522b\u590d\u5236\u5230\u516c\u4f17\u53f7\u3001\u77e5\u4e4e\u3001B\u7ad9\u3001\u5c0f\u7ea2\u4e66\u7b49\u5e73\u53f0\u3002\n\n\u66f4\u597d\u7684\u65b9\u5f0f\u662f\u4fdd\u7559\u540c\u4e00\u4e2a\u6838\u5fc3\u89c2\u70b9\uff0c\u518d\u9488\u5bf9\u5e73\u53f0\u8fdb\u884c\u683c\u5f0f\u5316\u9002\u914d\u3002\n\n\u8fd9\u4e2a\u5de5\u5177\u5e0c\u671b\u628a\u91cd\u590d\u52b3\u52a8\u81ea\u52a8\u5316\uff0c\u8f93\u5165\u4e00\u4efd\u4e3b\u7a3f\u5c31\u80fd\u751f\u6210\u4e0d\u540c\u5e73\u53f0\u7248\u672c\u3002";
    byId("sampleInput").value = "\u6837\u672c1\uff1a\u65b0\u624b\u505a\u5185\u5bb9\u6700\u5bb9\u6613\u5361\u5728\u4e00\u7a3f\u591a\u53d1\uff0c\u5efa\u8bae\u5148\u62c6\u5e73\u53f0\u89c4\u5219\uff0c\u518d\u6539\u6807\u9898\u548c\u7ed3\u6784\u3002\n---\n\u6837\u672c2\uff1a\u4e0d\u8981\u76f4\u63a5\u590d\u5236\u540c\u4e00\u7bc7\u7b14\u8bb0\uff0c\u5c0f\u7ea2\u4e66\u8981\u6e05\u5355\u5316\uff0c\u77e5\u4e4e\u8981\u8bb2\u903b\u8f91\uff0cB\u7ad9\u8981\u7ed9\u770b\u70b9\u65f6\u95f4\u8f74\u3002";
    byId("audienceInput").value = "\u4e2a\u4eba\u521b\u4f5c\u8005\u548c\u65b0\u5a92\u4f53\u8fd0\u8425";
    render();
    showToast("\u6837\u4f8b\u5185\u5bb9\u5df2\u8f7d\u5165");
  }

  function resetDemo() {
    byId("sourceTitle").value = "";
    byId("sourceBody").value = "";
    byId("sampleInput").value = "";
    byId("audienceInput").value = "";
    generationCount = 0;
    analysisCount = 0;
    hasScored = false;
    scoreDirty = false;
    previewDirty = false;
    aiRendering = false;
    qualityResults = {};
    qualityArchives = {};
    qualityLoading = {};
    platformStrategies = {};
    editedDrafts = {};
    draftVersions = {};
    aiDrafts = {};
    aiSource = "\u672c\u5730\u6a21\u62df";
    sampleSource = "\u672a\u63d0\u4f9b\u53c2\u8003\u6837\u672c";
    publishRecords = [];
    publishSelections = {};
    composeStep = "input";
    render();
    showToast("\u6f14\u793a\u6570\u636e\u5df2\u91cd\u7f6e");
  }

  function showToast(message) {
    var toast = byId("toast");
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2200);
  }

  function bind() {
    ["sourceTitle", "sourceBody", "sampleInput", "audienceInput", "toneSelect", "tagToggle", "ctaToggle"].forEach(function (id) {
      byId(id).addEventListener("input", function () {
        render();
      });
      byId(id).addEventListener("change", function () {
        render();
      });
    });
    byId("generateBtn").addEventListener("click", generate);
    byId("analyzeBtn").addEventListener("click", analyzePlatformTrends);
    byId("realAiBtn").addEventListener("click", callRealAi);
    byId("optimizeCurrentBtn").addEventListener("click", optimizeCurrentPlatform);
    byId("publishBtn").addEventListener("click", publishAll);
    byId("copyDraftBtn").addEventListener("click", copyCurrent);
    byId("exportBtn").addEventListener("click", exportAllDrafts);
    byId("saveEditBtn").addEventListener("click", saveManualEdit);
    byId("restoreDraftBtn").addEventListener("click", restoreAiDraft);
    ["previewTitle", "previewSummary", "previewBody"].forEach(function (id) {
      byId(id).addEventListener("input", function () {
        if (aiRendering) return;
        previewDirty = true;
        renderTaskStatus(makeDraft(getSelectedPlatform(), getInput()));
        renderInlineQuality(makeDraft(getSelectedPlatform(), getInput()));
      });
    });
    byId("backToInputBtn").addEventListener("click", function () {
      composeStep = "input";
      previewDirty = false;
      render();
      showToast("\u5df2\u8fd4\u56de\u539f\u59cb\u5185\u5bb9\u8f93\u5165");
    });
    byId("rescoreBtn").addEventListener("click", function () {
      requestAiQuality(makeDraft(getSelectedPlatform(), getInput()));
    });
    byId("loadSampleBtn").addEventListener("click", loadSample);
    byId("resetDemoBtn").addEventListener("click", resetDemo);
    Array.prototype.forEach.call(document.querySelectorAll(".nav-item"), function (button) {
      button.addEventListener("click", function () {
        switchView(button.dataset.view);
      });
    });
  }

  async function checkAiStatus() {
    var status = byId("aiStatus");
    if (!status) return;
    try {
      var response = await fetch("/api/health");
      var data = await response.json();
      if (data.ok) {
        status.textContent = "\u771f\u5b9eAI\u5df2\u8fde\u63a5\uff1a" + data.model;
        status.className = "ai-status is-ready";
      } else {
        status.textContent = "\u672a\u914d\u7f6eAI\uff0c\u4f7f\u7528\u672c\u5730\u6a21\u62df";
        status.className = "ai-status is-mock";
      }
    } catch {
      status.textContent = "\u9759\u6001\u6a21\u5f0f\uff0c\u4f7f\u7528\u672c\u5730\u6a21\u62df";
      status.className = "ai-status is-mock";
    }
  }

  function switchView(view) {
    Array.prototype.forEach.call(document.querySelectorAll(".nav-item"), function (button) {
      button.classList.toggle("is-active", button.dataset.view === view);
    });
    Array.prototype.forEach.call(document.querySelectorAll(".view-section"), function (section) {
      section.classList.toggle("is-active", section.id === "view-" + view);
    });
    byId("currentViewEyebrow").textContent = viewMeta[view][0];
    byId("currentViewTitle").textContent = viewMeta[view][1];
  }

  window.addEventListener("error", function (event) {
    var banner = byId("generationBanner");
    if (banner) {
      banner.textContent = "\u9875\u9762\u811a\u672c\u62a5\u9519\uff1a" + event.message;
      banner.classList.add("is-working");
    }
  });

  bind();
  checkAiStatus();
  render();
}());
